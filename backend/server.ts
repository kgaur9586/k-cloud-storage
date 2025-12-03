import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { sequelize, setupAssociations } from './src/models/index.js';
import { logger } from './src/utils/logger.js';
import authRoutes from './src/routes/auth.routes.js';
import fileRoutes from './src/routes/file.routes.js';
import folderRoutes from './src/routes/folder.routes.js';
import publicRoutes from './src/routes/publicRoutes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import trashRoutes from './src/routes/trash.routes.js';
import versionRoutes from './src/routes/version.routes.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { setupSwagger } from './src/config/swagger.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure for production
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();

  // Log response when finished
  res.on('finish', async () => {
    const duration = Date.now() - start;

    // Only log if not a health check
    if (req.path !== '/health') {
      await logger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId: req.dbUser?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
  });

  next();
});

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Swagger API Documentation
setupSwagger(app);

// Public routes (no authentication)
app.use('/api/public', publicRoutes);

// API routes (authenticated)
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes); // Note: version routes are mounted under /api/files in server.ts? No, usually separate or nested.
// Let's mount it under /api/files for consistency with the route definition which expects /:fileId/versions
// Wait, if I mount it at /api/files, it might conflict with fileRoutes if not careful.
// fileRoutes probably handles /:id.
// If I mount versionRoutes at /api/files, and versionRoutes has /:fileId/versions, it will match /api/files/:fileId/versions.
// But fileRoutes might catch it first if it has /:id.
// Let's check fileRoutes.
app.use('/api/folders', folderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/files', versionRoutes); // Mount version routes also under /api/files to match the path structure

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Start server and initialize database
 */
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await logger.info('Database connected', {
      database: process.env.DB_NAME,
    });

    // Setup model associations
    setupAssociations();
    console.log('✅ Model associations configured');

    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('✅ Database models synchronized');
      await logger.info('Database models synchronized');
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🔐 Logto endpoint: ${process.env.LOGTO_ENDPOINT}`);
      console.log(`📊 Axiom dataset: ${process.env.AXIOM_DATASET}`);

      logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV,
      });
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error);
    await logger.error('Server startup failed', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await logger.info('Server shutting down');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  await logger.info('Server shutting down');
  await sequelize.close();
  process.exit(0);
});

startServer();

export default app;
