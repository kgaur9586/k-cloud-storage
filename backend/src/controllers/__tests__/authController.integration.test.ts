import request from 'supertest';
import { Express } from 'express';
import { createTestApp, setupTestDatabase, cleanupTestDatabase, closeDatabase, createTestUser } from '../../__tests__/helpers/testHelpers.js';

// Mock Logto middleware before importing routes
let mockLogtoUserId = 'test-logto-id';
let mockEmail = 'test@example.com';
let mockDbUser: any = null;

jest.mock('@/middleware/logto.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.logtoUser = {
      sub: mockLogtoUserId,
      email: mockEmail,
      picture: 'https://example.com/pic.jpg',
    };
    next();
  },
  requireDbUser: async (req: any, res: any, next: any) => {
    if (mockDbUser) {
      req.dbUser = mockDbUser;
    }
    next();
  },
}));

import authRoutes from '../../routes/auth.routes.js';

/**
 * Integration tests for auth controller endpoints.
 * Uses an isolated test database and mocks Logto authentication.
 */

describe('Auth Controller Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp(authRoutes);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeDatabase();
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockLogtoUserId = 'test-logto-id';
    mockEmail = 'test@example.com';
    mockDbUser = null;
  });

  test('GET /user returns user profile when authenticated', async () => {
    const testUser = await createTestUser({ logtoUserId: 'logto123', email: 'user@example.com' });
    mockLogtoUserId = 'logto123';
    mockEmail = 'user@example.com';

    const res = await request(app).get('/api/auth/user');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      id: testUser.id,
      logtoUserId: 'logto123',
      email: 'user@example.com',
    });
    // storage fields should be numbers
    expect(typeof res.body.data.storageQuota).toBe('number');
    expect(typeof res.body.data.storageUsed).toBe('number');
  });

  test('GET /user returns 404 when user not found', async () => {
    mockLogtoUserId = 'nonexistent';
    mockEmail = 'missing@example.com';
    
    const res = await request(app).get('/api/auth/user');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('User not found');
  });

  test('POST /user creates a new user', async () => {
    mockLogtoUserId = 'newlogto';
    mockEmail = 'new@example.com';
    
    const payload = {
      name: 'New User',
      phone: '+1234567890',
      age: 30,
      gender: 'male',
    };
    const res = await request(app).post('/api/auth/user').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      logtoUserId: 'newlogto',
      email: 'new@example.com',
      name: 'New User',
    });
  });

  test('PUT /user updates existing user', async () => {
    const testUser = await createTestUser({ logtoUserId: 'updateLogto', email: 'update@example.com' });
    mockLogtoUserId = 'updateLogto';
    mockEmail = 'update@example.com';
    mockDbUser = testUser;
    
    const updatePayload = { name: 'Updated Name', phone: '+9999999999' };
    const res = await request(app).put('/api/auth/user').send(updatePayload);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.phone).toBe('+9999999999');
  });

  test('GET /storage returns storage stats', async () => {
    const testUser = await createTestUser({ logtoUserId: 'statsLogto', email: 'stats@example.com', storageQuota: 10737418240, storageUsed: 5368709120 });
    mockLogtoUserId = 'statsLogto';
    mockEmail = 'stats@example.com';
    mockDbUser = testUser;
    
    const res = await request(app).get('/api/auth/storage');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({
      quota: 10737418240,
      used: 5368709120,
      usagePercentage: 50,
    });
  });
});
