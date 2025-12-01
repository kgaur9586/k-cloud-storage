import { Op } from 'sequelize';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import { logger } from '../utils/logger.js';

/**
 * Analytics Service
 * Provides storage usage analytics and insights
 */
class AnalyticsService {
  /**
   * Get overall storage statistics for a user
   */
  async getStorageStats(userId: string) {
    const files = await File.findAll({
      where: { userId, isDeleted: false },
      attributes: ['size', 'mimeType'],
    });

    const totalSize = files.reduce((sum, file) => sum + Number(file.size), 0);
    const totalFiles = files.length;

    return {
      totalSize,
      totalFiles,
      averageFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
    };
  }

  /**
   * Get storage breakdown by file type
   */
  async getStorageByType(userId: string) {
    const files = await File.findAll({
      where: { userId, isDeleted: false },
      attributes: ['mimeType', 'size'],
    });

    const breakdown: Record<string, { count: number; size: number; percentage: number }> = {};
    const totalSize = files.reduce((sum, file) => sum + Number(file.size), 0);

    // Group by main MIME type (e.g., "image", "video", "application")
    files.forEach(file => {
      const mainType = file.mimeType.split('/')[0] || 'other';
      
      if (!breakdown[mainType]) {
        breakdown[mainType] = { count: 0, size: 0, percentage: 0 };
      }
      
      breakdown[mainType].count++;
      breakdown[mainType].size += Number(file.size);
    });

    // Calculate percentages
    Object.keys(breakdown).forEach(type => {
      breakdown[type].percentage = totalSize > 0 
        ? Math.round((breakdown[type].size / totalSize) * 100) 
        : 0;
    });

    return breakdown;
  }

  /**
   * Get storage breakdown by folder
   */
  async getStorageByFolder(userId: string) {
    const files = await File.findAll({
      where: { userId, isDeleted: false },
      attributes: ['folderId', 'size'],
      include: [{
        model: Folder,
        as: 'folder',
        attributes: ['id', 'name', 'path'],
      }],
    });

    const breakdown: Record<string, { name: string; path: string; count: number; size: number }> = {};

    files.forEach(file => {
      const folderId = file.folderId || 'root';
      const folderName = file.folderId && (file as any).folder ? (file as any).folder.name : 'Root';
      const folderPath = file.folderId && (file as any).folder ? (file as any).folder.path : '/';

      if (!breakdown[folderId]) {
        breakdown[folderId] = { name: folderName, path: folderPath, count: 0, size: 0 };
      }

      breakdown[folderId].count++;
      breakdown[folderId].size += Number(file.size);
    });

    // Convert to array and sort by size
    return Object.entries(breakdown)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.size - a.size);
  }

  /**
   * Get largest files
   */
  async getLargestFiles(userId: string, limit: number = 10) {
    const files = await File.findAll({
      where: { userId, isDeleted: false },
      attributes: ['id', 'name', 'size', 'mimeType', 'createdAt'],
      order: [['size', 'DESC']],
      limit,
    });

    return files.map(file => file.toJSON());
  }

  /**
   * Get storage trends over time
   */
  async getStorageTrends(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const files = await File.findAll({
      where: {
        userId,
        isDeleted: false,
        createdAt: { [Op.gte]: startDate },
      },
      attributes: ['createdAt', 'size'],
      order: [['createdAt', 'ASC']],
    });

    // Group by day
    const trends: Record<string, { date: string; size: number; count: number }> = {};
    let cumulativeSize = 0;

    files.forEach(file => {
      const date = file.createdAt.toISOString().split('T')[0];
      cumulativeSize += Number(file.size);

      if (!trends[date]) {
        trends[date] = { date, size: 0, count: 0 };
      }

      trends[date].size = cumulativeSize;
      trends[date].count++;
    });

    return Object.values(trends);
  }

  /**
   * Get comprehensive analytics
   */
  async getComprehensiveAnalytics(userId: string) {
    const [stats, byType, byFolder, largestFiles, trends] = await Promise.all([
      this.getStorageStats(userId),
      this.getStorageByType(userId),
      this.getStorageByFolder(userId),
      this.getLargestFiles(userId, 10),
      this.getStorageTrends(userId, 30),
    ]);

    await logger.info('Analytics generated', { userId });

    return {
      overview: stats,
      byType,
      byFolder,
      largestFiles,
      trends,
    };
  }
}

export default new AnalyticsService();
