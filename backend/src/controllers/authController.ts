import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

/**
 * Get user by Logto ID
 * Returns 404 if user doesn't exist in our database
 * @route GET /api/auth/user
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const claims = req.logtoUser;
    
    if (!claims?.sub) {
      await logger.error('Missing Logto user claims', { claims });
      return res.status(400).json({ 
        error: 'Invalid authentication',
        message: 'User claims not found' 
      });
    }

    // Try to find user in our database
    const user = await User.findOne({ 
      where: { logtoUserId: claims.sub } 
    });

    // Return 404 if user doesn't exist (first-time login)
    if (!user) {
      await logger.info('User not found in database', {
        logtoUserId: claims.sub,
        email: claims.email,
      });
      
      return res.status(404).json({
        error: 'User not found',
        message: 'Please complete your profile',
        logtoUserId: claims.sub,
        email: claims.email,
      });
    }

    // User exists, return their data
    await logger.info('User retrieved successfully', {
      userId: user.id,
      logtoUserId: user.logtoUserId,
    });

    res.json({
      id: user.id,
      logtoUserId: user.logtoUserId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      picture: user.picture,
      storageQuota: user.storageQuota,
      storageUsed: user.storageUsed,
      storageUsagePercentage: user.getStorageUsagePercentage(),
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    await logger.error('Get user error', { 
      error: error.message,
      stack: error.stack,
      logtoUserId: req.logtoUser?.sub,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve user' 
    });
  }
};

/**
 * Create new user with profile details
 * Called after first-time Logto authentication
 * @route POST /api/auth/user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const claims = req.logtoUser;
    const { name, phone, age, gender, email: bodyEmail } = req.body;

    if (!claims?.sub) {
      await logger.error('Missing Logto user claims for user creation', { claims });
      return res.status(400).json({ 
        error: 'Invalid authentication',
        message: 'User identity not found' 
      });
    }

    // Determine email source (claims or body)
    const email = claims.email || bodyEmail;

    if (!email) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email is required',
        fields: {
          email: 'Email is required',
        }
      });
    }

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and phone are required fields',
        fields: {
          name: !name ? 'Name is required' : undefined,
          phone: !phone ? 'Phone is required' : undefined,
        }
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid phone number format',
      });
    }

    // Validate age if provided
    if (age !== undefined && age !== null) {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Age must be between 13 and 120',
        });
      }
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid gender value',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { logtoUserId: claims.sub } 
    });

    if (existingUser) {
      await logger.warn('Attempted to create duplicate user', {
        logtoUserId: claims.sub,
        existingUserId: existingUser.id,
      });
      
      return res.status(409).json({
        error: 'User already exists',
        message: 'User profile already created',
        user: {
          id: existingUser.id,
          email: existingUser.email,
        }
      });
    }

    // Create new user
    const newUser = await User.create({
      logtoUserId: claims.sub,
      email: email,
      name: name.trim(),
      phone: phone.trim(),
      age: age ? parseInt(age, 10) : undefined,
      gender: gender || undefined,
      picture: claims.picture || undefined,
      // Default storage quota: 10GB
      storageQuota: 10737418240,
      storageUsed: 0,
      role: 'user',
    });

    await logger.info('New user created successfully', {
      userId: newUser.id,
      logtoUserId: newUser.logtoUserId,
      email: newUser.email,
      name: newUser.name,
    });

    res.status(201).json({
      id: newUser.id,
      logtoUserId: newUser.logtoUserId,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      age: newUser.age,
      gender: newUser.gender,
      picture: newUser.picture,
      storageQuota: newUser.storageQuota,
      storageUsed: newUser.storageUsed,
      role: newUser.role,
      createdAt: newUser.createdAt,
    });
  } catch (error: any) {
    await logger.error('Create user error', {
      error: error.message,
      stack: error.stack,
      logtoUserId: req.logtoUser?.sub,
      body: req.body,
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create user profile' 
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/user
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.dbUser!;
    const { name, phone, age, gender } = req.body;

    const updates: any = {};

    if (name) updates.name = name.trim();
    if (phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid phone number format',
        });
      }
      updates.phone = phone.trim();
    }
    if (age !== undefined) {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Age must be between 13 and 120',
        });
      }
      updates.age = ageNum;
    }
    if (gender) {
      if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid gender value',
        });
      }
      updates.gender = gender;
    }

    if (Object.keys(updates).length > 0) {
      await user.update(updates);
      await logger.info('User profile updated', {
        userId: user.id,
        changes: updates,
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      picture: user.picture,
    });
  } catch (error: any) {
    await logger.error('Update profile error', {
      error: error.message,
      userId: req.dbUser?.id,
    });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Get user storage statistics
 * @route GET /api/auth/storage
 */
export const getStorageStats = async (req: Request, res: Response) => {
  try {
    const user = req.dbUser!;

    res.json({
      quota: user.storageQuota,
      used: user.storageUsed,
      available: Number(user.storageQuota) - Number(user.storageUsed),
      usagePercentage: user.getStorageUsagePercentage(),
    });
  } catch (error: any) {
    await logger.error('Get storage stats error', {
      error: error.message,
      userId: req.dbUser?.id,
    });
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
};
