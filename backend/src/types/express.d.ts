import type { User } from '@prisma/client';
import type { Principal } from '../http/tsoa/authentication';

declare global {
  namespace Express {
    interface Request {
      user?: Principal;
      currentUser?: User;
      requestId?: string;
    }
  }
}

export {};
