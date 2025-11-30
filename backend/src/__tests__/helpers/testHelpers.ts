import express, { Express } from 'express';
import request from 'supertest';
import sequelize from '@/config/database.js';
import User from '@/models/User.js';

/**
 * Setup test database and sync models
 */
export async function setupTestDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Drop and recreate tables
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Cleanup test database
 */
export async function cleanupTestDatabase() {
  try {
    await User.destroy({ where: {}, truncate: true });
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Failed to close database:', error);
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(data: Partial<any> = {}) {
  return await User.create({
    logtoUserId: data.logtoUserId || 'test-logto-id',
    email: data.email || 'test@example.com',
    name: data.name || 'Test User',
    phone: data.phone || '+1234567890',
    age: data.age || 25,
    gender: data.gender || 'male',
    picture: data.picture || null,
    storageQuota: data.storageQuota || 10737418240,
    storageUsed: data.storageUsed || 0,
    role: data.role || 'user',
  });
}

/**
 * Mock Logto authentication middleware for testing
 */
export function mockLogtoAuth(logtoUserId: string = 'test-logto-id', email: string = 'test@example.com') {
  return (req: any, res: any, next: any) => {
    req.logtoUser = {
      sub: logtoUserId,
      email: email,
      picture: 'https://example.com/pic.jpg',
    };
    next();
  };
}

/**
 * Mock database user middleware for testing
 */
export function mockDbUser(user: any) {
  return (req: any, res: any, next: any) => {
    req.dbUser = user;
    next();
  };
}

/**
 * Create a mock Express app for testing
 */
export function createTestApp(routes: any, mountPath: string = '/api/auth'): Express {
  const app = express();
  app.use(express.json());
  app.use(mountPath, routes);
  return app;
}

/**
 * Generate a mock access token for testing
 */
export function generateMockToken(userId: string = 'test-user-id'): string {
  return `mock-token-${userId}-${Date.now()}`;
}
