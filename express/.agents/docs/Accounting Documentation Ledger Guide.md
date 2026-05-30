# MFSA Accounting System — Full Developer Documentation

> **Audience:** Backend developers building on this system.
> **Goal:** Understand every accounting concept, know exactly when to create a ledger entry, and see working code examples.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [The Four Layers You Must Never Confuse](#2-the-four-layers-you-must-never-confuse)
3. [Double-Entry Bookkeeping — The Foundation](#3-double-entry-bookkeeping--the-foundation)
4. [Chart of Accounts (COA)](#4-chart-of-accounts-coa)
5. [Your Database Models Explained](#5-your-database-models-explained)
6. [When to Create a Ledger Entry](#6-when-to-create-a-ledger-entry)
7. [Complete Scenarios with Code](#7-complete-scenarios-with-code)
8. [The Accounting Service — Minimal Implementation](#8-the-accounting-service--minimal-implementation)
9. [Data Integrity Rules](#9-data-integrity-rules)
10. [Reports and What They Read From](#10-reports-and-what-they-read-from)
11. [Common Mistakes to Avoid](#11-common-mistakes-to-avoid)
12. [Quick Reference Cheat Sheet](#12-quick-reference-cheat-sheet)

---

## 1. The Big Picture

Your MFSA system is a **multi-tenant membership billing + payment + accounting platform**. Each `Association` is one tenant. All financial records belong to an association and are completely isolated from other associations.

The system does three distinct jobs:

| Job | What it answers |
|-----|----------------|
| **Membership Billing** | Who owes what, and when? |
| **Payment Processing** | Did we receive money, how, and from whom? |
| **Accounting** | What is our financial position? Is our bookkeeping balanced? |

These jobs are **separate concerns** with separate tables. This document explains how they connect.

---

## 2. The Four Layers You Must Never Confuse

This is the most important concept. Read it carefully.

```
Layer 1: ContributionPeriod  ← "What the member OWES"
Layer 2: PaymentTransaction  ← "Money we RECEIVED"
Layer 3: PaymentAllocation   ← "Which debt the payment SETTLED"
Layer 4: LedgerEntry         ← "What this means FINANCIALLY"
```

### Real-life analogy

Imagine a gym:

- **ContributionPeriod** = The monthly invoice the gym sends you (₹1,000 for June)
- **PaymentTransaction** = The UPI payment you made (₹1,000 transferred)
- **PaymentAllocation** = The gym saying "your June invoice is now paid"
- **LedgerEntry** = The accountant recording: "Bank +₹1,000, Income +₹1,000"

These are **four separate records**. Do not skip any of them.

---

## 3. Double-Entry Bookkeeping — The Foundation

Every financial event creates **exactly two effects**: one account goes up, another goes down.

### The Golden Rule

```
Total Debits = Total Credits (ALWAYS)
```

### Debit vs Credit — Plain English

| Account Type | Debit Effect | Credit Effect |
|-------------|-------------|--------------|
| ASSET | Increases ↑ | Decreases ↓ |
| LIABILITY | Decreases ↓ | Increases ↑ |
| INCOME | Decreases ↓ | Increases ↑ |
| EXPENSE | Increases ↑ | Decreases ↓ |
| EQUITY | Decreases ↓ | Increases ↑ |

### Simplest Example

A member pays ₹500 online.

```
DR  Bank Account (ASSET)        ₹500   ← we received cash, asset increases
CR  Subscription Income (INCOME) ₹500   ← we earned revenue, income increases
```

In your `LedgerLine` table this becomes two rows:

```
Row 1: accountId = "bank-account-id",   isDebit = true,  amount = 500
Row 2: accountId = "sub-income-id",     isDebit = false, amount = 500
```

---

## 4. Chart of Accounts (COA)

The Chart of Accounts is the master list of every financial bucket in your system. Everything flows through accounts.

### Recommended Starting COA for MFSA

| Code | Name | Type | Purpose |
|------|------|------|---------|
| 1000 | Bank Account | ASSET | Cash in the bank |
| 1100 | Accounts Receivable | ASSET | Dues owed but not yet paid |
| 1200 | Cash on Hand | ASSET | Physical cash |
| 2000 | Unearned Revenue | LIABILITY | Advance payments received |
| 2100 | Member Deposits | LIABILITY | Deposits held for members |
| 3000 | Retained Earnings | EQUITY | Accumulated surplus |
| 4000 | Subscription Income | INCOME | Monthly membership dues |
| 4100 | Event Fee Income | INCOME | Revenue from events |
| 4200 | Donation Income | INCOME | Donations received |
| 4300 | Bank Interest | INCOME | Interest earned |
| 5000 | Office Expense | EXPENSE | General office costs |
| 5100 | Waiver Expense | EXPENSE | Dues waived for members |
| 5200 | Refund Expense | EXPENSE | Refunds issued |

### How to Seed COA in Code

```typescript
// Run once per new Association
async function seedChartOfAccounts(associationId: string) {
  const accounts = [
    { code: '1000', name: 'Bank Account',        type: 'ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '1200', name: 'Cash on Hand',        type: 'ASSET' },
    { code: '2000', name: 'Unearned Revenue',    type: 'LIABILITY' },
    { code: '3000', name: 'Retained Earnings',   type: 'EQUITY' },
    { code: '4000', name: 'Subscription Income', type: 'INCOME' },
    { code: '4100', name: 'Event Fee Income',    type: 'INCOME' },
    { code: '4200', name: 'Donation Income',     type: 'INCOME' },
    { code: '4300', name: 'Bank Interest',       type: 'INCOME' },
    { code: '5000', name: 'Office Expense',      type: 'EXPENSE' },
    { code: '5100', name: 'Waiver Expense',      type: 'EXPENSE' },
  ];

  await prisma.account.createMany({
    data: accounts.map(a => ({ ...a, associationId })),
    skipDuplicates: true,
  });
}
```

---

## 5. Your Database Models Explained

### Model: Account

Stores the Chart of Accounts for each association.

```prisma
model Account {
  id            String
  associationId String        // Tenant isolation
  code          String        // "1000", "4000" etc.
  name          String        // "Bank Account"
  type          String        // "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"
  isActive      Boolean
}
```

**Important:** Each `Account` belongs to ONE association. Two associations can both have a "Bank Account" but they are different records.

---

### Model: ContributionPeriod

Tracks what a member owes for a specific month. Created by a scheduled job (cron), NOT manually.

```prisma
model ContributionPeriod {
  userId         String           // Which member
  year           Int              // 2026
  month          Int              // 6 (June)
  expectedAmount Decimal          // 500.00 (from subscription plan)
  paidAmount     Decimal          // How much has been paid so far
  dueAmount      Decimal          // expectedAmount - paidAmount
  status         ContributionStatus  // DUE | PARTIAL | PAID | WAIVED | OVERDUE
  dueDate        DateTime
}
```

**Key point:** A `ContributionPeriod` with `status = DUE` does NOT have a ledger entry yet (cash-basis system). The entry is only created when money is actually received.

---

### Model: PaymentTransaction

Represents money that actually moved.

```prisma
model PaymentTransaction {
  associationId String
  userId        String
  amount        Decimal
  gateway       PaymentGateway   // RAZORPAY | MANUAL
  status        PaymentStatus    // PENDING | COMPLETED | FAILED | REFUNDED | WAIVED
  method        PaymentMethod?   // CASH | BANK_TRANSFER | UPI | CHEQUE | ONLINE
  razorpayOrderId   String?      // For online payments
  razorpayPaymentId String?      // Confirmed by Razorpay
  paidAt        DateTime?        // Set when COMPLETED
}
```

**Key point:** A `PaymentTransaction` with `status = PENDING` does NOT have a ledger entry yet. Only create a ledger entry after `status = COMPLETED`.

---

### Model: PaymentAllocation

The bridge between payments and dues. Answers: "which month's dues did this payment cover?"

```prisma
model PaymentAllocation {
  paymentTransactionId String       // The payment
  contributionPeriodId String       // The dues period it paid
  allocatedAmount      Decimal      // How much of the payment went to this period
}
```

**Why it exists:** One payment can partially or fully cover one or many `ContributionPeriod` records. Without this table, you cannot know which months are still outstanding.

---

### Model: LedgerEntry

The accounting journal header. One per financial event.

```prisma
model LedgerEntry {
  paymentTransactionId String?      // Link to payment (null for manual entries)
  description          String       // "Member payment - June 2026"
  approvalStatus       ApprovalStatus // PENDING | APPROVED | REJECTED
  createdById          String       // Who created it
  approvedById         String?      // Who approved it (required for manual entries)
  lines                LedgerLine[] // The debit/credit rows
}
```

---

### Model: LedgerLine

The actual debit/credit rows. Always come in pairs (or more) that balance.

```prisma
model LedgerLine {
  ledgerEntryId String
  accountId     String       // References Account
  isDebit       Boolean      // true = debit, false = credit
  amount        Decimal      // Always positive
}
```

**Rule:** For every `LedgerEntry`, the sum of all `LedgerLine` amounts where `isDebit = true` MUST equal the sum where `isDebit = false`.

---

## 6. When to Create a Ledger Entry

This section answers the single most important implementation question.

### Decision Table

| Event | Create Ledger Entry? | When? |
|-------|---------------------|-------|
| `ContributionPeriod` generated (cron) | ❌ No | — |
| `PaymentTransaction` created (PENDING) | ❌ No | — |
| `PaymentTransaction` → COMPLETED | ✅ Yes | Immediately after status update |
| `PaymentTransaction` → FAILED | ❌ No | — |
| `PaymentTransaction` → REFUNDED | ✅ Yes | Reversal entry |
| `ContributionPeriod` → WAIVED | ✅ Yes | Optional but recommended |
| Manual expense recorded by FINANCE officer | ✅ Yes | Created in PENDING status |
| Manual income recorded | ✅ Yes | Created in PENDING status |

### The Simple Rule

```
A LedgerEntry is created when MONEY MOVES or a FINANCIAL OBLIGATION IS FORGIVEN.
Never create one just because a debt is recorded or a payment is pending.
```

---

## 7. Complete Scenarios with Code

### Scenario A — Online Payment (Full)

**Real life:** Member Ravi owes ₹500 for June 2026. He pays online via Razorpay.

**Step 1: ContributionPeriod already exists (created by cron)**

```json
{
  "userId": "ravi-id",
  "year": 2026,
  "month": 6,
  "expectedAmount": 500,
  "paidAmount": 0,
  "dueAmount": 500,
  "status": "DUE"
}
```

**Step 2: Member pays → PaymentTransaction created**

```json
{
  "userId": "ravi-id",
  "amount": 500,
  "gateway": "RAZORPAY",
  "status": "PENDING",
  "razorpayOrderId": "order_ABC123"
}
```

No ledger entry yet.

**Step 3: Razorpay webhook fires → payment verified**

```typescript
async function handlePaymentCompleted(paymentTransactionId: string) {
  await prisma.$transaction(async (tx) => {

    // 1. Update payment status
    await tx.paymentTransaction.update({
      where: { id: paymentTransactionId },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: 'pay_XYZ789',
        paidAt: new Date(),
      }
    });

    // 2. Allocate payment to oldest due ContributionPeriod (FIFO)
    const duePeriods = await tx.contributionPeriod.findMany({
      where: { userId: 'ravi-id', status: { in: ['DUE', 'PARTIAL', 'OVERDUE'] } },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    let remaining = 500;
    for (const period of duePeriods) {
      if (remaining <= 0) break;
      const allocate = Math.min(remaining, Number(period.dueAmount));

      await tx.paymentAllocation.create({
        data: {
          paymentTransactionId,
          contributionPeriodId: period.id,
          allocatedAmount: allocate,
        }
      });

      const newPaid = Number(period.paidAmount) + allocate;
      const newDue  = Number(period.expectedAmount) - newPaid;
      await tx.contributionPeriod.update({
        where: { id: period.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newDue <= 0 ? 'PAID' : 'PARTIAL',
        }
      });

      remaining -= allocate;
    }

    // 3. Create Ledger Entry
    const bankAccount = await tx.account.findFirst({
      where: { associationId: 'assoc-id', code: '1000' }
    });
    const incomeAccount = await tx.account.findFirst({
      where: { associationId: 'assoc-id', code: '4000' }
    });

    await tx.ledgerEntry.create({
      data: {
        paymentTransactionId,
        description: 'Member payment - Ravi - June 2026',
        approvalStatus: 'APPROVED', // Auto-approved for gateway payments
        createdById: 'system',
        lines: {
          create: [
            { accountId: bankAccount.id, isDebit: true,  amount: 500 },
            { accountId: incomeAccount.id, isDebit: false, amount: 500 },
          ]
        }
      }
    });
  });
}
```

**Final state:**

| Table | Record | Status |
|-------|--------|--------|
| ContributionPeriod | June 2026 | PAID |
| PaymentTransaction | ₹500 | COMPLETED |
| PaymentAllocation | June ← ₹500 | Created |
| LedgerEntry | DR Bank ₹500, CR Income ₹500 | APPROVED |

---

### Scenario B — Partial Payment

**Real life:** Ravi owes January (₹500) + February (₹500) = ₹1,000 total. He pays only ₹700.

**FIFO Allocation:**

```typescript
// remaining = 700

// Period 1: January — dueAmount = 500
// allocate = min(700, 500) = 500 → January becomes PAID
// remaining = 700 - 500 = 200

// Period 2: February — dueAmount = 500
// allocate = min(200, 500) = 200 → February becomes PARTIAL (dueAmount = 300)
// remaining = 0
```

**Resulting allocations:**

```json
[
  { "contributionPeriodId": "jan-id", "allocatedAmount": 500 },
  { "contributionPeriodId": "feb-id", "allocatedAmount": 200 }
]
```

**Ledger Entry — one entry for the full ₹700:**

```
DR Bank Account (1000)      700
CR Subscription Income (4000)    700
```

---

### Scenario C — Refund

**Real life:** Ravi's ₹500 payment needs to be refunded (e.g., wrong account charged).

**Step 1: Update PaymentTransaction status to REFUNDED**

**Step 2: Reverse the PaymentAllocation** — update ContributionPeriod back to DUE

**Step 3: Create a REVERSAL LedgerEntry (NEVER delete the original)**

```typescript
await prisma.ledgerEntry.create({
  data: {
    paymentTransactionId,
    description: 'REFUND - Reversal of June 2026 payment for Ravi',
    approvalStatus: 'APPROVED',
    createdById: 'system',
    lines: {
      create: [
        // Reverse the original: swap debit/credit
        { accountId: incomeAccount.id, isDebit: true,  amount: 500 }, // DR Income
        { accountId: bankAccount.id,   isDebit: false, amount: 500 }, // CR Bank
      ]
    }
  }
});
```

**Why this way?** Accounting is immutable. The original entry stays. The reversal entry cancels it out. Auditors can see both. The net effect is zero.

---

### Scenario D — Manual Expense (Office Purchase)

**Real life:** Finance officer records ₹10,000 paid for office printer.

This is NOT connected to a PaymentTransaction (which is for member payments).

```typescript
await prisma.ledgerEntry.create({
  data: {
    paymentTransactionId: null,  // No member payment linked
    description: 'Office printer purchase - May 2026',
    approvalStatus: 'PENDING',   // Requires PRESIDENT approval
    createdById: financeUserId,
    lines: {
      create: [
        { accountId: equipmentAccount.id, isDebit: true,  amount: 10000 }, // DR Expense
        { accountId: bankAccount.id,      isDebit: false, amount: 10000 }, // CR Bank
      ]
    }
  }
});
```

**After PRESIDENT approves:**

```typescript
await prisma.ledgerEntry.update({
  where: { id: entryId },
  data: {
    approvalStatus: 'APPROVED',
    approvedById: presidentUserId,
  }
});
```

---

### Scenario E — Dues Waiver

**Real life:** President waives June dues for member Ravi (hardship case).

```typescript
// Update ContributionPeriod
await prisma.contributionPeriod.update({
  where: { id: junePeriodId },
  data: {
    status: 'WAIVED',
    waivedAt: new Date(),
    waivedReason: 'Hardship - approved by President',
  }
});

// Create Ledger Entry (optional but recommended for clean accounting)
await prisma.ledgerEntry.create({
  data: {
    description: 'Dues waiver - Ravi - June 2026',
    approvalStatus: 'APPROVED',
    createdById: presidentUserId,
    approvedById: presidentUserId,
    lines: {
      create: [
        { accountId: waiverExpenseAccount.id,    isDebit: true,  amount: 500 }, // DR Waiver Expense
        { accountId: accountsReceivableAccount.id, isDebit: false, amount: 500 }, // CR A/R
      ]
    }
  }
});
```

---

### Scenario F — Advance Payment

**Real life:** Ravi pays ₹1,500 but only ₹500 is due for June.

**Option 1 (Recommended): Allocate future months**

Automatically create `ContributionPeriod` records for July and August, then allocate ₹500 to each.

**Option 2: Record as Unearned Revenue (Liability)**

```
DR Bank Account (1000)       1500
CR Subscription Income (4000)      500   (for June — earned)
CR Unearned Revenue (2000)        1000   (for future months — not yet earned)
```

When future months arrive, convert unearned revenue to income:

```
DR Unearned Revenue (2000)    500
CR Subscription Income (4000)      500
```

---

## 8. The Accounting Service — Minimal Implementation

Here is a clean service you can drop into your codebase to start with.

```typescript
// src/services/accounting.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalLine {
  accountCode: string;
  isDebit: boolean;
  amount: number;
}

interface CreateEntryOptions {
  associationId: string;
  paymentTransactionId?: string;
  description: string;
  createdById: string;
  autoApprove?: boolean;      // true for system events (gateway payments)
  approvedById?: string;
  lines: JournalLine[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAccountByCode(associationId: string, code: string) {
  const account = await prisma.account.findFirst({
    where: { associationId, code, isActive: true }
  });
  if (!account) throw new Error(`Account not found: ${code}`);
  return account;
}

function validateBalance(lines: { amount: number; isDebit: boolean }[]) {
  const totalDebits  = lines.filter(l => l.isDebit).reduce((s, l) => s + l.amount, 0);
  const totalCredits = lines.filter(l => !l.isDebit).reduce((s, l) => s + l.amount, 0);
  if (Math.abs(totalDebits - totalCredits) > 0.001) {
    throw new Error(
      `Unbalanced entry: debits=${totalDebits}, credits=${totalCredits}`
    );
  }
}

// ─── Core Function ────────────────────────────────────────────────────────────

export async function createLedgerEntry(options: CreateEntryOptions) {
  const {
    associationId,
    paymentTransactionId,
    description,
    createdById,
    autoApprove = false,
    approvedById,
    lines,
  } = options;

  // 1. Resolve account codes to IDs
  const resolvedLines = await Promise.all(
    lines.map(async (line) => {
      const account = await getAccountByCode(associationId, line.accountCode);
      return { accountId: account.id, isDebit: line.isDebit, amount: line.amount };
    })
  );

  // 2. Validate balance
  validateBalance(resolvedLines);

  // 3. Write to DB
  return prisma.ledgerEntry.create({
    data: {
      paymentTransactionId: paymentTransactionId ?? null,
      description,
      approvalStatus: autoApprove ? 'APPROVED' : 'PENDING',
      createdById,
      approvedById: autoApprove ? (approvedById ?? 'system') : null,
      lines: {
        create: resolvedLines,
      }
    },
    include: { lines: true }
  });
}

// ─── Pre-built Journal Entries ────────────────────────────────────────────────

export async function recordMemberPayment({
  associationId,
  paymentTransactionId,
  amount,
  memberId,
  period,
  createdById,
}: {
  associationId: string;
  paymentTransactionId: string;
  amount: number;
  memberId: string;
  period: string;   // e.g. "June 2026"
  createdById: string;
}) {
  return createLedgerEntry({
    associationId,
    paymentTransactionId,
    description: `Member payment - ${memberId} - ${period}`,
    createdById,
    autoApprove: true,
    lines: [
      { accountCode: '1000', isDebit: true,  amount },   // DR Bank
      { accountCode: '4000', isDebit: false, amount },   // CR Subscription Income
    ]
  });
}

export async function recordRefund({
  associationId,
  paymentTransactionId,
  amount,
  description,
  createdById,
}: {
  associationId: string;
  paymentTransactionId: string;
  amount: number;
  description: string;
  createdById: string;
}) {
  return createLedgerEntry({
    associationId,
    paymentTransactionId,
    description: `REFUND - ${description}`,
    createdById,
    autoApprove: true,
    lines: [
      { accountCode: '4000', isDebit: true,  amount },   // DR Income (reverse)
      { accountCode: '1000', isDebit: false, amount },   // CR Bank (reverse)
    ]
  });
}

export async function recordExpense({
  associationId,
  amount,
  description,
  expenseAccountCode,
  createdById,
}: {
  associationId: string;
  amount: number;
  description: string;
  expenseAccountCode: string;  // e.g. '5000'
  createdById: string;
}) {
  // Manual expenses start as PENDING (require approval)
  return createLedgerEntry({
    associationId,
    description,
    createdById,
    autoApprove: false,
    lines: [
      { accountCode: expenseAccountCode, isDebit: true,  amount }, // DR Expense
      { accountCode: '1000',             isDebit: false, amount }, // CR Bank
    ]
  });
}

export async function recordWaiver({
  associationId,
  amount,
  memberId,
  period,
  approvedById,
}: {
  associationId: string;
  amount: number;
  memberId: string;
  period: string;
  approvedById: string;
}) {
  return createLedgerEntry({
    associationId,
    description: `Dues waiver - ${memberId} - ${period}`,
    createdById: approvedById,
    autoApprove: true,
    approvedById,
    lines: [
      { accountCode: '5100', isDebit: true,  amount },  // DR Waiver Expense
      { accountCode: '1100', isDebit: false, amount },  // CR Accounts Receivable
    ]
  });
}
```

---

## 9. Data Integrity Rules

These are non-negotiable. Enforce them in your service layer.

### Rule 1 — Debits must equal credits

```typescript
// Always validate before inserting
const debits  = lines.filter(l => l.isDebit).reduce((s, l) => s + l.amount, 0);
const credits = lines.filter(l => !l.isDebit).reduce((s, l) => s + l.amount, 0);
if (debits !== credits) throw new Error('Unbalanced journal entry');
```

### Rule 2 — Approved entries are immutable

```typescript
// Before any update to a LedgerEntry:
const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
if (entry.approvalStatus === 'APPROVED') {
  throw new Error('Cannot modify an approved ledger entry. Create a reversal instead.');
}
```

### Rule 3 — Never delete ledger records

Set your database foreign key constraints to `RESTRICT` on ledger tables. In Prisma, never call `prisma.ledgerEntry.delete()` from application code. If a mistake was made, create a reversal entry.

### Rule 4 — Association isolation

Every query on accounting tables must include `associationId` in the WHERE clause. Never query ledger data without scoping by tenant.

```typescript
// WRONG
await prisma.ledgerEntry.findMany({ ... });

// CORRECT — always scope by association
await prisma.account.findMany({
  where: { associationId, ... }
});
```

### Rule 5 — Idempotent webhook handling

Razorpay may send the same webhook multiple times. Always check before creating a ledger entry:

```typescript
const existing = await prisma.ledgerEntry.findFirst({
  where: { paymentTransactionId }
});
if (existing) return; // Already processed, skip
```

---

## 10. Reports and What They Read From

**Critical:** Financial reports must read from `LedgerLine` + `Account`, NOT from `PaymentTransaction` directly. The ledger is the source of truth.

### Trial Balance

```typescript
// Verifies total debits = total credits for all APPROVED entries
async function trialBalance(associationId: string) {
  const lines = await prisma.ledgerLine.findMany({
    where: {
      ledgerEntry: {
        approvalStatus: 'APPROVED',
        paymentTransaction: { associationId }
      }
    },
    include: { ledgerEntry: true, account: true }
    // Note: scope to associationId via account or paymentTransaction
  });

  const result = {};
  for (const line of lines) {
    const key = line.accountId;
    if (!result[key]) result[key] = { account: line.account.name, debit: 0, credit: 0 };
    if (line.isDebit) result[key].debit  += Number(line.amount);
    else              result[key].credit += Number(line.amount);
  }
  return result;
}
```

### Income Statement

```sql
-- Net income = Total INCOME credits - Total INCOME debits
SELECT
  a.name,
  SUM(CASE WHEN ll.is_debit = false THEN ll.amount ELSE -ll.amount END) as net
FROM ledger_lines ll
JOIN accounts a ON ll.account_id = a.id
WHERE a.type = 'INCOME'
  AND a.association_id = $associationId
GROUP BY a.name;
```

### Member Aging Report

This comes from `ContributionPeriod`, NOT the ledger:

```typescript
async function agingReport(associationId: string) {
  const today = new Date();
  const overdue = await prisma.contributionPeriod.findMany({
    where: {
      associationId,
      status: { in: ['DUE', 'PARTIAL', 'OVERDUE'] },
      dueDate: { lt: today }
    },
    include: { user: { select: { name: true, membershipNumber: true } } },
    orderBy: { dueDate: 'asc' }
  });
  return overdue;
}
```

---

## 11. Common Mistakes to Avoid

### ❌ Creating a ledger entry for a PENDING payment

A pending payment means nothing has moved yet. Wait for COMPLETED.

### ❌ Deleting or updating an approved LedgerEntry

Always reverse. Write a new entry with debits and credits swapped.

### ❌ Calculating income from PaymentTransaction.amount

That table includes PENDING and FAILED payments. Use the ledger.

### ❌ Forgetting to allocate payment to ContributionPeriod

Without `PaymentAllocation`, the system cannot know which months are paid. Always run allocation immediately after a payment completes.

### ❌ Not validating balance before insert

Always validate `sum(debits) === sum(credits)` before writing to the database. A single unbalanced entry corrupts your trial balance.

### ❌ Running multiple queries instead of a transaction

Payment completion involves: updating PaymentTransaction + creating PaymentAllocation + updating ContributionPeriod + creating LedgerEntry. These MUST be in one `prisma.$transaction()` call. If any step fails, all must roll back.

---

## 12. Quick Reference Cheat Sheet

### When does each model get created?

| Model | Created When |
|-------|-------------|
| `ContributionPeriod` | Monthly cron job, once per active subscription per member |
| `PaymentTransaction` (PENDING) | User initiates payment / Razorpay order created |
| `PaymentTransaction` (COMPLETED) | Webhook verified / manual payment confirmed |
| `PaymentAllocation` | Immediately after payment COMPLETED |
| `LedgerEntry` | Immediately after payment COMPLETED (or on approved manual entry) |

### Which accounts are used in each scenario?

| Scenario | Debit | Credit |
|----------|-------|--------|
| Member pays online | 1000 Bank | 4000 Subscription Income |
| Member pays cash | 1200 Cash | 4000 Subscription Income |
| Refund issued | 4000 Subscription Income | 1000 Bank |
| Expense paid | 5000+ Expense | 1000 Bank |
| Dues waived | 5100 Waiver Expense | 1100 Accounts Receivable |
| Advance payment (unearned) | 1000 Bank | 2000 Unearned Revenue |
| Converting advance to income | 2000 Unearned Revenue | 4000 Subscription Income |

### Status transitions

```
PaymentTransaction:
  PENDING → COMPLETED → (normal flow)
  PENDING → FAILED     → (no ledger entry)
  COMPLETED → REFUNDED  → (reversal ledger entry)

ContributionPeriod:
  DUE → PARTIAL → PAID    (via allocations)
  DUE → WAIVED            (via President action)
  DUE → OVERDUE           (via cron job after dueDate)

LedgerEntry:
  PENDING → APPROVED → (immutable)
  PENDING → REJECTED  → (cannot be modified further)
```

---

*Documentation version: 1.0 — Generated for MFSA Accounting System based on schema.prisma and architecture documentation.*
