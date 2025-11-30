import request from 'supertest';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import fileRoutes from '../../routes/file.routes.js';
import { createTestApp, setupTestDatabase, cleanupTestDatabase, closeDatabase, createTestUser } from '../../__tests__/helpers/testHelpers.js';

// Mock Logto middleware
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

// Mock storage service to avoid writing to disk during tests
jest.mock('@/services/storageService.js', () => ({
  ensureUserDirectory: jest.fn().mockResolvedValue('/tmp/test-user'),
  saveFile: jest.fn().mockResolvedValue('test-file.txt'),
  readFile: jest.fn().mockResolvedValue(Buffer.from('test content')),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  moveFile: jest.fn().mockResolvedValue(undefined),
  calculateHash: jest.fn().mockResolvedValue('test-hash'),
  getFileStats: jest.fn().mockResolvedValue({ size: 100, mtime: new Date() }),
  getUserStorageUsage: jest.fn().mockResolvedValue(0),
}));

describe('File Controller Integration Tests', () => {
  let app: Express;
  let user: any;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp(fileRoutes, '/api/files');
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeDatabase();
  });

  beforeEach(async () => {
    user = await createTestUser({ logtoUserId: `user-${Date.now()}`, email: `user-${Date.now()}@example.com` });
    mockLogtoUserId = user.logtoUserId;
    mockEmail = user.email;
    mockDbUser = user;
  });

  test('POST /upload uploads a file', async () => {
    const buffer = Buffer.from('test file content');
    
    const res = await request(app)
      .post('/api/files/upload')
      .attach('files', buffer, 'test.txt');
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.files).toHaveLength(1);
    expect(res.body.data.files[0].name).toBe('test.txt');
    expect(res.body.data.successCount).toBe(1);
  });

  test('GET / returns list of files', async () => {
    // First upload a file
    const buffer = Buffer.from('test file content');
    await request(app)
      .post('/api/files/upload')
      .attach('files', buffer, 'list-test.txt');

    const res = await request(app).get('/api/files');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.files).toHaveLength(1);
    expect(res.body.data.files[0].name).toBe('list-test.txt');
  });

  test('GET /:id/download downloads a file', async () => {
    // Upload file
    const uploadRes = await request(app)
      .post('/api/files/upload')
      .attach('files', Buffer.from('content'), 'download.txt');
      
    const fileId = uploadRes.body.data.files[0].id;

    const res = await request(app).get(`/api/files/${fileId}/download`);
    
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/plain');
    expect(res.header['content-disposition']).toContain('download.txt');
  });
});
