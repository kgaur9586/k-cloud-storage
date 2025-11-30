import request from 'supertest';
import { Express } from 'express';
import folderRoutes from '../../routes/folder.routes.js';
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

describe('Folder Controller Integration Tests', () => {
  let app: Express;
  let user: any;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp(folderRoutes, '/api/folders');
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeDatabase();
  });

  beforeEach(async () => {
    // Create a fresh user for each test
    user = await createTestUser({ logtoUserId: `user-${Date.now()}`, email: `user-${Date.now()}@example.com` });
    mockLogtoUserId = user.logtoUserId;
    mockEmail = user.email;
    mockDbUser = user;
  });

  test('POST / creates a new folder', async () => {
    const res = await request(app)
      .post('/api/folders')
      .send({ name: 'Documents' });
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Documents');
    expect(res.body.data.path).toBe('/Documents');
  });

  test('POST / creates a nested folder', async () => {
    // Create parent folder
    const parentRes = await request(app)
      .post('/api/folders')
      .send({ name: 'Work' });
    
    const parentId = parentRes.body.data.id;

    // Create child folder
    const res = await request(app)
      .post('/api/folders')
      .send({ name: 'Projects', parentId });
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Projects');
    expect(res.body.data.path).toBe('/Work/Projects');
    expect(res.body.data.parentId).toBe(parentId);
  });

  test('GET /tree returns folder hierarchy', async () => {
    // Create structure: /Photos/Vacation
    const rootRes = await request(app).post('/api/folders').send({ name: 'Photos' });
    await request(app).post('/api/folders').send({ name: 'Vacation', parentId: rootRes.body.data.id });

    const res = await request(app).get('/api/folders/tree');
    
    expect(res.status).toBe(200);
    expect(res.body.data.root).toHaveLength(1); // Only Photos at root (plus previous tests folders if not cleaned up properly, but we use fresh user)
    // Actually, createTestUser creates a new user, so folders are isolated by user.
    
    // Wait, createTestUser creates a new user, but setupTestDatabase clears DB only once?
    // No, setupTestDatabase is in beforeAll.
    // So previous tests data persists.
    // But we create a NEW user for each test in beforeEach.
    // So folders are isolated by user.
    
    const photosFolder = res.body.data.root.find((f: any) => f.name === 'Photos');
    expect(photosFolder).toBeDefined();
    expect(photosFolder.children).toHaveLength(1);
    expect(photosFolder.children[0].name).toBe('Vacation');
  });
});
