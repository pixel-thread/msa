# Plan: Multi-Tenant Payment Provider Implementation

**Status:** PLANNED
**Created:** 2026-05-16
**PRD Reference:** docs/superpowers/specs/2026-05-16-multi-tenant-payment-providers-prd.md
**Feature:** Multi-Tenant Payment Providers

---

## Overview

This plan implements the Multi-Tenant Payment Provider architecture described in the PRD. The implementation enables multiple associations to use their own payment gateway accounts (e.g., Razorpay, Stripe) with credentials stored securely in the database.

---

## Implementation Phases

### Phase 1: Database Schema Changes

**Files to modify:**

- `src/shared/lib/prisma/schema.prisma`

**Changes:**

1. Add `PaymentProvider` model with fields:
   - `id`, `associationId`, `provider`, `keyId`
   - `encryptedKeySecret`, `encryptedWebhookSecret`
   - `isActive`, `createdAt`, `updatedAt`
2. Add unique constraint on `[associationId, provider]`
3. Add indexes on `associationId` and `[associationId, isActive]`

**Task:**

```
[ ] Add PaymentProvider model to schema.prisma
[ ] Run prisma generate
[ ] Create migration: npx prisma migrate create add_payment_providers
```

---

### Phase 2: Create Payment Provider Service

**Files to create:**

- `src/features/payments/services/payment-provider.service.ts`

**Functions to implement:**

1. `upsertProvider(data)` - Create or update provider by association+provider
2. `getProviderById(id)` - Get single provider
3. `getProvidersByAssociation(associationId)` - List all for association
4. `getActiveProvider(associationId, providerType?)` - Get provider for payments
5. `setActiveProvider(providerId, associationId)` - Switch active provider
6. `deleteProvider(providerId, associationId)` - Delete provider

**Implementation notes:**

- Use Prisma transactions for upsert to prevent race conditions
- Import `encrypt`/`decrypt` from `@src/shared/lib/crypto`
- Log all create/update/delete operations

---

### Phase 3: Add Validators and Types

**Files to modify:**

- `src/features/payments/validators/index.ts`
- `src/features/payments/types/index.ts` (create if not exists)

**Add to validators:**

```typescript
export const UpsertPaymentProviderSchema = z.object({
  provider: z.enum(['razorpay', 'stripe', 'payu', 'cashfree']),
  keyId: z.string().min(1),
  keySecret: z.string().min(1),
  webhookSecret: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdatePaymentProviderSchema = UpsertPaymentProviderSchema.partial();

export const PaymentProviderIdSchema = z.object({
  providerId: z.string().cuid(),
});
```

---

### Phase 4: Create API Routes

**Files to create:**

- `src/app/api/payments/providers/route.ts` - List, Upsert
- `src/app/api/payments/providers/[providerId]/route.ts` - Get, Update, Delete
- `src/app/api/payments/providers/[providerId]/activate/route.ts` - Activate

**Implementation:** Use `withAssociation` middleware which injects `association` from user session. No `[slug]` in URL - follows same pattern as other API routes in the codebase.

**Routes:**

| Method | Path                                 | Handler  |
| ------ | ------------------------------------ | -------- |
| POST   | /api/payments/providers              | upsert   |
| GET    | /api/payments/providers              | list     |
| GET    | /api/payments/providers/:id          | get      |
| PATCH  | /api/payments/providers/:id          | update   |
| DELETE | /api/payments/providers/:id          | delete   |
| POST   | /api/payments/providers/:id/activate | activate |

**Auth:**

- All routes use `withAssociation` middleware
- User's association derived from their session (via `x-user-id` header)
- No `[slug]` in URL - follows existing API patterns in codebase

---

### Phase 5: Modify Razorpay Service

**Files to modify:**

- `src/features/payments/services/razorpay.service.ts`

**Changes:**

1. Change from singleton to factory:

   ```typescript
   // OLD
   const getRazorpayInstance = (): Razorpay => { ... }

   // NEW
   export const createRazorpayClient = (keyId: string, keySecret: string): Razorpay => {
     return new Razorpay({ key_id: keyId, key_secret: keySecret });
   }
   ```

2. Add helper function:

   ```typescript
   export const getRazorpayClientForAssociation = async (associationId: string) => {
     const provider = await getActiveProvider(associationId, 'razorpay');
     if (!provider) throw new BadRequest('No payment provider configured');
     return createRazorpayClient(provider.keyId, decrypt(provider.encryptedKeySecret));
   };
   ```

3. Update signature verification functions to accept keySecret parameter

---

### Phase 6: Modify Payment Service

**Files to modify:**

- `src/features/payments/services/payment.service.ts`

**Changes:**

1. In `createPaymentOrder`:
   - Load provider using `getActiveProvider(associationId, "razorpay")`
   - Use `createRazorpayClient` with provider credentials
   - Remove dependency on env vars

2. In `verifyAndCompletePayment`:
   - Load provider from transaction.associationId
   - Use provider's keySecret for signature verification

3. In webhook processing (`src/features/payments/services/webhook.service.ts`):
   - Extract associationId from PaymentTransaction
   - Load provider for that association
   - Use provider's webhookSecret for verification

---

### Phase 7: Create Migration Script

**Files to create:**

- `scripts/migrate-payment-providers.ts`

**Logic:**

```typescript
async function migrate() {
  // 1. Check if any providers exist
  const existing = await prisma.paymentProvider.count();
  if (existing > 0) {
    console.log('Providers already exist, skipping migration');
    return;
  }

  // 2. Check if env vars are set
  if (!env.RAZORPAY_KEY_ID) {
    console.log('No global credentials to migrate');
    return;
  }

  // 3. Create provider for each association
  const associations = await prisma.association.findMany();
  for (const assoc of associations) {
    await prisma.paymentProvider.create({
      data: {
        associationId: assoc.id,
        provider: 'razorpay',
        keyId: env.RAZORPAY_KEY_ID,
        encryptedKeySecret: encrypt(env.RAZORPAY_KEY_SECRET),
        encryptedWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET
          ? encrypt(env.RAZORPAY_WEBHOOK_SECRET)
          : null,
        isActive: true,
      },
    });
    console.log(`Migrated provider for ${assoc.name}`);
  }
}
```

**Execute:**

```bash
npx tsx scripts/migrate-payment-providers.ts
```

---

### Phase 8: Environment Variable Changes

**Files to modify:**

- `src/env.ts`

**Changes:**

```typescript
// Make these optional (remove .min(1))
RAZORPAY_KEY_ID: z.string().optional(),
RAZORPAY_KEY_SECRET: z.string().optional(),
RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
```

---

## Implementation Order

```
Phase 1: Database Schema
    │
    ▼
Phase 2: Payment Provider Service
    │
    ▼
Phase 3: Validators & Types
    │
    ▼
Phase 4: API Routes
    │
    ▼
Phase 5: Razorpay Service Updates
    │
    ▼
Phase 6: Payment Service Updates
    │
    ▼
Phase 7: Migration Script
    │
    ▼
Phase 8: Environment Variables
    │
    ▼
Testing & Validation
```

---

## Testing Checklist

- [ ] Prisma migration runs successfully
- [ ] POST /api/payments/[slug]/providers creates encrypted record
- [ ] GET /api/payments/[slug]/providers lists providers without secrets
- [ ] PATCH /api/payments/[slug]/providers/[id] updates fields correctly
- [ ] DELETE /api/payments/[slug]/providers/[id] removes record
- [ ] POST /api/payments/[slug]/providers/[id]/activate sets active
- [ ] Payment order creation uses correct provider
- [ ] Payment verification uses correct provider
- [ ] Webhook verification uses correct provider
- [ ] Migration script works on staging
- [ ] No secrets in API response (verify with network tab)

---

## Related Files

**PRD:** docs/superpowers/specs/2026-05-16-multi-tenant-payment-providers-prd.md

**Existing Services:**

- src/features/payments/services/razorpay.service.ts
- src/features/payments/services/payment.service.ts
- src/features/payments/services/webhook.service.ts
- src/shared/lib/crypto.ts
- src/shared/api/with-association.ts

**Database:**

- src/shared/lib/prisma/schema.prisma

---

## Notes

- Association context injected via `withAssociation` middleware - no `associationId` in request body
- Backwards compatibility maintained until migration completes
- After migration, env vars become fallback (optional)
- All secrets encrypted using existing AES-256-GCM implementation
- No new npm dependencies required
