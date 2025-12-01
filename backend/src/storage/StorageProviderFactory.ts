import { IStorageProvider } from './IStorageProvider.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { S3StorageProvider } from './S3StorageProvider.js';
import { logger } from '../utils/logger.js';

/**
 * StorageProviderFactory
 * Factory to create the appropriate storage provider based on configuration
 */
export class StorageProviderFactory {
  private static instance: IStorageProvider | null = null;

  /**
   * Get the configured storage provider instance (Singleton)
   */
  static getProvider(): IStorageProvider {
    if (this.instance) {
      return this.instance;
    }

    const provider = process.env.STORAGE_PROVIDER || 'local';

    switch (provider.toLowerCase()) {
      case 'local':
        logger.info('Using LocalStorageProvider');
        this.instance = new LocalStorageProvider();
        break;

      case 's3':
        logger.info('Using S3StorageProvider');
        this.instance = new S3StorageProvider();
        break;

      default:
        logger.warn(`Unknown storage provider: ${provider}. Falling back to LocalStorageProvider`);
        this.instance = new LocalStorageProvider();
    }

    return this.instance;
  }

  /**
   * Reset the provider instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
