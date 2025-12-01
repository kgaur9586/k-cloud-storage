/**
 * IStorageProvider
 * Interface defining the contract for all storage providers
 */
export interface IStorageProvider {
  /**
   * Save file to storage
   * @param userId - User ID for organizing files
   * @param fileBuffer - File content as Buffer
   * @param filename - Original filename
   * @returns Relative path or key to the saved file
   */
  saveFile(userId: string, fileBuffer: Buffer, filename: string): Promise<string>;

  /**
   * Read file from storage
   * @param path - Relative path or key to the file
   * @returns File content as Buffer
   */
  readFile(path: string): Promise<Buffer>;

  /**
   * Delete file from storage
   * @param path - Relative path or key to the file
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Check if file exists in storage
   * @param path - Relative path or key to the file
   * @returns True if file exists, false otherwise
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Get file statistics
   * @param path - Relative path or key to the file
   * @returns File size and modification time
   */
  getFileStats(path: string): Promise<{ size: number; mtime: Date }>;

  /**
   * Move file to new location (optional, for advanced operations)
   * @param oldPath - Current path or key
   * @param newPath - New path or key
   */
  moveFile?(oldPath: string, newPath: string): Promise<void>;

  /**
   * Get user storage usage (optional)
   * @param userId - User ID
   * @returns Total storage used in bytes
   */
  getUserStorageUsage?(userId: string): Promise<number>;
}
