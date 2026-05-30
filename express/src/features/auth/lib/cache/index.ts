import { cacheClient } from '@src/shared/lib/cache';

import { AUTH_CACHE_KEY, AUTH_CACHE_TTL } from '../../utils/constants/cache';

// ---- Types ----

type CachedUser = {
  id: string;
  associationId: string;
  email: string;
  name: string;
  role: string[];
  status: string;
  memberTypeId: string | null;
};

// ---- Helpers ----

export function getAuthUserCacheKey(userId: string): string {
  return AUTH_CACHE_KEY.me(userId);
}

// ---- Cache Operations ----

/** Retrieve a cached user profile by user ID — returns null if missing or expired. */
export async function getAuthCachedUser(userId: string): Promise<CachedUser | null> {
  const key = getAuthUserCacheKey(userId);
  return cacheClient.get<CachedUser>(key);
}

/** Persist a user profile in the cache with the configured TTL to reduce database lookups on repeated GET /me requests. */
export async function cacheAuthUser(userId: string, userData: CachedUser): Promise<void> {
  const key = getAuthUserCacheKey(userId);
  await cacheClient.set(key, userData, AUTH_CACHE_TTL);
}

/** Evict a cached user profile — should be called when user data changes to prevent stale data. */
export async function invalidateAuthUserCache(userId: string): Promise<void> {
  const key = getAuthUserCacheKey(userId);
  await cacheClient.del(key);
}
