# Implementation Plan: API Response Caching & Security Hardening

## File Change Summary

| File                                                      | Action | Lines |
| --------------------------------------------------------- | ------ | ----- |
| `src/shared/lib/cache.ts`                                 | Create | ~40   |
| `src/shared/lib/user-cache.ts`                            | Create | ~30   |
| `src/app/api/auth/me/route.ts`                            | Modify | ~15   |
| `src/shared/middleware/withSecurityHeaders.middleware.ts` | Modify | ~15   |

**Total**: 2 new files, 2 modified files, ~100 lines of code

## Execution Order

1. Create `src/shared/lib/cache.ts` (foundation)
2. Create `src/shared/lib/user-cache.ts` (domain-specific helpers)
3. Modify `src/app/api/auth/me/route.ts` (add caching)
4. Modify `src/shared/middleware/withSecurityHeaders.middleware.ts` (add headers)

## Step 1: Create `src/shared/lib/cache.ts`

Abstracted cache client wrapping Upstash Redis with:

- `CacheClient` interface for future backend swapping
- JSON serialization/deserialization
- `mfsa:` key prefix for namespacing
- All operations try/catched — returns `null` on failure (graceful degradation)

## Step 2: Create `src/shared/lib/user-cache.ts`

User-specific cache helpers:

- `getUserCacheKey(userId: string): string` — returns `mfsa:user:{userId}`
- `getCachedUser(userId: string): Promise<User | null>` — reads from cache
- `cacheUser(userId: string, userData: User): Promise<void>` — writes to cache
- `invalidateUserCache(userId: string): Promise<void>` — deletes from cache
- TTL: 300 seconds (5 minutes)

## Step 3: Modify `src/app/api/auth/me/route.ts`

Add caching flow:

1. Get `userId` from `x-user-id` header (already validated by middleware)
2. Try `getCachedUser(userId)`
3. If cache hit → return `SuccessResponse(cachedUser)`
4. If cache miss → `getUniqueUser` from DB → `cacheUser` → return
5. On Redis error → fall through to DB query

## Step 4: Modify `src/shared/middleware/withSecurityHeaders.middleware.ts`

Add security headers:

**Global** (all responses):

- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

**Conditional** (if `x-user-id` header present — authenticated request):

- `Cache-Control: no-store, no-cache, must-revalidate, private`
- `Pragma: no-cache`

Detection: `req.headers.get("x-user-id")` — set by `withAuth` middleware before this middleware runs.

## Testing Strategy

1. **Manual testing**: Hit `/api/auth/me` twice within 5 minutes, verify second hit is from cache
2. **Redis failure test**: Temporarily disable Redis env vars, verify endpoint still works via DB
3. **Security headers test**: Check response headers for authenticated vs unauthenticated requests
4. **Cache isolation test**: Verify User A cannot access User B's cached data

## Rollback Plan

If issues arise:

1. Remove caching from `/api/auth/me` route (revert to direct DB query)
2. Security headers can remain (they are additive and non-breaking)
3. No database migrations or schema changes to roll back
