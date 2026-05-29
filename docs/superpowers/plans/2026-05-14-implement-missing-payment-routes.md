# Missing Payment Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement missing payment-related API routes to complete the administration and reporting features.

**Architecture:** Extend existing payment and contribution services, add new Zod validators, and implement Next.js API route handlers using established `withAssociation` and `withRole` wrappers.

**Tech Stack:** Next.js (App Router), Prisma, Zod, TypeScript.

---

### Task 1: Update Validators

**Files:**

- Modify: `src/features/payments/validators/index.ts`

- [ ] **Step 1: Add GetTransactionsQuerySchema**

```typescript
export const GetTransactionsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'WAIVED']).optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'ONLINE']).optional(),
  gateway: z.enum(['RAZORPAY', 'MANUAL']).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().positive()),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});
```

- [ ] **Step 2: Add CollectionReportQuerySchema**

```typescript
export const CollectionReportQuerySchema = z.object({
  year: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020)),
  month: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(12)),
  status: z.enum(['DUE', 'PARTIAL', 'PAID', 'WAIVED', 'OVERDUE']).optional(),
});
```

- [ ] **Step 3: Commit**

```bash
git add src/features/payments/validators/index.ts
git commit -m "feat(payments): add validators for missing routes"
```

---

### Task 2: Extend Payment Service (Admin & Stats)

**Files:**

- Modify: `src/features/payments/services/payment.service.ts`

- [ ] **Step 1: Implement getAllTransactions**

```typescript
export async function getAllTransactions(associationId: string, filters: any) {
  const { page, pageSize, userId, status, method, gateway, search, startDate, endDate } = filters;
  const skip = (page - 1) * pageSize;

  const where: any = { associationId };
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (method) where.method = method;
  if (gateway) where.gateway = gateway;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, membershipNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

- [ ] **Step 2: Implement getTransactionById**

```typescript
export async function getTransactionById(id: string, associationId: string) {
  return prisma.paymentTransaction.findFirst({
    where: { id, associationId },
    include: {
      user: { select: { name: true, email: true, membershipNumber: true } },
      allocations: { include: { contributionPeriod: true } },
      ledgerEntries: { include: { lines: true } },
    },
  });
}
```

- [ ] **Step 3: Implement getFinancialStats**

```typescript
export async function getFinancialStats(associationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthTotal, dues] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: {
        associationId,
        status: 'COMPLETED',
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.contributionPeriod.aggregate({
      where: { associationId, status: { in: ['DUE', 'PARTIAL', 'OVERDUE'] } },
      _sum: { dueAmount: true },
      _count: { userId: true },
    }),
  ]);

  return {
    totalCollectedMonth: Number(monthTotal._sum.amount || 0),
    pendingDuesAmount: Number(dues._sum.dueAmount || 0),
    pendingDuesCount: dues._count.userId,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/payments/services/payment.service.ts
git commit -m "feat(payments): extend payment service for admin list and stats"
```

---

### Task 3: Implement Admin List Route

**Files:**

- Create: `src/app/api/payments/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { GetTransactionsQuerySchema } from '@feature/payments/validators';
import { getAllTransactions } from '@feature/payments/services/payment.service';

export const GET = withAssociation(
  { query: GetTransactionsQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);
    const result = await getAllTransactions(association.id, query);
    return SuccessResponse({
      data: result.transactions,
      meta: result.pagination,
    });
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/payments/route.ts
git commit -m "feat(payments): implement admin list payments route"
```

---

### Task 4: Implement Transaction Detail & Receipt Route

**Files:**

- Create: `src/app/api/payments/[id]/route.ts`
- Create: `src/app/api/payments/[id]/receipt/route.ts`

- [ ] **Step 1: Create transaction detail route**

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse, NotFoundResponse, ForbiddenResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { getTransactionById } from '@feature/payments/services/payment.service';

export const GET = withAssociation(async (association, _, request, { params }) => {
  const user = await withRole(request, UserRole.MEMBER);
  const transaction = await getTransactionById(params.id, association.id);

  if (!transaction) return NotFoundResponse('Transaction not found');

  // Check ownership if not admin/finance
  const isFinance = user.role.some((r) =>
    [UserRole.FINANCE, UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN].includes(r),
  );
  if (!isFinance && transaction.userId !== user.id) return ForbiddenResponse();

  return SuccessResponse({ data: transaction });
});
```

- [ ] **Step 2: Create receipt data route**

```typescript
// File: src/app/api/payments/[id]/receipt/route.ts
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse, NotFoundResponse, ForbiddenResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { getTransactionById } from '@feature/payments/services/payment.service';

export const GET = withAssociation(async (association, _, request, { params }) => {
  const user = await withRole(request, UserRole.MEMBER);
  const transaction = await getTransactionById(params.id, association.id);

  if (!transaction) return NotFoundResponse('Transaction not found');
  const isFinance = user.role.some((r) =>
    [UserRole.FINANCE, UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN].includes(r),
  );
  if (!isFinance && transaction.userId !== user.id) return ForbiddenResponse();

  const receiptData = {
    receiptNumber: transaction.receiptNumber || transaction.id,
    paidAt: transaction.paidAt,
    memberInfo: {
      name: transaction.user.name,
      membershipNumber: transaction.user.membershipNumber,
    },
    associationInfo: { name: association.name },
    amount: transaction.amount,
    method: transaction.method,
    appliedTo: transaction.allocations.map((a) => ({
      year: a.contributionPeriod.year,
      month: a.contributionPeriod.month,
      amount: a.allocatedAmount,
    })),
  };

  return SuccessResponse({ data: receiptData });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/payments/[id]/route.ts src/app/api/payments/[id]/receipt/route.ts
git commit -m "feat(payments): implement transaction detail and receipt routes"
```

---

### Task 5: Implement Stats & Report Route

**Files:**

- Create: `src/app/api/payments/stats/route.ts`
- Create: `src/app/api/payments/reports/collections/route.ts`

- [ ] **Step 1: Create stats route**

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { getFinancialStats } from '@feature/payments/services/payment.service';

export const GET = withAssociation(async (association, _, request) => {
  await withRole(request, UserRole.FINANCE);
  const stats = await getFinancialStats(association.id);
  return SuccessResponse({ data: stats });
});
```

- [ ] **Step 2: Create collection report route**

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { CollectionReportQuerySchema } from '@feature/payments/validators';
import { prisma } from '@src/shared/lib/prisma';

export const GET = withAssociation(
  { query: CollectionReportQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);

    const records = await prisma.contributionPeriod.findMany({
      where: {
        associationId: association.id,
        year: query.year,
        month: query.month,
        status: query.status,
      },
      include: {
        user: { select: { name: true, membershipNumber: true } },
        allocations: { include: { paymentTransaction: true } },
      },
    });

    return SuccessResponse({ data: records });
  },
);
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/payments/stats/route.ts src/app/api/payments/reports/collections/route.ts
git commit -m "feat(payments): implement stats and collection report routes"
```
