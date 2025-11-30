import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'K-Cloud Storage API',
      version: '1.0.0',
      description: 'Personal cloud storage API with AI-powered features',
      contact: {
        name: 'API Support',
        email: 'support@k-cloud-storage.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.k-cloud-storage.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Logto access token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            logtoUserId: {
              type: 'string',
              description: 'Logto user ID (sub claim)',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User display name',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            age: {
              type: 'integer',
              description: 'User age',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other', 'prefer_not_to_say'],
              description: 'User gender',
            },
            picture: {
              type: 'string',
              description: 'User profile picture URL',
            },
            storageQuota: {
              type: 'integer',
              format: 'int64',
              description: 'Storage quota in bytes',
            },
            storageUsed: {
              type: 'integer',
              format: 'int64',
              description: 'Storage used in bytes',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        StorageStats: {
          type: 'object',
          properties: {
            quota: {
              type: 'integer',
              format: 'int64',
              description: 'Total storage quota in bytes',
            },
            used: {
              type: 'integer',
              format: 'int64',
              description: 'Storage used in bytes',
            },
            available: {
              type: 'integer',
              format: 'int64',
              description: 'Available storage in bytes',
            },
            usagePercentage: {
              type: 'number',
              format: 'float',
              description: 'Storage usage percentage',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            fields: {
              type: 'object',
              description: 'Field-specific errors',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'K-Cloud Storage API Docs',
  }));

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;
