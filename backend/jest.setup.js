// Jest setup file for global test configuration
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/k_cloud_test';
process.env.LOGTO_ENDPOINT = 'https://test.logto.app';
process.env.LOGTO_APP_ID = 'test-app-id';
process.env.LOGTO_APP_SECRET = 'test-app-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.AXIOM_ENABLED = 'false';
