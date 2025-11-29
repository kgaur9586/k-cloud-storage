import dotenv from 'dotenv';

dotenv.config();

import { LogtoExpressConfig } from '@logto/express';

/**
 * Logto configuration for authentication
 * Using Express SDK for traditional web application flow
 */
export const logtoConfig: LogtoExpressConfig = {
  endpoint: process.env.LOGTO_ENDPOINT || '',
  appId: process.env.LOGTO_APP_ID || '',
  appSecret: process.env.LOGTO_APP_SECRET || '',
  baseUrl: process.env.API_URL || 'http://localhost:3000',
};
