import { cacheClient } from '@src/shared/lib/cache';
import { AUTH_CACHE_KEY, AUTH_CACHE_TTL } from '../../utils/constants/cache';

type CachedUser = {
  id: string;
  associationId: string;
  email: string;
  name: string;
  role: string[];
  status: string;
  memberTypeId: string | null;
};

export function getAuthUserCacheKey(userId: string): string {
  return AUTH_CACHE_KEY.me(userId);
}

export async function getAuthCachedUser(userId: string): Promise<CachedUser | null> {
  const key = getAuthUserCacheKey(userId);
  return cacheClient.get<CachedUser>(key);
}

export async function cacheAuthUser(userId: string, userData: CachedUser): Promise<void> {
  const key = getAuthUserCacheKey(userId);
  await cacheClient.set(key, userData, AUTH_CACHE_TTL);
}

export async function invalidateAuthUserCache(userId: string): Promise<void> {
  const key = getAuthUserCacheKey(userId);
  await cacheClient.del(key);
}
