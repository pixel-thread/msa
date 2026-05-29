# Subscription Plan Versioning — Implementation Plan

## Overview

Implement versioned subscription plans so that when an admin changes a plan's price, only new subscribers get the new price. Existing subscribers remain locked to their original price until they manually upgrade.

---

## Phase 1: Schema Changes (`src/shared/lib/prisma/schema.prisma`)

### 1.1 Replace the `SubscriptionPlan` model

**Current fields to REMOVE from SubscriptionPlan:**

- `amount`
- `currency`
- `billingCycle`
- `features`
- `effectiveFrom`
- `@@unique([associationId,memberTypeId])`

**New SubscriptionPlan:**

```prisma
model SubscriptionPlan {
  id            String   @id @default(uuid())
  associationId String
  name          String
  description   String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  association   Association   @relation(fields: [associationId], references: [id], onDelete: Cascade)

  versions      SubscriptionPlanVersion[]
  subscriptions Subscription[]

  memberTypeId  String?
  memberType    MemberType?   @relation(fields: [memberTypeId], references: [id])

  @@unique([associationId, name])
  @@index([associationId])
  @@map("subscription_plans")
}
```

### 1.2 Add `SubscriptionPlanVersion` model

```prisma
model SubscriptionPlanVersion {
  id                 String           @id @default(uuid())
  planId             String

  amount             Decimal          @db.Decimal(10, 2)
  currency           String           @default("INR")
  billingCycle       String           @default("MONTHLY")
  features           Json
  description        String?

  effectiveFrom      DateTime         @default(now())
  effectiveTo        DateTime?        // Null = currently active version

  createdAt          DateTime         @default(now())

  plan               SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  subscriptions      Subscription[]
  billingHistory     SubscriptionBillingHistory[]

  @@index([planId])
  @@map("subscription_plan_versions")
}
```

### 1.3 Update `Subscription` model

```prisma
model Subscription {
  id            String    @id @default(uuid())
  userId        String    @unique
  planId        String
  planVersionId String    // NEW: links to the locked price version
  status        String    @default("ACTIVE")
  startDate     DateTime  @default(now())
  endDate       DateTime
  waivedAt      DateTime?
  waivedReason  String?
  waivedBy      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan          SubscriptionPlan        @relation(fields: [planId], references: [id])
  planVersion   SubscriptionPlanVersion @relation(fields: [planVersionId], references: [id])  // NEW

  billingHistory SubscriptionBillingHistory[]  // NEW

  @@index([status])
  @@index([endDate])
  @@map("subscriptions")
}
```

### 1.4 Add `SubscriptionBillingHistory` model

```prisma
model SubscriptionBillingHistory {
  id             String       @id @default(uuid())
  subscriptionId String
  planVersionId  String
  amountCharged  Decimal      @db.Decimal(10, 2)
  status         String       @default("PENDING")
  periodStart    DateTime
  periodEnd      DateTime
  dueDate        DateTime
  createdAt      DateTime     @default(now())

  subscription   Subscription            @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  planVersion    SubscriptionPlanVersion @relation(fields: [planVersionId], references: [id])

  @@index([subscriptionId])
  @@map("subscription_billing_history")
}
```

---

## Phase 2: Migration

Run `npx prisma migrate dev` after schema changes. Then create a data backfill migration script:

```typescript
// scripts/backfill-plan-versions.ts
import { prisma } from '@src/shared/lib/prisma';

async function backfill() {
  const plans = await prisma.subscriptionPlan.findMany();

  for (const plan of plans) {
    // Create a version from current plan data
    const version = await prisma.subscriptionPlanVersion.create({
      data: {
        planId: plan.id,
        amount: plan.amount,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: plan.features,
        description: plan.description,
        effectiveFrom: plan.effectiveFrom,
      },
    });

    // Link all existing subscriptions to this version
    await prisma.subscription.updateMany({
      where: { planId: plan.id },
      data: { planVersionId: version.id },
    });
  }
}

backfill();
```

---

## Phase 3: API Changes

### 3.1 `POST /subscriptions/plans` — Create Plan

**File:** `src/app/api/subscriptions/plans/route.ts`

Change the POST handler to create both the plan AND its first version:

```typescript
export const POST = withAssociation(
  { body: CreateSubscriptionPlanSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        memberTypeId: body.memberTypeId,
        associationId: association.id,
        versions: {
          create: {
            amount: body.amount,
            currency: body.currency,
            billingCycle: body.billingCycle,
            features: body.features,
            description: body.description,
          },
        },
      },
      include: {
        versions: {
          where: { effectiveTo: null },
          take: 1,
        },
      },
    });

    return SuccessResponse({ data: plan }, 201);
  },
);
```

### 3.2 `PATCH /subscriptions/plans/[planId]` — Update Plan

**File:** `src/app/api/subscriptions/plans/[planId]/route.ts`

When price fields change, create a new version. When metadata changes, update the plan directly:

```typescript
const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  features: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  memberTypeId: z.uuid().optional().nullable(),
});

export const PATCH = withAssociation(
  { body: UpdatePlanSchema },
  async (association, { body }, request, { params }) => {
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const { planId } = (await params) as { planId: string };

    const priceFields = ['amount', 'currency', 'billingCycle', 'features'];
    const hasPriceChange = priceFields.some(
      (field) => body[field as keyof typeof body] !== undefined,
    );

    if (hasPriceChange) {
      // Find current active version
      const currentVersion = await prisma.subscriptionPlanVersion.findFirst({
        where: { planId, effectiveTo: null },
      });

      if (!currentVersion) {
        throw new NotFoundError('No active version found for this plan');
      }

      // Deactivate current version and create new one
      const updatedPlan = await prisma.$transaction(async (tx) => {
        await tx.subscriptionPlanVersion.update({
          where: { id: currentVersion.id },
          data: { effectiveTo: new Date() },
        });

        const newVersion = await tx.subscriptionPlanVersion.create({
          data: {
            planId,
            amount: body.amount ?? currentVersion.amount,
            currency: body.currency ?? currentVersion.currency,
            billingCycle: body.billingCycle ?? currentVersion.billingCycle,
            features: body.features ?? currentVersion.features,
            description: body.description ?? currentVersion.description,
          },
        });

        const plan = await tx.subscriptionPlan.update({
          where: { id: planId, associationId: association.id },
          data: {
            name: body.name,
            description: body.description,
            isActive: body.isActive,
            memberTypeId: body.memberTypeId,
          },
          include: {
            versions: {
              where: { effectiveTo: null },
              take: 1,
            },
          },
        });

        return { ...plan, activeVersion: newVersion };
      });

      return SuccessResponse({ data: updatedPlan });
    }

    // Metadata-only update
    const { amount, currency, billingCycle, features, ...metadata } = body;
    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId, associationId: association.id },
      data: metadata,
    });

    return SuccessResponse({ data: plan });
  },
);
```

### 3.3 `GET /subscriptions/plans` — List Plans

**File:** `src/app/api/subscriptions/plans/route.ts`

Return plans with their active version included:

```typescript
export const GET = withAssociation({}, async (association, _, request) => {
  const user = await withRole(request, UserRole.MEMBER);

  const whereClause: any = {
    associationId: association.id,
    isActive: true,
  };

  if (user.memberTypeId) {
    whereClause.memberTypeId = user.memberTypeId;
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: user.memberTypeId ? whereClause : whereClause,
    include: {
      versions: {
        where: { effectiveTo: null },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Flatten active version for easier frontend consumption
  const plansWithActiveVersion = plans.map((plan) => ({
    ...plan,
    activeVersion: plan.versions[0] || null,
    versions: undefined,
  }));

  const result = user.memberTypeId ? plansWithActiveVersion : plansWithActiveVersion[0] || null;

  return SuccessResponse({ data: result });
});
```

### 3.4 `POST /subscriptions/subscribe` — Subscribe

**File:** `src/app/api/subscriptions/subscribe/route.ts`

Subscribe to the currently active version:

```typescript
export const POST = withAssociation(
  { body: SubscribeSchema },
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.MEMBER);

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: body.planId,
        associationId: association.id,
        isActive: true,
      },
      include: {
        versions: {
          where: { effectiveTo: null },
          take: 1,
        },
      },
    });

    if (!plan || plan.versions.length === 0) {
      throw new NotFoundError('Plan not found or has no active version');
    }

    const activeVersion = plan.versions[0];

    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictError('User already has an active subscription');
    }

    const startDate = new Date();
    const endDate = new Date();
    if (activeVersion.billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planId: plan.id,
        planVersionId: activeVersion.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        waivedAt: null,
        waivedReason: null,
        waivedBy: null,
      },
      create: {
        userId: user.id,
        planId: plan.id,
        planVersionId: activeVersion.id,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    // Create initial billing history entry
    await prisma.subscriptionBillingHistory.create({
      data: {
        subscriptionId: subscription.id,
        planVersionId: activeVersion.id,
        amountCharged: activeVersion.amount,
        status: 'PENDING',
        periodStart: startDate,
        periodEnd: endDate,
        dueDate: startDate,
      },
    });

    return SuccessResponse({ data: subscription }, 201);
  },
);
```

### 3.5 `GET /subscriptions/my` — My Subscription

**File:** `src/app/api/subscriptions/my/route.ts`

Include planVersion to show locked price:

```typescript
export const GET = withAssociation(
  { query: MySubscriptionQuerySchema },
  async (_association, { query }, request) => {
    const page = query?.page || 1;
    await withRole(request, UserRole.MEMBER);

    const userId = request.headers.get('x-user-id')!;

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where: { userId },
        include: {
          plan: true,
          planVersion: true,
        },
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.subscription.count({ where: { userId } }),
    ]);

    return SuccessResponse({
      data: subscriptions,
      meta: buildPagination(total, page),
    });
  },
);
```

### 3.6 NEW: `POST /subscriptions/upgrade` — Upgrade to Latest Version

**File:** `src/app/api/subscriptions/upgrade/route.ts` (new file)

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { z } from 'zod';
import { NotFoundError, ConflictError, ValidationError } from '@src/shared/errors';

const UpgradeSchema = z.object({
  planId: z.uuid(),
});

export const POST = withAssociation(
  { body: UpgradeSchema },
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.MEMBER);

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { planVersion: true },
    });

    if (!subscription) {
      throw new NotFoundError('No active subscription found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new ConflictError('Subscription is not active');
    }

    // Get the latest active version for this plan
    const latestVersion = await prisma.subscriptionPlanVersion.findFirst({
      where: {
        planId: body.planId,
        effectiveTo: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestVersion) {
      throw new NotFoundError('No active version found for this plan');
    }

    if (subscription.planVersionId === latestVersion.id) {
      throw new ConflictError('Already on the latest version');
    }

    const startDate = new Date();
    const endDate = new Date();
    if (latestVersion.billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planVersionId: latestVersion.id,
        startDate,
        endDate,
      },
      include: {
        plan: true,
        planVersion: true,
      },
    });

    // Create new billing history entry
    await prisma.subscriptionBillingHistory.create({
      data: {
        subscriptionId: subscription.id,
        planVersionId: latestVersion.id,
        amountCharged: latestVersion.amount,
        status: 'PENDING',
        periodStart: startDate,
        periodEnd: endDate,
        dueDate: startDate,
      },
    });

    return SuccessResponse({ data: updated });
  },
);
```

---

## Phase 4: Types & Validators

### 4.1 Update Types (`src/features/subscriptions/types/index.ts`)

```typescript
type BillCycle = 'MONTHLY' | 'YEARLY';

export type SubscriptionPlanVersion = {
  id: string;
  planId: string;
  amount: number;
  currency: string;
  billingCycle: BillCycle;
  features: Record<string, unknown>;
  description: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
};

export type SubscriptionPlan = {
  id: string;
  associationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberTypeId: string | null;
  activeVersion?: SubscriptionPlanVersion;
};

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  planVersionId: string;
  status: string;
  startDate: string;
  endDate: string;
  waivedAt: string | null;
  waivedReason: string | null;
  waivedBy: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  planVersion?: SubscriptionPlanVersion;
};
```

### 4.2 Update Validators (`src/features/subscriptions/validators/index.ts`)

```typescript
export const UpgradeSubscriptionSchema = z.object({
  planId: z.uuid(),
});
export type UpgradeSubscriptionInput = z.infer<typeof UpgradeSubscriptionSchema>;
```

---

## Phase 5: Update Subscription Cron Service

**File:** `src/features/cron/services/subscription-cron.service.ts`

When renewing subscriptions, use the planVersion to get the correct amount:

```typescript
// In the renewal logic, when creating a new billing cycle:
const subscription = await prisma.subscription.findUnique({
  where: { id: subscriptionId },
  include: { planVersion: true },
});

const amount = subscription.planVersion.amount;
const billingCycle = subscription.planVersion.billingCycle;
```

---

## Files to Modify Summary

| File                                                      | Change                                              |
| --------------------------------------------------------- | --------------------------------------------------- |
| `src/shared/lib/prisma/schema.prisma`                     | Replace subscription models with versioned versions |
| `src/app/api/subscriptions/plans/route.ts`                | Update GET and POST handlers                        |
| `src/app/api/subscriptions/plans/[planId]/route.ts`       | Update PATCH to create versions on price change     |
| `src/app/api/subscriptions/subscribe/route.ts`            | Update to use active version                        |
| `src/app/api/subscriptions/my/route.ts`                   | Include planVersion relation                        |
| `src/app/api/subscriptions/upgrade/route.ts`              | **NEW** endpoint                                    |
| `src/features/subscriptions/types/index.ts`               | Add version types                                   |
| `src/features/subscriptions/validators/index.ts`          | Add upgrade schema                                  |
| `src/features/cron/services/subscription-cron.service.ts` | Use planVersion for amounts                         |
