import { UserService } from '@/services/userService.js';
import User from '@/models/User.js';
import { Gender } from '@k-cloud/shared';

// Mock the User model
jest.mock('@/models/User');
jest.mock('@/utils/logger');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByLogtoId', () => {
    it('should find user by Logto ID', async () => {
      const mockUser = {
        id: '123',
        logtoUserId: 'logto123',
        email: 'test@example.com',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.findByLogtoId('logto123');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { logtoUserId: 'logto123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await UserService.findByLogtoId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        phone: '+1234567890',
        age: 25,
        gender: Gender.MALE,
      };

      const mockCreatedUser = {
        id: '123',
        logtoUserId: 'logto123',
        email: 'test@example.com',
        ...userData,
        storageQuota: 10737418240,
        storageUsed: 0,
        role: 'user',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await UserService.createUser(
        'logto123',
        'test@example.com',
        userData,
        'https://example.com/pic.jpg'
      );

      expect(User.findOne).toHaveBeenCalledWith({
        where: { logtoUserId: 'logto123' },
      });
      expect(User.create).toHaveBeenCalledWith({
        logtoUserId: 'logto123',
        email: 'test@example.com',
        name: userData.name,
        phone: userData.phone,
        age: userData.age,
        gender: userData.gender,
        picture: 'https://example.com/pic.jpg',
        storageQuota: 10737418240,
        storageUsed: 0,
        role: 'user',
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw error if user already exists', async () => {
      const existingUser = { id: '123', logtoUserId: 'logto123' };
      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        UserService.createUser('logto123', 'test@example.com', {
          name: 'Test',
          phone: '+1234567890',
        })
      ).rejects.toThrow('User already exists');

      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: '123',
        name: 'Old Name',
        phone: '+1111111111',
        save: jest.fn().mockResolvedValue(true),
      };

      const updateData = {
        name: 'New Name',
        phone: '+2222222222',
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.updateUser('123', updateData);

      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(mockUser.name).toBe('New Name');
      expect(mockUser.phone).toBe('+2222222222');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.updateUser('nonexistent', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('calculateStorageStats', () => {
    it('should calculate storage stats correctly', () => {
      const mockUser = {
        storageQuota: '10737418240', // 10GB as string (BIGINT)
        storageUsed: '5368709120', // 5GB as string
      } as any;

      const stats = UserService.calculateStorageStats(mockUser);

      expect(stats).toEqual({
        quota: 10737418240,
        used: 5368709120,
        available: 5368709120,
        usagePercentage: 50,
      });
    });

    it('should handle zero quota', () => {
      const mockUser = {
        storageQuota: '0',
        storageUsed: '0',
      } as any;

      const stats = UserService.calculateStorageStats(mockUser);

      expect(stats.usagePercentage).toBe(0);
    });
  });
});
