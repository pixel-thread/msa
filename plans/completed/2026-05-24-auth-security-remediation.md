# Plan: Auth Security & Architecture Remediation

**Status:** COMPLETE
**Archived:** 2026-05-24
**PRD Reference:** Security Review Hotfix (No PRD)
**Model Used:** Gemini 3 Pro
**Tech Stack Confirmed:** brain/stack.md read ✅
**Last Updated:** 2026-05-24

## Tasks

- [x] [SEC] Identify and model all security-sensitive surfaces for the identified auth vulnerabilities.
- [x] [DESIGN] Architecture / schema design
  - Design Refresh Token grace period (e.g., using Redis) to prevent race conditions.
  - Standardize CSRF cookie naming convention and environment conditional logic.
  - Design middleware chain reordering and error capture for `withLogging`.
- [x] [TEST] Write failing tests (TDD)
  - Tests for JWT algorithm enforcement.
  - Tests for CSRF cookie handling.
  - Tests for middleware logging error capture.
  - Tests ensuring tokens are not returned in JSON response bodies.
  - Tests simulating concurrent refresh token requests (race condition).
- [x] [IMPL] Fix Missing JWT Algorithm Enforcement in `src/shared/lib/jwt.ts`
- [x] [IMPL] Fix CSRF Cookie Name Mismatch in `src/shared/middleware/with-csrf.middleware.ts`
- [x] [IMPL] Fix Session Token Exposure in `src/app/api/auth/sign-in/route.ts` and `src/app/api/auth/refresh/route.ts`
- [x] [IMPL] Fix Insecure CSP Directives in `src/shared/middleware/withSecurityHeaders.middleware.ts`
- [x] [IMPL] Reorder Middleware and fix logging in `src/proxy.ts` and `src/shared/middleware/chain.ts`
- [x] [IMPL] Fix Refresh Token Race Condition in `src/app/api/auth/refresh/route.ts` (or related service)
- [x] [REVIEW] Security review gate

## Security Flags

> To be populated during [SEC] task: Will ensure token rotation race condition does not create window for replay attacks, and that CSP strictness doesn't break essential inline scripts without nonces/hashes.

## Files Created via §3

> None
