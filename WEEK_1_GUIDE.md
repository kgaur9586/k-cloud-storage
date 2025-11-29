# Week 1: Project Setup & Authentication - Detailed Implementation Guide

## Overview

Week 1 focuses on establishing the foundation of your personal cloud storage project. By the end of this week, you'll have:
- ✅ Complete development environment
- ✅ Project structure for backend and frontend
- ✅ Database setup with initial schema
- ✅ Logto authentication fully integrated
- ✅ Basic user management
- ✅ Protected routes working

**Estimated Time**: 30-40 hours (5-6 hours per day)

---

## Day 1: Development Environment & Project Initialization

### Morning Session (2-3 hours)

#### 1.1 Install Prerequisites

```bash
# Verify Node.js version
node --version  # Should be 18+
npm --version   # Should be 9+

# If not installed, install Node.js
# Visit: https://nodejs.org/

# Install PostgreSQL
# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql@14
brew services start postgresql@14

# Windows:
# Download from https://www.postgresql.org/download/windows/

# Install Redis
# Ubuntu/Debian:
sudo apt install redis-server
sudo systemctl start redis

# macOS:
brew install redis
brew services start redis

# Verify installations
psql --version
redis-cli --version
```

#### 1.2 Create Project Structure

```bash
# Create main project directory
mkdir personal-cloud-storage
cd personal-cloud-storage

# Initialize Git repository
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
echo ".DS_Store" >> .gitignore

# Create main directories
mkdir backend frontend docs

# Initial commit
git add .
git commit -m "Initial project structure"
```

#### 1.3 Set Up Logto Account

**Option A: Logto Cloud (Recommended for Week 1)**

1. Visit [https://cloud.logto.io](https://cloud.logto.io)
2. Sign up for a free account
3. Create a new tenant (e.g., "personal-cloud-dev")
4. Create an application:
   - Name: "Personal Cloud Storage"
   - Type: "Traditional Web"
   - Note the credentials:
     - App ID
     - App Secret
     - Endpoint URL

**Option B: Self-Hosted Logto (Optional)**

```bash
# Using Docker
docker run -d \
  --name logto \
  -p 3001:3001 \
  -p 3002:3002 \
  -e DB_URL=postgresql://postgres:password@localhost:5432/logto \
  svhd/logto

# Access Logto Console at http://localhost:3002
```

#### 1.4 Set Up Axiom Account

1. Visit [https://axiom.co](https://axiom.co)
2. Sign up for a free account
3. Create a dataset: "cloud-storage-logs"
4. Generate an API token:
   - Settings → API Tokens → Create Token
   - Name: "Cloud Storage Dev"
   - Copy the token (you won't see it again!)

### Afternoon Session (2-3 hours)

#### 1.5 Backend Project Setup

```bash
cd backend

# Initialize Node.js project
npm init -y

# Update package.json
# Add "type": "module" for ES6 modules
```

**package.json:**
```json
{
  "name": "personal-cloud-storage-backend",
  "version": "1.0.0",
  "description": "Personal cloud storage backend with AI features",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "keywords": ["cloud-storage", "ai", "personal"],
  "author": "Your Name",
  "license": "MIT"
}
```

#### 1.6 Install Backend Dependencies

```bash
# Core dependencies
npm install express cors dotenv
npm install @logto/node express-session
npm install pg sequelize
npm install @axiomhq/js
npm install multer
npm install joi
npm install bull redis
npm install helmet express-rate-limit

# Dev dependencies
npm install -D nodemon
npm install -D eslint prettier
npm install -D jest supertest
npm install -D @babel/preset-env
```

#### 1.7 Create Backend Directory Structure

```bash
# Create directories
mkdir -p src/{config,middleware,routes,controllers,services,models,utils,workers}
mkdir -p tests/{unit,integration}
mkdir -p logs
mkdir -p data/files/{originals,thumbnails,temp}

# Create initial files
touch server.js
touch src/config/{database.js,logto.js,axiom.js,redis.js}
touch src/middleware/{logto.js,errorHandler.js,rateLimiter.js}
touch src/routes/{auth.routes.js,user.routes.js}
touch src/controllers/{authController.js,userController.js}
touch src/models/{User.js,index.js}
touch src/utils/{logger.js,helpers.js}
touch .env.example
touch .env
```

#### 1.8 Configure Environment Variables

**backend/.env:**
```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_storage_dev
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Session
SESSION_SECRET=your_super_secret_session_key_change_this_in_production

# Logto Authentication
LOGTO_ENDPOINT=https://your-tenant.logto.app
LOGTO_APP_ID=your_app_id
LOGTO_APP_SECRET=your_app_secret
LOGTO_REDIRECT_URI=http://localhost:3000/api/auth/callback
LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost:3000

# Axiom Logging
AXIOM_TOKEN=your_axiom_token
AXIOM_DATASET=cloud-storage-logs

# File Storage
STORAGE_PATH=./data/files
MAX_FILE_SIZE=10737418240
ALLOWED_FILE_TYPES=*

# CORS
FRONTEND_URL=http://localhost:5173
```

**Copy to .env.example** (without sensitive values)

---

## Day 2: Database Setup & Models

### Morning Session (2-3 hours)

#### 2.1 Create PostgreSQL Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Or on macOS/Windows:
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE cloud_storage_dev;

-- Create user (if needed)
CREATE USER cloud_user WITH ENCRYPTED PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cloud_storage_dev TO cloud_user;

-- Connect to database
\c cloud_storage_dev

-- Verify connection
\dt
\q
```

#### 2.2 Configure Sequelize

**src/config/database.js:**
```javascript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default sequelize;
```

#### 2.3 Create User Model

**src/models/User.js:**
```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  logtoUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'logto_user_id',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  storageQuota: {
    type: DataTypes.BIGINT,
    defaultValue: 10737418240, // 10GB
    field: 'storage_quota',
  },
  storageUsed: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'storage_used',
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

export default User;
```

**src/models/index.js:**
```javascript
import sequelize from '../config/database.js';
import User from './User.js';

const models = {
  User,
};

// Define associations here when you add more models
// Example: User.hasMany(File);

export { sequelize, models };
export default models;
```

#### 2.4 Create Database Sync Script

**src/config/sync-db.js:**
```javascript
import { sequelize } from '../models/index.js';
import { logger } from '../utils/logger.js';

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

syncDatabase();
```

**Add to package.json scripts:**
```json
"scripts": {
  "db:sync": "node src/config/sync-db.js"
}
```

### Afternoon Session (2-3 hours)

#### 2.5 Set Up Axiom Logger

**src/config/axiom.js:**
```javascript
import { Axiom } from '@axiomhq/js';
import dotenv from 'dotenv';

dotenv.config();

export const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN,
});

export const DATASET = process.env.AXIOM_DATASET || 'cloud-storage-logs';
```

**src/utils/logger.js:**
```javascript
import { axiom, DATASET } from '../config/axiom.js';

class Logger {
  async log(level, message, metadata = {}) {
    const logEntry = {
      _time: new Date().toISOString(),
      level,
      message,
      ...metadata,
      environment: process.env.NODE_ENV,
      service: 'cloud-storage-backend',
    };

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🐛',
      }[level] || '📝';
      
      console.log(`${emoji} [${level.toUpperCase()}]`, message, metadata);
    }

    // Send to Axiom
    try {
      await axiom.ingest(DATASET, [logEntry]);
    } catch (error) {
      console.error('Failed to send log to Axiom:', error.message);
    }
  }

  info(message, metadata = {}) {
    return this.log('info', message, metadata);
  }

  warn(message, metadata = {}) {
    return this.log('warn', message, metadata);
  }

  error(message, metadata = {}) {
    return this.log('error', message, metadata);
  }

  debug(message, metadata = {}) {
    return this.log('debug', message, metadata);
  }
}

export const logger = new Logger();
```

#### 2.6 Test Database Connection

```bash
# Run database sync
npm run db:sync

# You should see:
# ✅ Database connection established successfully.
# ✅ All models synchronized successfully.

# Verify in PostgreSQL
psql -U postgres -d cloud_storage_dev -c "\dt"
# Should show 'users' table
```

---

## Day 3: Logto Authentication Integration

### Morning Session (3-4 hours)

#### 3.1 Configure Logto

**src/config/logto.js:**
```javascript
import LogtoClient from '@logto/node';
import dotenv from 'dotenv';

dotenv.config();

export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT,
  appId: process.env.LOGTO_APP_ID,
  appSecret: process.env.LOGTO_APP_SECRET,
  redirectUri: process.env.LOGTO_REDIRECT_URI,
  postLogoutRedirectUri: process.env.LOGTO_POST_LOGOUT_REDIRECT_URI,
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

export const createLogtoClient = () => new LogtoClient(logtoConfig);
```

#### 3.2 Create Logto Middleware

**src/middleware/logto.js:**
```javascript
import { createLogtoClient } from '../config/logto.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const logtoClient = createLogtoClient();
    const isAuthenticated = await logtoClient.isAuthenticated(req);

    if (!isAuthenticated) {
      await logger.warn('Unauthorized access attempt', {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user info from Logto
    const claims = await logtoClient.getIdTokenClaims(req);
    
    // Find or create user in our database
    let user = await User.findOne({ where: { logtoUserId: claims.sub } });
    
    if (!user) {
      user = await User.create({
        logtoUserId: claims.sub,
        email: claims.email,
        name: claims.name,
        picture: claims.picture,
      });
      
      await logger.info('New user created', {
        userId: user.id,
        email: user.email,
      });
    }

    // Attach user to request
    req.user = user;
    req.logtoUser = claims;

    next();
  } catch (error) {
    await logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const logtoClient = createLogtoClient();
    const isAuthenticated = await logtoClient.isAuthenticated(req);

    if (isAuthenticated) {
      const claims = await logtoClient.getIdTokenClaims(req);
      const user = await User.findOne({ where: { logtoUserId: claims.sub } });
      
      if (user) {
        req.user = user;
        req.logtoUser = claims;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
```

#### 3.3 Create Auth Controller

**src/controllers/authController.js:**
```javascript
import { createLogtoClient } from '../config/logto.js';
import { logger } from '../utils/logger.js';

export const signIn = async (req, res) => {
  try {
    const logtoClient = createLogtoClient();
    await logtoClient.signIn(req, res);
  } catch (error) {
    await logger.error('Sign-in error', { error: error.message });
    res.status(500).json({ error: 'Failed to initiate sign-in' });
  }
};

export const handleCallback = async (req, res) => {
  try {
    const logtoClient = createLogtoClient();
    await logtoClient.handleSignInCallback(req, res);
    
    await logger.info('User signed in successfully', {
      ip: req.ip,
    });
    
    // Redirect to frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  } catch (error) {
    await logger.error('Callback error', { error: error.message });
    res.redirect(`${process.env.FRONTEND_URL}/error?message=auth_failed`);
  }
};

export const signOut = async (req, res) => {
  try {
    const logtoClient = createLogtoClient();
    
    await logger.info('User signed out', {
      userId: req.user?.id,
    });
    
    await logtoClient.signOut(req, res);
  } catch (error) {
    await logger.error('Sign-out error', { error: error.message });
    res.status(500).json({ error: 'Failed to sign out' });
  }
};

export const getMe = async (req, res) => {
  try {
    const logtoClient = createLogtoClient();
    const isAuthenticated = await logtoClient.isAuthenticated(req);

    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const claims = await logtoClient.getIdTokenClaims(req);
    const user = req.user;

    res.json({
      id: user.id,
      logtoUserId: user.logtoUserId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      storageQuota: user.storageQuota,
      storageUsed: user.storageUsed,
      role: user.role,
      claims,
    });
  } catch (error) {
    await logger.error('Get user error', { error: error.message });
    res.status(500).json({ error: 'Failed to get user info' });
  }
};
```

#### 3.4 Create Auth Routes

**src/routes/auth.routes.js:**
```javascript
import express from 'express';
import { signIn, handleCallback, signOut, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/logto.js';

const router = express.Router();

router.get('/sign-in', signIn);
router.get('/callback', handleCallback);
router.get('/sign-out', signOut);
router.get('/me', requireAuth, getMe);

export default router;
```

### Afternoon Session (2-3 hours)

#### 3.5 Create Error Handler Middleware

**src/middleware/errorHandler.js:**
```javascript
import { logger } from '../utils/logger.js';

export const errorHandler = async (err, req, res, next) => {
  await logger.error('Application error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};
```

#### 3.6 Create Rate Limiter Middleware

**src/middleware/rateLimiter.js:**
```javascript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### 3.7 Create Main Server File

**server.js:**
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import { sequelize } from './src/models/index.js';
import { logger } from './src/utils/logger.js';
import authRoutes from './src/routes/auth.routes.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for Logto)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Request logging
app.use(async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    await logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: req.ip,
    });
  });
  
  next();
});

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info('Server started', { port: PORT });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

startServer();
```

#### 3.8 Test Backend

```bash
# Start the server
npm run dev

# You should see:
# ✅ Database connected successfully
# ✅ Database models synchronized
# 🚀 Server running on http://localhost:3000
# 📝 Environment: development

# Test health endpoint
curl http://localhost:3000/health

# Test auth endpoint (should redirect to Logto)
curl -v http://localhost:3000/api/auth/sign-in
```

---

## Day 4: Frontend Setup & React Integration

### Morning Session (2-3 hours)

#### 4.1 Initialize Frontend Project

```bash
cd ../frontend

# Create Vite + React project
npm create vite@latest . -- --template react

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom
npm install @logto/react
npm install axios
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install react-toastify
```

#### 4.2 Configure Environment Variables

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3000/api
VITE_LOGTO_ENDPOINT=https://your-tenant.logto.app
VITE_LOGTO_APP_ID=your_app_id
```

#### 4.3 Create Project Structure

```bash
mkdir -p src/{components,services,hooks,utils,pages,contexts}
mkdir -p src/components/{auth,common,layout}
mkdir -p src/pages/{auth,dashboard}
```

#### 4.4 Configure Axios

**src/services/api.js:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**src/services/authService.js:**
```javascript
import api from './api';

export const authService = {
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  signIn() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/sign-in`;
  },

  signOut() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/sign-out`;
  },
};
```

### Afternoon Session (3-4 hours)

#### 4.5 Set Up Logto Provider

**src/main.jsx:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LogtoProvider, LogtoConfig } from '@logto/react';
import App from './App';
import './index.css';

const logtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
  appId: import.meta.env.VITE_LOGTO_APP_ID,
  redirectUri: `${window.location.origin}/callback`,
  postLogoutRedirectUri: window.location.origin,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LogtoProvider config={logtoConfig}>
        <App />
      </LogtoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

#### 4.6 Create Auth Components

**src/components/auth/LoginButton.jsx:**
```javascript
import { useLogto } from '@logto/react';
import { Button } from '@mui/material';

export function LoginButton() {
  const { signIn, isAuthenticated } = useLogto();

  if (isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="contained"
      onClick={() => signIn(`${window.location.origin}/callback`)}
    >
      Sign In
    </Button>
  );
}
```

**src/components/auth/LogoutButton.jsx:**
```javascript
import { useLogto } from '@logto/react';
import { Button } from '@mui/material';

export function LogoutButton() {
  const { signOut, isAuthenticated } = useLogto();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      onClick={() => signOut(window.location.origin)}
    >
      Sign Out
    </Button>
  );
}
```

**src/components/auth/UserProfile.jsx:**
```javascript
import { useEffect, useState } from 'react';
import { useLogto } from '@logto/react';
import { Avatar, Box, Typography } from '@mui/material';

export function UserProfile() {
  const { isAuthenticated, getIdTokenClaims } = useLogto();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      getIdTokenClaims().then(setUser);
    }
  }, [isAuthenticated, getIdTokenClaims]);

  if (!user) return null;

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Avatar src={user.picture} alt={user.name} />
      <Box>
        <Typography variant="body1">{user.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      </Box>
    </Box>
  );
}
```

**src/components/auth/ProtectedRoute.jsx:**
```javascript
import { useLogto } from '@logto/react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useLogto();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

#### 4.7 Create Pages

**src/pages/auth/LoginPage.jsx:**
```javascript
import { Box, Container, Typography, Paper } from '@mui/material';
import { LoginButton } from '../../components/auth/LoginButton';

export function LoginPage() {
  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom align="center">
            Personal Cloud Storage
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph align="center">
            Sign in to access your files
          </Typography>
          <Box display="flex" justifyContent="center" mt={3}>
            <LoginButton />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
```

**src/pages/auth/CallbackPage.jsx:**
```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogto } from '@logto/react';
import { Box, CircularProgress, Typography } from '@mui/material';

export function CallbackPage() {
  const { handleSignInCallback } = useLogto();
  const navigate = useNavigate();

  useEffect(() => {
    handleSignInCallback()
      .then(() => {
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error('Callback error:', error);
        navigate('/login');
      });
  }, [handleSignInCallback, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Typography>Signing you in...</Typography>
    </Box>
  );
}
```

**src/pages/dashboard/DashboardPage.jsx:**
```javascript
import { Box, Container, Typography, Paper } from '@mui/material';
import { UserProfile } from '../../components/auth/UserProfile';
import { LogoutButton } from '../../components/auth/LogoutButton';

export function DashboardPage() {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Dashboard</Typography>
            <Box display="flex" gap={2} alignItems="center">
              <UserProfile />
              <LogoutButton />
            </Box>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to Your Cloud Storage!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your authentication is working correctly. File upload features coming in Week 2!
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
```

#### 4.8 Set Up Routing

**src/App.jsx:**
```javascript
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoginPage } from './pages/auth/LoginPage';
import { CallbackPage } from './pages/auth/CallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
```

---

## Day 5: Testing & Documentation

### Morning Session (2-3 hours)

#### 5.1 Write Backend Tests

**tests/integration/auth.test.js:**
```javascript
import request from 'supertest';
import app from '../../server.js';

describe('Authentication Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /api/auth/sign-in', () => {
    it('should redirect to Logto', async () => {
      const res = await request(app).get('/api/auth/sign-in');
      expect(res.status).toBe(302);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
```

**Run tests:**
```bash
npm test
```

#### 5.2 Manual Testing Checklist

Create **TESTING_CHECKLIST.md:**

```markdown
# Week 1 Testing Checklist

## Backend Tests

- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Health endpoint returns 200
- [ ] Auth endpoints respond correctly
- [ ] Logs appear in Axiom dashboard
- [ ] Environment variables loaded correctly

## Frontend Tests

- [ ] App loads without errors
- [ ] Login page displays correctly
- [ ] Sign-in redirects to Logto
- [ ] Callback handles authentication
- [ ] Dashboard shows user info
- [ ] Sign-out works correctly
- [ ] Protected routes redirect unauthenticated users

## Integration Tests

- [ ] Complete sign-in flow works
- [ ] User created in database on first login
- [ ] Session persists across page refreshes
- [ ] Sign-out clears session
- [ ] CORS configured correctly
```

### Afternoon Session (2-3 hours)

#### 5.3 Create Documentation

**docs/WEEK_1_SUMMARY.md:**

```markdown
# Week 1 Summary

## Completed Tasks

✅ Development environment setup
✅ Project structure created
✅ PostgreSQL database configured
✅ Logto authentication integrated
✅ Axiom logging implemented
✅ Backend API with Express
✅ Frontend with React + Vite
✅ Protected routes working
✅ User management functional

## What Works

- User can sign in via Logto
- User profile stored in database
- Protected routes enforce authentication
- Logging to Axiom
- Session management
- CORS configured

## Next Steps (Week 2)

- File upload functionality
- Folder management
- File storage infrastructure
- Thumbnail generation
```

#### 5.4 Update README

Add to **README.md:**

```markdown
## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Logto account
- Axiom account

### Installation

1. Clone the repository
2. Set up backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run db:sync
   npm run dev
   ```

3. Set up frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   ```

4. Visit http://localhost:5173

### Week 1 Status

✅ Authentication working
✅ User management functional
⏳ File upload (Week 2)
⏳ AI features (Phase 2)
```

---

## Day 6-7: Polish & Preparation for Week 2

### Tasks

1. **Code Review & Refactoring**
   - Review all code for best practices
   - Add comments where needed
   - Ensure consistent code style

2. **Performance Testing**
   - Test authentication flow performance
   - Check database query efficiency
   - Monitor Axiom logs

3. **Security Review**
   - Verify CORS settings
   - Check session configuration
   - Review rate limiting

4. **Documentation**
   - Document API endpoints
   - Create setup guide
   - Write troubleshooting guide

5. **Prepare for Week 2**
   - Review file upload requirements
   - Plan folder structure
   - Research Multer configuration

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials
psql -U postgres -d cloud_storage_dev
```

**Logto Redirect Not Working**
- Verify redirect URI in Logto console matches .env
- Check CORS settings
- Ensure session middleware is configured

**Frontend Can't Connect to Backend**
- Verify VITE_API_URL in frontend/.env
- Check CORS origin in backend
- Ensure backend is running

**Axiom Logs Not Appearing**
- Verify AXIOM_TOKEN is correct
- Check dataset name
- Look for console errors

---

## Success Criteria

By end of Week 1, you should have:

✅ Backend server running on port 3000
✅ Frontend running on port 5173
✅ User can sign in via Logto
✅ User profile displayed on dashboard
✅ Protected routes working
✅ Logs visible in Axiom
✅ Database with users table
✅ All tests passing

---

## Time Tracking

| Day | Tasks | Estimated Hours |
|-----|-------|----------------|
| 1 | Environment & Setup | 5-6 |
| 2 | Database & Models | 5-6 |
| 3 | Logto Integration | 6-7 |
| 4 | Frontend Setup | 6-7 |
| 5 | Testing & Docs | 4-5 |
| 6-7 | Polish & Review | 4-6 |
| **Total** | | **30-37 hours** |

---

**You're ready to start Week 1! Good luck! 🚀**
