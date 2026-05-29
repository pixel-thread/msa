# PRD: API Response Caching & Security Hardening

## 1. Overview

Add server-side caching to the `/api/auth/me` endpoint using the existing Upstash Redis infrastructure, and enhance security headers across all authenticated API routes. This is the first phase of a broader caching strategy — only `/api/auth/me` is cached now, with the cache layer designed for easy migration and expansion to other endpoints later.

## 2. Problem Statement

### 2.1 Performance

- The `/api/auth/me` endpoint is called on nearly every page load (sidebar, header, profile checks)
- Each call hits the PostgreSQL database directly via Prisma
- Under load, this creates unnecessary DB connection churn for data that rarely changes

### 2.2 Security

- Authenticated API responses lack `Cache-Control` headers, allowing browsers and proxies to cache sensitive user data
- Missing modern security headers: `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- No defense-in-depth for cached response prevention on authenticated routes

## 3. Goals

| Goal                                       | Metric                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| Reduce DB load on `/api/auth/me`           | >80% cache hit rate under normal usage                       |
| Prevent browser/proxy caching of auth data | `Cache-Control: no-store` on all authenticated API responses |
| Add missing security headers               | All 3 new headers present on every response                  |
| Zero breaking changes                      | Existing API contract unchanged, graceful Redis degradation  |

## 4. Scope

### In Scope

- Redis-backed cache layer for `/api/auth/me` endpoint only
- Cache invalidation helper for future use
- Security header enhancements via existing `withSecurityHeaders` middleware
- Graceful degradation if Redis is unavailable

### Out of Scope (Future)

- Caching other API endpoints
- Cache warming / prefetching
- Cache analytics / monitoring dashboard
- CSP `unsafe-eval` removal (requires broader code audit)
- Cache invalidation on user profile update (no PUT/PATCH endpoint exists yet)

## 5. Technical Design

### 5.1 Cache Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Client     │────▶│  Next.js Route   │────▶│    Redis     │
│   Request    │     │  /api/auth/me    │     │  (Upstash)   │
└──────────────┘     └────────┬─────────┘     └──────────────┘
                              │
                              │ (cache miss / Redis error)
                              ▼
                       ┌──────────────┐
                       │   Prisma     │
                       │  PostgreSQL  │
                       └──────────────┘
```

### 5.2 Cache Key Strategy

- **Key format**: `mfsa:user:{userId}`
- **Source of userId**: `x-user-id` header (set by `withAuth` middleware after JWT verification)
- **Namespacing**: `mfsa:` prefix prevents collisions with other data in shared Redis

### 5.3 Cache TTL

- **5 minutes (300 seconds)**
- Rationale: User profile data (name, email, role, status) changes infrequently. A 5-minute window limits stale data exposure while providing meaningful DB load reduction.

### 5.4 Cached Data

Only the fields returned by `getUniqueUser`:

- `id`, `associationId`, `email`, `name`, `role`, `status`, `memberTypeId`

**Excluded (never cached)**: `password`, `passwordResetToken`, `mfaEnabled`, `mobile` (encrypted), `designation` (encrypted), `failedLoginAttempts`, `lockedUntil`, tokens, timestamps

### 5.5 Graceful Degradation

All Redis operations are wrapped in try/catch. On any Redis failure:

- Cache read returns `null` → falls through to DB query
- Cache write is silently skipped → DB serves the request
- No request ever fails due to cache infrastructure issues

### 5.6 Security Headers

**Added to authenticated API responses only** (detected by presence of `x-user-id` header):
| Header | Value | Purpose |
|---|---|---|
| `Cache-Control` | `no-store, no-cache, must-revalidate, private` | Prevents all caching of authenticated responses |
| `Pragma` | `no-cache` | HTTP/1.0 backward compatibility |

**Added globally** (all responses):
| Header | Value | Purpose |
|---|---|---|
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unnecessary browser features |
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevents cross-origin window access |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents other origins from reading resources |

## 6. Security Considerations

### 6.1 Cache Key Trust

The cache key is derived from `x-user-id`, which is set by the `withAuth` middleware **after** JWT verification. Users cannot spoof this header because:

1. The middleware chain runs before the route handler
2. The header is set server-side from the verified JWT payload
3. Any client-supplied `x-user-id` header is overwritten

### 6.2 No Sensitive Data in Cache

The cached data comes from `getUniqueUser`, which uses a `select` clause that explicitly excludes sensitive fields. Even if Redis were compromised, no passwords, tokens, or encrypted PII would be exposed.

### 6.3 Browser/Proxy Cache Prevention

The `Cache-Control: no-store` header ensures that:

- Browser HTTP cache does not store the response
- CDNs and reverse proxies do not cache the response
- Service workers do not cache the response

### 6.4 Stale Data Window

Maximum 5-minute window for stale data. If a user's role changes or account is suspended, the worst case is 5 minutes of stale cached data before the TTL expires.

## 7. Future Migration Path

The cache layer is designed with an abstract interface (`CacheClient`) so the implementation can be swapped without changing route handlers:

```typescript
interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}
```

Future backends could include:

- Vercel KV
- In-memory LRU cache (for single-instance deployments)
- Redis Cluster
- Cloudflare Workers KV

## 8. Success Criteria

- [ ] `/api/auth/me` returns cached data on subsequent requests within TTL
- [ ] All authenticated API responses include `Cache-Control: no-store`
- [ ] All responses include new security headers
- [ ] Redis failure does not break any requests
- [ ] No changes to API response shape or status codes
- [ ] No sensitive data in cache
