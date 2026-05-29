# PRD: Multi-Tenant Payment Provider Architecture

**Status:** DRAFT
**Created:** 2026-05-16
**Feature Name:** Multi-Tenant Payment Providers
**Priority:** P1 (Core Infrastructure)
**Target:** Enable multiple organizations (associations) to use their own payment gateway accounts

---

## 1. Overview

### 1.1 Problem Statement

Currently, the backend uses a single global Razorpay account configured via environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`). This architecture does not support multi-tenant scenarios where:

- Association A wants to use their own Razorpay merchant account
- Association B wants to use their own Razorpay merchant account
- Each association should have independent payment processing, reporting, and webhook handling

### 1.2 Solution

Introduce a **PaymentProvider** model that stores per-association payment gateway credentials. The backend will dynamically load the correct credentials based on the `associationId` from the request context.

### 1.3 Goals

1. Support multiple payment gateway types (Razorpay, Stripe, PayU, Cashfree)
2. Store credentials securely using AES-256-GCM encryption
3. Allow each association to configure their own payment provider
4. Maintain backwards compatibility during migration
5. Provide admin APIs for managing payment providers

### 1.4 Non-Goals

- Payment gateway dashboard/UI (future scope)
- Automatic provider switching based on payment success rates
- Multi-provider split payments (one payment across multiple gateways)

---

## 2. User Stories

| #   | User                  | Story                                                                                                                                           | Acceptance Criteria                                                                                                                                 |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Super Admin           | As a Super Admin, I want to configure Razorpay credentials for an association so that they can process payments with their own merchant account | - Can create PaymentProvider via API<br>- Credentials are encrypted at rest<br>- KeyId is visible, secrets are masked                               |
| 2   | Association President | As an Association President, I want to update my association's Razorpay credentials if they expire                                              | - Can update existing PaymentProvider<br>- Old credentials are replaced atomically<br>- Existing payments continue to work                          |
| 3   | Finance Officer       | As a Finance Officer, I want to view which payment provider is active for my association                                                        | - Can list providers for their association<br>- Can see which provider is active                                                                    |
| 4   | System                | As the system, I want to use the correct Razorpay credentials when processing a payment for an association                                      | - createPaymentOrder uses association's provider<br>- verifyPaymentSignature uses association's provider<br>- Webhooks route to correct association |
| 5   | Super Admin           | As a Super Admin, I want to migrate all existing associations from env vars to the database                                                     | - One-time migration script runs successfully<br>- All associations have PaymentProvider records<br>- Env vars become optional                      |

---

## 3. Technical Architecture

### 3.1 Database Schema

**New Model: PaymentProvider**

```prisma
model PaymentProvider {
  id                      String    @id @default(uuid())
  associationId          String
  provider               String    // "razorpay" | "stripe" | "payu" | "cashfree"
  keyId                  String    // Public key - safe to expose
  encryptedKeySecret     String    // AES-256-GCM encrypted
  encryptedWebhookSecret String?   // AES-256-GCM encrypted
  isActive               Boolean   @default(true)
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  association            Association @relation(fields: [associationId], references: [id], onDelete: Cascade)

  @@unique([associationId, provider])
  @@index([associationId])
  @@index([associationId, isActive])
}
```

**Constraints:**

- `associationId + provider` must be unique (one provider per type per association)
- `isActive = true` indicates the provider used for payment operations

**Existing Models Affected:**

| Model               | Change                                                            |
| ------------------- | ----------------------------------------------------------------- |
| PaymentTransaction  | No schema change - uses provider from runtime lookup              |
| PaymentWebhookEvent | No schema change - routes via orderId → transaction → association |

### 3.2 Encryption Strategy

**Library:** `src/shared/lib/crypto.ts` (already implements AES-256-GCM)

**Flow:**

1. Admin provides `keySecret` and `webhookSecret` via API
2. Backend encrypts using `encrypt(plaintext)` before storing
3. On payment operations, decrypt using `decrypt(ciphertext)` in memory
4. Never log or expose decrypted secrets

**Environment Variable Migration:**

```typescript
// In env.ts, make these optional after migration:
RAZORPAY_KEY_ID?: string
RAZORPAY_KEY_SECRET?: string
RAZORPAY_WEBHOOK_SECRET?: string
```

### 3.3 Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API Routes                                 │
│  POST /payments/providers             (upsert)                     │
│  GET  /payments/providers             (list)                       │
│  GET  /payments/providers/[id]         (get one)                  │
│  PATCH/payments/providers/[id]         (update)                   │
│  DELETE /payments/providers/[id]       (delete)                    │
│  POST /payments/providers/[id]/activate (set active)            │
│                                                                     │
│  Uses withAssociation middleware to inject association context    │
│  from user session (no slug needed in URL)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   payment-provider.service.ts                      │
│  - upsertProvider()          - create or update by association+   │
│  - getProvidersByAssociation()                                     │
│  - getActiveProvider()       - for payment operations               │
│  - setActiveProvider()      - switch active provider              │
│  - deleteProvider()         - soft or hard delete                 │
│  - migrateFromEnv()         - one-time migration                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      razorpay.service.ts                           │
│  - createRazorpayClient(keyId, keySecret)  → Razorpay instance   │
│  - getRazorpayClientForAssociation(assocId) → loads & decrypt    │
│  - verifyPaymentSignature(params, keySecret)                      │
│  - verifyWebhookSignature(body, webhookSecret)                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      payment.service.ts                            │
│  - createPaymentOrder(assocId, ...) → loads provider → creates    │
│  - verifyAndCompletePayment(assocId, ...) → loads provider → ver │
│  - webhook processing → routes to correct association's provider  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Authentication & Association Context

The API routes use `@src/shared/api/with-association.ts` middleware which automatically extracts the association from the authenticated user's session based on the `x-user-id` header.

**How it works:**

1. User authenticates (session contains their `associationId`)
2. API route uses `withAssociation` middleware
3. Middleware looks up user's association from database
4. Handler receives `association` object with `{ id, slug, name }`
5. No need for `[slug]` in URL - association is injected automatically

**Note:** Unlike other APIs in this codebase, no `[slug]` parameter is used in the URL path. The `withAssociation` middleware injects the user's association from their session for every request.

### 3.5 API Request/Response Patterns

**POST /api/payments/providers (Upsert)**

Request (associationId is injected from session via withAssociation middleware):

```json
{
  "provider": "razorpay",
  "keyId": "rzp_test_abc123",
  "keySecret": "razorpay_secret_xyz",
  "webhookSecret": "webhook_secret_123",
  "isActive": true
}
```

Response:

```json
{
  "id": "pp_xyz789",
  "associationId": "assoc_abc123",
  "provider": "razorpay",
  "keyId": "rzp_test_abc123",
  "isActive": true,
  "createdAt": "2026-05-16T10:00:00Z",
  "updatedAt": "2026-05-16T10:00:00Z"
}
```

**GET /api/payments/providers (List)**

Response:

```json
{
  "data": [
    {
      "id": "pp_xyz789",
      "associationId": "assoc_abc123",
      "provider": "razorpay",
      "keyId": "rzp_test_abc123",
      "isActive": true,
      "createdAt": "2026-05-16T10:00:00Z",
      "updatedAt": "2026-05-16T10:00:00Z"
    }
  ]
}
```

---

## 4. Functionality Specification

### 4.1 Payment Provider CRUD

The API routes use `withAssociation` middleware which automatically provides the `association` context from the authenticated user's session. No `associationId` required in request body.

#### 4.1.1 Upsert Provider (Create or Update)

- **Trigger:** POST /api/payments/providers
- **Authentication:** Uses `withAssociation` middleware (see section 3.4)
- **Validation:**
  - provider must be a valid PaymentProviderType
  - keyId must not be empty
  - keySecret must not be empty
  - If Razorpay: keyId should start with `rzp_`
- **Behavior:**
  - If provider for this association+type exists → update (upsert pattern)
  - If not exists → create new
  - Encrypt keySecret and webhookSecret before storing
- **Response:** Created/updated provider (secrets masked)

#### 4.1.2 Partial Update Provider

- **Trigger:** PATCH /api/payments/providers/:id
- **Behavior:**
  - All fields optional - only update provided fields
  - If keySecret provided → re-encrypt before storing
  - If webhookSecret provided → re-encrypt before storing
- **Access:** Must belong to user's association
- **Response:** Updated provider (secrets masked)

#### 4.1.3 List Providers

- **Trigger:** GET /api/payments/providers
- **Authentication:** Uses `withAssociation` middleware
- **Access:** Users see only their association's providers
- **Response:** Array of providers (secrets always masked)

#### 4.1.4 Get Provider

- **Trigger:** GET /api/payments/providers/:id
- **Access:** Must belong to user's association
- **Response:** Single provider (secrets masked)

#### 4.1.5 Update Provider

- **Trigger:** PATCH /api/payments/providers/:id
- **Behavior:**
  - Can update any field
  - If keySecret provided → re-encrypt
  - If webhookSecret provided → re-encrypt
- **Response:** Updated provider (secrets masked)

#### 4.1.6 Delete Provider

- **Trigger:** DELETE /api/payments/providers/:id
- **Behavior:**
  - Hard delete (or soft delete with isActive=false)
  - If was active and other providers exist → error unless another is set active
  - If was only provider → allow but payment operations will fail
- **Response:** 204 No Content

#### 4.1.7 Activate Provider

- **Trigger:** POST /api/payments/providers/:id/activate
- **Behavior:**
  - Set this provider as active for the association
  - Deactivate other providers of same type
- **Response:** Updated provider

### 4.2 Payment Processing Updates

#### 4.2.1 Create Payment Order

**Before (Current):**

```typescript
const razorpay = getRazorpayInstance(); // Uses env vars
const order = await razorpay.orders.create({ ... });
```

**After:**

```typescript
const provider = await getActiveProvider(associationId, "razorpay");
if (!provider) throw Error("No payment provider configured");

const keySecret = decrypt(provider.encryptedKeySecret);
const razorpay = createRazorpayClient(provider.keyId, keySecret);
const order = await razorpay.orders.create({ ... });
```

#### 4.2.2 Verify Payment

**Before:**

```typescript
const valid = verifyPaymentSignature({ ... }); // Uses env var
```

**After:**

```typescript
const transaction = await getTransactionByOrderId(razorpayOrderId);
const provider = await getActiveProvider(transaction.associationId, "razorpay");
const keySecret = decrypt(provider.encryptedKeySecret);
const valid = verifyPaymentSignature({ ... }, keySecret);
```

#### 4.2.3 Webhook Processing

**Before:**

```typescript
const valid = verifyWebhookSignature(rawBody, signature); // Uses env var
```

**After:**

```typescript
// 1. Extract order ID from webhook payload
// 2. Find PaymentTransaction by razorpayOrderId
// 3. Get associationId from transaction
// 4. Get provider for that association
// 5. Decrypt webhook secret
// 6. Verify signature with correct secret
// 7. Process event
```

### 4.3 Migration

**Script: `scripts/migrate-payment-providers.ts`**

1. Check if any PaymentProvider records exist
2. If not and env vars are set:
   - Fetch all Associations
   - For each, create PaymentProvider with env var credentials
   - Encrypt using `encrypt()` function
3. Mark migration as complete (log or flag file)
4. Make env vars optional in env.ts

**Rollback Plan:**

- If issues detected, revert to env vars by adding fallback in payment.service.ts
- Keep env vars as optional during initial rollout

---

## 5. Security Considerations

| Field                  | Client Safe? | Storage   | API Response |
| ---------------------- | ------------ | --------- | ------------ |
| id                     | Yes          | Plain     | Yes          |
| associationId          | Yes          | Plain     | Yes          |
| provider               | Yes          | Plain     | Yes          |
| keyId                  | Yes          | Plain     | Yes          |
| encryptedKeySecret     | No           | Encrypted | **NEVER**    |
| encryptedWebhookSecret | No           | Encrypted | **NEVER**    |
| isActive               | Yes          | Plain     | Yes          |
| createdAt              | Yes          | Plain     | Yes          |
| updatedAt              | Yes          | Plain     | Yes          |

**Attack Vectors Prevented:**

1. **SQL Injection:** Parameterized queries via Prisma
2. **Secrets Exposure:** Never return encrypted fields in JSON responses
3. **Timing Attacks:** Use `crypto.timingSafeEqual` for signature verification
4. **Replay Attacks:** Webhook processing checks for duplicate eventId

---

## 6. API Endpoints Summary

All routes use `withAssociation` middleware which injects the user's association from their session. No `[slug]` in URL - association is automatically derived from user session.

| Method | Endpoint                               | Description                           | Auth                        |
| ------ | -------------------------------------- | ------------------------------------- | --------------------------- |
| POST   | `/api/payments/providers`              | Upsert provider (create or update)    | withAssociation             |
| GET    | `/api/payments/providers`              | List providers for user's association | withAssociation             |
| GET    | `/api/payments/providers/:id`          | Get single provider                   | withAssociation + ownership |
| PATCH  | `/api/payments/providers/:id`          | Update provider (partial)             | withAssociation + ownership |
| DELETE | `/api/payments/providers/:id`          | Delete provider                       | withAssociation + ownership |
| POST   | `/api/payments/providers/:id/activate` | Set as active provider                | withAssociation + ownership |

---

## 7. File Structure

```
src/
├── features/
│   └── payments/
│       ├── services/
│       │   ├── payment-provider.service.ts   # NEW
│       │   ├── razorpay.service.ts            # MODIFIED
│       │   └── payment.service.ts            # MODIFIED
│       ├── validators/
│       │   └── index.ts                       # MODIFIED
│       ├── types/
│       │   └── index.ts                       # NEW
│       └── api/
│           └── payments/
│               └── providers/
│                   ├── route.ts                # POST, GET (list)
│                   └── [providerId]/
│                       ├── route.ts            # GET, PATCH, DELETE
│                       └── activate/
│                           └── route.ts       # POST activate
├── shared/
│   └── api/
│       └── with-association.ts               # Existing middleware
└── env.ts                                      # MODIFIED
```

**Route Patterns:**

- `/api/payments/providers` - No slug needed, association injected from session
- Example: `/api/payments/providers`
- Uses `withAssociation` middleware to inject user's association from session

---

## 8. Testing Plan

### 8.1 Unit Tests

- `payment-provider.service.ts`: upsert, get, delete, setActive
- `razorpay.service.ts`: createRazorpayClient with mock credentials
- `payment.service.ts`: createPaymentOrder uses provider (mock provider)

### 8.2 Integration Tests

- POST /payments/providers creates encrypted record
- GET /payments/providers masks secrets
- Create payment order uses correct association's provider

### 8.3 Migration Test

- Run migration script on staging
- Verify all associations have PaymentProvider records
- Create test payment and verify it uses DB credentials

---

## 9. Timeline & Milestones

| Milestone | Description                                        | Estimate     |
| --------- | -------------------------------------------------- | ------------ |
| M1        | Add PaymentProvider to schema.prisma               | 1 day        |
| M2        | Create payment-provider.service.ts with CRUD       | 1 day        |
| M3        | Add validators and types                           | 0.5 day      |
| M4        | Create API routes for providers                    | 1 day        |
| M5        | Modify razorpay.service.ts for dynamic credentials | 0.5 day      |
| M6        | Modify payment.service.ts to use providers         | 1 day        |
| M7        | Create migration script                            | 0.5 day      |
| M8        | End-to-end testing                                 | 1 day        |
| **Total** |                                                    | **6.5 days** |

---

## 10. Open Questions

1. **Should we allow disabling all providers?** - If an association deletes all providers, payment operations will fail. Should we prevent this or allow it?

2. **Should we support provider-specific notes/metadata?** - For future (e.g., store Razorpay merchant ID, bank name)

3. **Should we add webhook URL per provider?** - Currently single webhook endpoint routes internally. Should each provider have its own webhook URL?

4. **How to handle Razorpay webhooks for test mode vs live mode?** - KeyId can indicate test/live, but should we allow configuring both?

---

## 11. Dependencies

- **Razorpay SDK:** Already installed
- **Encryption:** Already implemented in `src/shared/lib/crypto.ts`
- **Prisma:** Already in use
- **No new npm packages required**

---

## 12. Risks & Mitigations

| Risk                              | Impact                               | Mitigation                                   |
| --------------------------------- | ------------------------------------ | -------------------------------------------- |
| Migration fails mid-way           | Payments break                       | Test on staging first, keep env var fallback |
| Secrets not decrypted correctly   | Payment failures                     | Unit test encrypt/decrypt roundtrip          |
| Race condition in upsert          | Duplicate providers                  | Use database transaction                     |
| Webhook routing wrong association | Wrong provider used for verification | Validate via transaction.associationId       |

---

## 13. Success Criteria

1. ✅ Can create PaymentProvider for any association
2. ✅ Credentials stored encrypted in database
3. ✅ Payment order creation uses association's provider
4. ✅ Payment verification uses association's provider
5. ✅ Webhook verification uses association's provider
6. ✅ Can have multiple provider types per association
7. ✅ Can switch active provider
8. ✅ Migration script works for existing associations
9. ✅ No secrets exposed in API responses
10. ✅ Backwards compatible during rollout
