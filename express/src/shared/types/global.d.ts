export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'admin' | 'moderator' | 'user';
    };
  }

  interface UserPublicMetadata {
    role?: 'admin' | 'moderator' | 'user';
  }
}
