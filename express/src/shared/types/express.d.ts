declare global {
  namespace Express {
    interface Request {
      userId?: string;
      traceId?: string;
    }
  }
}

export {};
