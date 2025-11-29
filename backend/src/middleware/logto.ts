import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

/**
 * Middleware to validate Logto access token from frontend
 * Extracts user info from token and attaches to request
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No access token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Logto introspection endpoint
    const introspectionResponse = await fetch(`${process.env.LOGTO_ENDPOINT}oidc/token/introspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.LOGTO_APP_ID}:${process.env.LOGTO_APP_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        token: token,
        token_type_hint: 'access_token',
      }),
    });

    const tokenData = await introspectionResponse.json();
    console.log('Token introspection response:', tokenData);

    if (!tokenData.active) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    // Get user info from userinfo endpoint (contains more details)
    const userinfoResponse = await fetch(`${process.env.LOGTO_ENDPOINT}oidc/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const userInfo = await userinfoResponse.json();
    console.log('User info response:', userInfo);

    // Extract user claims (prefer userinfo, fallback to token data)
    const sub = userInfo.sub || tokenData.sub;
    const email = userInfo.email || tokenData.email || null;

    if (!sub) {
      console.error('Missing required claims:', { sub, email, userInfo, tokenData });
      return res.status(400).json({
        error: 'Invalid authentication',
        message: 'User identity not found'
      });
    }

    req.logtoUser = {
      sub: sub,
      email: email,
      name: userInfo.name || tokenData.name || null,
      picture: userInfo.picture || tokenData.picture || null,
    };

    await logger.debug('Token validated', {
      logtoUserId: sub,
      email: email,
    });

    next();
  } catch (error: any) {
    await logger.error('Token validation error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to validate token' 
    });
  }
};

/**
 * Middleware to load user from database (for routes that require existing user)
 * Returns 401 if user doesn't exist in our database
 */
export const requireDbUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claims = req.logtoUser;
    
    if (!claims?.sub) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User claims not found' 
      });
    }

    // Find user in our database
    const user = await User.findOne({ 
      where: { logtoUserId: claims.sub } 
    });

    if (!user) {
      await logger.warn('User not found in database', {
        logtoUserId: claims.sub,
        email: claims.email,
      });
      
      return res.status(401).json({
        error: 'User not found',
        message: 'Please complete your profile first',
      });
    }

    // Attach database user to request
    req.dbUser = user;

    await logger.debug('Database user loaded', {
      userId: user.id,
      logtoUserId: user.logtoUserId,
    });

    next();
  } catch (error: any) {
    await logger.error('Load database user error', {
      error: error.message,
      stack: error.stack,
      logtoUserId: req.logtoUser?.sub,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to load user' 
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.dbUser || req.dbUser.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin access required' 
    });
  }
  next();
};
