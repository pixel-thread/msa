# Meeting Agenda & Decisions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement granular API endpoints to manage meeting agendas (CREATE, UPDATE, DELETE, REORDER) and record meeting minutes/decisions.

**Architecture:** Dedicated endpoints for Agenda and Minutes. The Agenda endpoint uses a list of operations for granular control. Services handle the business logic and Prisma interactions.

**Tech Stack:** Next.js (App Router), Prisma, Zod, TypeScript.

---

### Task 1: Create Validation Schemas

**Files:**

- Modify: `src/features/meetings/validators/agenda-items.ts`
- Create: `src/features/meetings/validators/minutes.ts`

- [ ] **Step 1: Update AgendaItem validators**
      Add `UpdateAgendaItemSchema` and `AgendaOperationSchema`.

```typescript
// src/features/meetings/validators/agenda-items.ts
import { z } from 'zod';

export const CreateAgendaItemSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().max(1000).optional(),
});

export const UpdateAgendaItemSchema = CreateAgendaItemSchema.partial();

export const AgendaOperationSchema = z.object({
  operations: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('CREATE'), data: CreateAgendaItemSchema }),
      z.object({
        type: z.literal('UPDATE'),
        id: z.string().uuid(),
        data: UpdateAgendaItemSchema,
      }),
      z.object({ type: z.literal('DELETE'), id: z.string().uuid() }),
      z.object({
        type: z.literal('REORDER'),
        mappings: z.array(z.object({ id: z.string().uuid(), order: z.number().int() })),
      }),
    ]),
  ),
});
```

- [ ] **Step 2: Create MeetingMinutes validator**

```typescript
// src/features/meetings/validators/minutes.ts
import { z } from 'zod';

export const CreateMeetingMinuteSchema = z.object({
  agendaPoint: z.string().min(1, 'Agenda point is required'),
  decision: z.string().min(1, 'Decision is required'),
  actionItems: z
    .array(
      z.object({
        assigneeId: z.string().uuid().optional(),
        task: z.string().min(1),
        dueDate: z.string().datetime().optional(),
      }),
    )
    .optional(),
});

export const UpdateMeetingMinuteSchema = CreateMeetingMinuteSchema.partial();
```

- [ ] **Step 3: Commit**

```bash
git add src/features/meetings/validators/
git commit -m "feat: add agenda and minutes validators"
```

### Task 2: Implement Agenda Service

**Files:**

- Create: `src/features/meetings/services/processAgendaOperations.ts`

- [ ] **Step 1: Implement processAgendaOperations service**
      This service should execute all operations in a transaction.

```typescript
// src/features/meetings/services/processAgendaOperations.ts
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

interface ProcessAgendaOperationsProps {
  meetingId: string;
  associationId: string;
  operations: any[]; // Use the Zod type in implementation
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
      if (op.type === 'CREATE') {
        await tx.agendaItem.create({ data: { ...op.data, meetingId } });
      } else if (op.type === 'UPDATE') {
        await tx.agendaItem.update({
          where: { id: op.id, meetingId },
          data: op.data,
        });
      } else if (op.type === 'DELETE') {
        await tx.agendaItem.delete({ where: { id: op.id, meetingId } });
      } else if (op.type === 'REORDER') {
        for (const mapping of op.mappings) {
          await tx.agendaItem.update({
            where: { id: mapping.id, meetingId },
            data: { order: mapping.order },
          });
        }
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
git commit -m "feat: implement agenda operations service"
```

### Task 3: Implement Minutes Services

**Files:**

- Create: `src/features/meetings/services/minutes.ts`

- [ ] **Step 1: Implement meeting minutes services**

```typescript
// src/features/meetings/services/minutes.ts
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

export async function createMeetingMinute({ meetingId, associationId, data }: any) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });
  if (!meeting) throw new NotFoundError('Meeting');

  return await prisma.meetingMinutes.create({
    data: { ...data, meetingId },
  });
}

export async function updateMeetingMinute({ meetingId, minuteId, associationId, data }: any) {
  const minute = await prisma.meetingMinutes.findFirst({
    where: { id: minuteId, meetingId, meeting: { associationId } },
  });
  if (!minute) throw new NotFoundError('Meeting Minute');

  return await prisma.meetingMinutes.update({
    where: { id: minuteId },
    data,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/meetings/services/minutes.ts
git commit -m "feat: implement meeting minutes services"
```

### Task 4: Agenda API Route

**Files:**

- Create: `src/app/api/meetings/[meetingId]/agenda/route.ts`

- [ ] **Step 1: Create the Agenda API Route**

```typescript
// src/app/api/meetings/[meetingId]/agenda/route.ts
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { processAgendaOperations } from '@feature/meetings/services/processAgendaOperations';
import { AgendaOperationSchema } from '@feature/meetings/validators/agenda-items';
import { z } from 'zod';

const ParamsSchema = z.object({ meetingId: z.string().uuid() });

export const PATCH = withAssociation(
  { params: ParamsSchema, body: AgendaOperationSchema },
  async (association, { params, body }, request) => {
    await withRole(request, [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN]);

    const items = await processAgendaOperations({
      meetingId: params.meetingId,
      associationId: association.id,
      operations: body.operations,
    });

    return SuccessResponse({ data: items });
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/meetings/[meetingId]/agenda/route.ts
git commit -m "feat: add agenda operations api route"
```

### Task 5: Minutes API Routes

**Files:**

- Create: `src/app/api/meetings/[meetingId]/minutes/route.ts`
- Create: `src/app/api/meetings/[meetingId]/minutes/[minutesId]/route.ts`

- [ ] **Step 1: Create the Minutes POST route**

```typescript
// src/app/api/meetings/[meetingId]/minutes/route.ts
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { createMeetingMinute } from '@feature/meetings/services/minutes';
import { CreateMeetingMinuteSchema } from '@feature/meetings/validators/minutes';
import { z } from 'zod';

const ParamsSchema = z.object({ meetingId: z.string().uuid() });

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    await withRole(request, [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN]);

    const minute = await createMeetingMinute({
      meetingId: params.meetingId,
      associationId: association.id,
      data: body,
    });

    return SuccessResponse({ data: minute });
  },
);
```

- [ ] **Step 2: Create the Minutes PATCH route**

```typescript
// src/app/api/meetings/[meetingId]/minutes/[minutesId]/route.ts
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { updateMeetingMinute } from '@feature/meetings/services/minutes';
import { UpdateMeetingMinuteSchema } from '@feature/meetings/validators/minutes';
import { z } from 'zod';

const ParamsSchema = z.object({
  meetingId: z.string().uuid(),
  minutesId: z.string().uuid(),
});

export const PATCH = withAssociation(
  { params: ParamsSchema, body: UpdateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    await withRole(request, [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN]);

    const minute = await updateMeetingMinute({
      meetingId: params.meetingId,
      minuteId: params.minutesId,
      associationId: association.id,
      data: body,
    });

    return SuccessResponse({ data: minute });
  },
);
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/meetings/[meetingId]/minutes/
git commit -m "feat: add meeting minutes api routes"
```
