# SFTP Timeout Fix Plan

## Problem

`env.SFTP_TIMEOUT` and `env.SFTP_PORT` are strings (e.g. `"3000"`, `"22"`) instead of numbers because:

- `.env` has `SKIP_ENV_VALIDATION=1` which bypasses Zod coercion
- `runtimeEnv` passes `process.env` values raw without `parseInt()`

In ssh2, `typeof cfg.readyTimeout === 'number'` rejects the string and falls back to 20s default. `sock.setTimeout(0)` is called for `timeout`, disabling socket idle timeout entirely.

Additionally, the `delete()` method is missing `port`, `timeout`, `readyTimeout`, and the debug log leaks the password.

## Changes Required

### 1. `src/env.ts` — Parse number values in runtimeEnv

**Lines 72-73** — change:

```typescript
    SFTP_PORT: process.env.SFTP_PORT,
    SFTP_TIMEOUT: process.env.SFTP_TIMEOUT,
```

to:

```typescript
    SFTP_PORT: process.env.SFTP_PORT ? parseInt(process.env.SFTP_PORT) : 22,
    SFTP_TIMEOUT: process.env.SFTP_TIMEOUT
      ? parseInt(process.env.SFTP_TIMEOUT)
      : 10000,
```

This matches the existing pattern used for `OTP_LENGTH`, `OTP_MAX_ATTEMPTS`, etc.

### 2. `src/shared/services/storage/sftp.ts` — Remove password from debug log

**Lines 15-21** — change:

```typescript
logger.debug('[Storage] SFTP connecting...', {
  host: env.SFTP_HOST,
  port: env.SFTP_PORT,
  username: env.SFTP_USERNAME,
  password: env.SFTP_PASSWORD,
  readyTimeout: env.SFTP_TIMEOUT,
});
```

to:

```typescript
logger.debug('[Storage] SFTP connecting...', {
  host: env.SFTP_HOST,
  port: env.SFTP_PORT,
  username: env.SFTP_USERNAME,
  readyTimeout: env.SFTP_TIMEOUT,
});
```

### 3. `src/shared/services/storage/sftp.ts` — Fix `delete()` to include port/timeout

**Lines 59-63** — change:

```typescript
await sftp.connect({
  host: env.SFTP_HOST!,
  username: env.SFTP_USERNAME,
  password: env.SFTP_PASSWORD!,
});
```

to:

```typescript
await sftp.connect({
  host: env.SFTP_HOST,
  port: env.SFTP_PORT,
  timeout: env.SFTP_TIMEOUT,
  username: env.SFTP_USERNAME,
  password: env.SFTP_PASSWORD,
  readyTimeout: env.SFTP_TIMEOUT,
});
```

## Verification

After applying, run `npm run typecheck` or `npx tsc --noEmit` to verify no type errors.
