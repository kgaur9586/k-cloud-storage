import { Request, Response } from 'express';
import analyticsService from '../services/analyticsService.js';
import ApiResponse from '@/utils/ApiResponse.js';

/**
 * Get comprehensive analytics
 * GET /api/analytics
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const analytics = await analyticsService.getComprehensiveAnalytics(userId);

    return ApiResponse.success(
      analytics,
      'Analytics retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get storage statistics
 * GET /api/analytics/storage
 */
export const getStorageStats = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const stats = await analyticsService.getStorageStats(userId);

    return ApiResponse.success(
      stats,
      'Storage statistics retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get storage breakdown by type
 * GET /api/analytics/by-type
 */
export const getStorageByType = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const breakdown = await analyticsService.getStorageByType(userId);

    return ApiResponse.success(
      breakdown,
      'Storage breakdown by type retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get storage breakdown by folder
 * GET /api/analytics/by-folder
 */
export const getStorageByFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const breakdown = await analyticsService.getStorageByFolder(userId);

    return ApiResponse.success(
      breakdown,
      'Storage breakdown by folder retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get largest files
 * GET /api/analytics/largest-files
 */
export const getLargestFiles = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { limit } = req.query;
    
    const files = await analyticsService.getLargestFiles(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    return ApiResponse.success(
      { files },
      'Largest files retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get storage trends
 * GET /api/analytics/trends
 */
export const getStorageTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { days } = req.query;
    
    const trends = await analyticsService.getStorageTrends(
      userId,
      days ? parseInt(days as string) : 30
    );

    return ApiResponse.success(
      { trends },
      'Storage trends retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};
