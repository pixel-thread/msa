# Subscription & Payment System PRD

## 1. Feature Overview

The Subscription & Payment module manages:

- member subscriptions
- plan management
- payment recording
- recurring billing
- receipts
- financial ledger
- waiver workflows
- audit trails
- reporting
- member collections
- finance approval flows

The system is:

- multi-association aware
- RBAC protected
- audit logged
- double-entry accounting compliant
- future mobile-ready

---

# 2. Core Business Goals

## Member Goals

- View active subscription
- Renew membership
- View payment history
- Download receipts
- Track pending dues

## Finance Goals

- Record cash/bank payments
- Approve ledger entries
- Generate reports
- Track collections
- Handle waivers

## Admin Goals

- Create plans
- Configure pricing
- Manage waivers
- View organization-wide financial health

---

# 3. System Architecture

```txt
Member
  ↓
Subscription
  ↓
Payment
  ↓
LedgerEntry
  ↓
LedgerLine (double-entry)
```

---

# 4. Roles & Permissions

| Feature               | Member | Finance | Secretary | President | Super Admin |
| --------------------- | ------ | ------- | --------- | --------- | ----------- |
| View own subscription | ✓      | ✓       | ✓         | ✓         | ✓           |
| Subscribe to plan     | ✓      | —       | —         | —         | ✓           |
| Record payment        | —      | ✓       | —         | —         | ✓           |
| Approve ledger        | —      | —       | —         | ✓         | ✓           |
| Create plan           | —      | —       | —         | —         | ✓           |
| Waive subscription    | —      | —       | ✓         | —         | ✓           |

---

# 5. Subscription Lifecycle

```txt
ACTIVE
 ├── expiry reached ──► EXPIRED
 ├── resignation ─────► CANCELLED
 ├── death ───────────► WAIVED
 └── pending payment ─► ACTIVE + Payment=PENDING
```

---

# 6. Prisma Models

## SubscriptionPlan

```prisma
model SubscriptionPlan {
  id            String   @id @default(cuid())
  associationId String

  name          String
  description   String?

  amount        Decimal @db.Decimal(10, 2)
  currency      String  @default("INR")

  billingCycle  String  @default("YEARLY")

  features      Json

  isActive      Boolean  @default(true)

  effectiveFrom DateTime @default(now())

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  subscriptions Subscription[]

  @@unique([associationId, name])
}
```

## Subscription

```prisma
model Subscription {
  id            String @id @default(cuid())

  userId        String @unique
  planId        String

  status        String @default("ACTIVE")

  startDate     DateTime @default(now())
  endDate       DateTime

  waivedAt      DateTime?
  waivedReason  String?
  waivedBy      String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User @relation(fields: [userId], references: [id])
  plan          SubscriptionPlan @relation(fields: [planId], references: [id])

  payments      Payment[]
}
```

## Payment

```prisma
model Payment {
  id               String @id @default(cuid())

  associationId    String

  userId           String
  subscriptionId   String?

  amount           Decimal @db.Decimal(10,2)

  currency         String @default("INR")

  type             PaymentType

  status           PaymentStatus @default(PENDING)

  receiptNumber    String?

  notes            String?

  paymentDate      DateTime @default(now())

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user             User @relation(fields: [userId], references: [id])

  subscription     Subscription?
  ledgerEntries    LedgerEntry[]
}
```

---

# 7. Enums

```prisma
enum PaymentType {
  CASH
  BANK_TRANSFER
  UPI
  CHEQUE
  ONLINE
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  CANCELLED
}
```

---

# 8. API Design

## Subscription APIs

### Get Plans

```http
GET /api/subscriptions/plans
```

### Subscribe

```http
POST /api/subscriptions/subscribe
```

### Subscribe Body

```json
{
  "planId": "plan_1"
}
```

---

# 9. Subscribe Route Example

```ts
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);

  const body = await req.json();

  const plan = await prisma.subscriptionPlan.findUnique({
    where: {
      id: body.planId,
    },
  });

  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  const existing = await prisma.subscription.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (existing) {
    throw new ConflictError("User already has subscription");
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: "ACTIVE",
      endDate: addYears(new Date(), 1),
    },
  });

  return success(subscription);
}
```

---

# 10. Payment Recording

```http
POST /api/payments/record
```

Roles:

- finance
- super_admin

---

# 11. Manual Payment Flow

```txt
Finance Officer
  ↓
Record Payment
  ↓
Create Payment Row
  ↓
Create LedgerEntry
  ↓
Create LedgerLines
  ↓
Approval Workflow
```

---

# 12. Double Entry Accounting

```txt
Debit: Bank Account
Credit: Subscription Income
```

---

# 13. Ledger Models

```prisma
model LedgerEntry {
  id             String @id @default(cuid())

  paymentId      String?

  description    String

  approvalStatus ApprovalStatus @default(PENDING)

  createdById    String

  approvedById   String?

  lines          LedgerLine[]
}
```

---

# 14. Ledger Entry Example

```ts
await prisma.ledgerEntry.create({
  data: {
    paymentId: payment.id,
    description: "Membership Fee",

    createdById: user.id,

    lines: {
      create: [
        {
          debitAccountId: bank.id,
          amount: payment.amount,
        },
        {
          creditAccountId: subscriptionIncome.id,
          amount: payment.amount,
        },
      ],
    },
  },
});
```

---

# 15. Approval Workflow

```txt
PENDING
  ↓
APPROVED
  ↓
POSTED
```

---

# 16. Receipt Generation

```http
GET /api/payments/[paymentId]/receipt
```

Receipt format:

```txt
MFSA-REC-2026-0001
```

---

# 17. Waiver Workflow

```http
POST /api/subscriptions/waive
```

### Body

```json
{
  "subscriptionId": "sub_1",
  "reason": "DEATH"
}
```

### Logic

```ts
await prisma.subscription.update({
  where: {
    id: subscriptionId,
  },

  data: {
    status: "WAIVED",
    waivedAt: new Date(),
    waivedReason: reason,
    waivedBy: user.id,
  },
});
```

---

# 18. Audit Logging

Every mutation creates audit logs for:

- Payment
- Subscription
- LedgerEntry

---

# 19. Frontend Architecture

```txt
(member)/
├── subscription/
│   ├── page.tsx
│   └── upgrade/
│
├── payments/
│   └── page.tsx
```

```txt
(finance)/
├── payments/
├── receipts/
├── ledger/
├── reports/
└── cashbook/
```

---

# 20. React Query Keys

```ts
export const subscriptionKeys = {
  all: ["subscriptions"],

  my: () => [...subscriptionKeys.all, "my"],

  plans: () => [...subscriptionKeys.all, "plans"],
};
```

---

# 21. Hooks

## useSubscription

```ts
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.my(),

    queryFn: async () => {
      return http.get("/subscriptions/my");
    },
  });
}
```

## useRecordPayment

```ts
export function useRecordPayment() {
  return useMutation({
    mutationFn: async (data: RecordPaymentDto) => {
      return http.post("/payments/record", data);
    },
  });
}
```

---

# 22. Financial Reports

Supported reports:

- Cashbook
- General Ledger
- Balance Sheet
- Income & Expenditure
- Member Collections

---

# 23. Multi-Association Rules

Every query MUST include:

```ts
associationId;
```

Scoping handled via:

- middleware
- Prisma middleware
- x-association-id

---

# 24. Security Requirements

Must enforce:

- RBAC
- association scoping
- audit logging
- immutable receipts
- immutable ledger history

---

# 25. Validation

```ts
export const RecordPaymentSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  type: z.enum(["CASH", "UPI", "BANK_TRANSFER"]),
});
```

---

# 26. Payment Failure Handling

```txt
FAILED PAYMENT
  ↓
retain subscription ACTIVE
  ↓
mark payment FAILED
  ↓
notify member
  ↓
allow retry
```

---

# 27. Recommended Future Features

## v2

- Razorpay integration
- Stripe integration
- Auto-renewal
- Installments
- Webhooks
- Refunds
- GST invoices
- QR payment
- Payment reminders
- WhatsApp receipts

---

# 28. Recommended Folder Architecture

```txt
src/features/payments/
├── api/
├── hooks/
├── schemas/
├── services/
├── components/
├── constants/
├── types/
└── utils/

src/features/subscriptions/
├── api/
├── hooks/
├── schemas/
├── services/
├── components/
├── constants/
├── types/
└── utils/
```

---

# 29. Final Engineering Principles

## DO

- use double-entry accounting
- immutable audit logs
- scoped queries
- transactional writes
- maker-checker approval
- future-dated plan changes

## DO NOT

- delete payments
- mutate ledger history
- bypass association scope
- hardcode role URLs
- mix business logic in route handlers
