export const AUTH_CACHE_KEY = {
  me: (userId: string) => `auth:user:${userId}`,
};

export const AUTH_CACHE_TTL = 300; // 5 minutes
