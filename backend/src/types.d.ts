import { LogtoContext } from '@logto/express';
import User from './models/User';

declare global {
  namespace Express {
    interface Request {
      dbUser?: User;
      logtoUser?: any; // Claims object
      user?: LogtoContext;
    }
  }
}
