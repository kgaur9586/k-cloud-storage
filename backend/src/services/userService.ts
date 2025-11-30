import User from '@/models/User.js';
import { CreateUserRequest, UpdateUserRequest } from '@k-cloud/shared';
import { logger } from '@/utils/logger.js';

export class UserService {
  /**
   * Find a user by their Logto User ID
   */
  static async findByLogtoId(logtoUserId: string) {
    return await User.findOne({
      where: { logtoUserId },
    });
  }

  /**
   * Create a new user
   */
  static async createUser(logtoUserId: string, email: string, data: CreateUserRequest, picture?: string | null) {
    // Check if user already exists
    const existingUser = await this.findByLogtoId(logtoUserId);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser = await User.create({
      logtoUserId,
      email,
      name: data.name as string ,
      phone: data.phone as string,
      age: data.age as number,
      gender: data.gender as any, // Temporary cast until enum fix
      picture: picture as string,
      storageQuota: 10737418240, // 10GB default
      storageUsed: 0,
      role: 'user',
    });

    await logger.info('User created successfully', {
      userId: newUser.id,
      logtoUserId: newUser.logtoUserId,
    });

    return newUser;
  }

  /**
   * Update an existing user
   */
  static async updateUser(userId: string, data: UpdateUserRequest) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update fields if provided
    if (data.name !== undefined) user.name = data.name as string  ;
    if (data.phone !== undefined) user.phone = data.phone as string;
    if (data.age !== undefined) user.age = data.age as number;
    if (data.gender !== undefined) user.gender = data.gender as any;

    await user.save();

    await logger.info('User updated successfully', {
      userId: user.id,
      updatedFields: Object.keys(data),
    });

    return user;
  }

  /**
   * Calculate storage statistics for a user
   */
  static calculateStorageStats(user: User) {
    const quota = Number(user.storageQuota);
    const used = Number(user.storageUsed);
    return {
      quota,
      used,
      available: quota - used,
      usagePercentage: quota > 0 
        ? (used / quota) * 100 
        : 0,
    };
  }
}
