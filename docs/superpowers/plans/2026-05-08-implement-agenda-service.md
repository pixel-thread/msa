# Implement Agenda Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `processAgendaOperations` service to handle granular updates to meeting agenda items within a database transaction.

**Architecture:** A service function that takes `meetingId`, `associationId`, and an array of `operations`. It verifies the meeting exists and then uses a Prisma transaction to execute `CREATE`, `UPDATE`, `DELETE`, and `REORDER` operations.

**Tech Stack:** Next.js, Prisma, Zod, TypeScript, tsx (for manual testing).

---

### Task 1: Create Implementation File

**Files:**

- Create: `src/features/meetings/services/processAgendaOperations.ts`

- [ ] **Step 1: Write initial service with just validation**

```typescript
// src/features/meetings/services/processAgendaOperations.ts
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';
import { AgendaOperationInput } from '../validators/agenda-items';

interface ProcessAgendaOperationsProps {
  meetingId: string;
  associationId: string;
  operations: AgendaOperationInput['operations'];
}

export async function processAgendaOperations({
  meetingId,
  associationId,
  operations,
}: ProcessAgendaOperationsProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) throw new NotFoundError('Meeting');

  // Implementation for operations will be added in steps
  return [];
}
```

- [ ] **Step 2: Create a manual reproduction script to verify meeting existence check**

```typescript
// scripts/verify-agenda-ops.ts
import { processAgendaOperations } from '../src/features/meetings/services/processAgendaOperations';

async function main() {
  try {
    await processAgendaOperations({
      meetingId: 'non-existent-id',
      associationId: 'any-association',
      operations: [],
    });
    console.log('FAIL: Should have thrown NotFoundError');
  } catch (error: any) {
    if (error.name === 'NotFoundError' || error.code === 'NOT_FOUND') {
      console.log('PASS: Threw correct error');
    } else {
      console.log('FAIL: Threw unexpected error', error);
    }
  }
}

main();
```

- [ ] **Step 3: Run the verification script**

Run: `npx tsx scripts/verify-agenda-ops.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/meetings/services/processAgendaOperations.ts
git commit -m "feat: initial agenda operations service with validation"
```

### Task 2: Implement Operations in Transaction

**Files:**

- Modify: `src/features/meetings/services/processAgendaOperations.ts`

- [ ] **Step 1: Implement the transaction with all operations**

```typescript
// src/features/meetings/services/processAgendaOperations.ts
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';
import { AgendaOperationInput } from '../validators/agenda-items';

interface ProcessAgendaOperationsProps {
  meetingId: string;
  associationId: string;
  operations: AgendaOperationInput['operations'];
}

export async function processAgendaOperations({
  meetingId,
  associationId,
  operations,
}: ProcessAgendaOperationsProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) throw new NotFoundError('Meeting');

  return await prisma.$transaction(async (tx) => {
    for (const op of operations) {
      switch (op.type) {
        case 'CREATE':
          await tx.agendaItem.create({
            data: {
              ...op.data,
              meetingId,
            },
          });
          break;
        case 'UPDATE':
          await tx.agendaItem.update({
            where: { id: op.id, meetingId },
            data: op.data,
          });
          break;
        case 'DELETE':
          await tx.agendaItem.delete({
            where: { id: op.id, meetingId },
          });
          break;
        case 'REORDER':
          for (const mapping of op.mappings) {
            await tx.agendaItem.update({
              where: { id: mapping.id, meetingId },
              data: { order: mapping.order },
            });
          }
          break;
      }
    }
    return await tx.agendaItem.findMany({
      where: { meetingId },
      orderBy: { order: 'asc' },
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/meetings/services/processAgendaOperations.ts
git commit -m "feat: implement agenda operations in transaction"
```

### Task 3: Register Service

**Files:**

- Modify: `src/features/meetings/services/index.ts`

- [ ] **Step 1: Export the new service**

```typescript
// src/features/meetings/services/index.ts
export * from './processAgendaOperations';
// ... other exports
```

- [ ] **Step 2: Commit**

```bash
git add src/features/meetings/services/index.ts
git commit -m "feat: export processAgendaOperations service"
```
