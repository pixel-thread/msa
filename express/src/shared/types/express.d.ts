import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      traceId?: string;
      user: {
        id: string;
        memberTypeId?: string | null;
        role?: UserRole[];
        associationId?: string;
      };
    }
  }
}

export {};
