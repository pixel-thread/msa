# Meeting Minutes API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the API routes for recording and updating meeting minutes (decisions and action items).

**Architecture:** Implement Next.js App Router API handlers using `withAssociation` for association context and `withRole` for role-based access control. Handlers will delegate logic to established meeting services.

**Tech Stack:** Next.js, Prisma, Zod, TypeScript.

---

### Task 1: Create Meeting Minutes Collection Route

**Files:**

- Create: `src/app/api/meetings/[meetingId]/minutes/route.ts`

- [ ] **Step 1: Implement the POST handler**

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { createMeetingMinute } from '@src/features/meetings/services/minutes';
import { CreateMeetingMinuteSchema } from '@src/features/meetings/validators/minutes';
import { z } from 'zod';

const ParamsSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
});

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);

    const minute = await createMeetingMinute({
      meetingId: params!.meetingId,
      associationId: association.id,
      data: body!,
    });

    return SuccessResponse({
      data: minute,
      message: 'Meeting minute recorded successfully',
    });
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/meetings/[meetingId]/minutes/route.ts
git commit -m "feat: add meeting minutes collection api route"
```

---

### Task 2: Create Meeting Minute Resource Route

**Files:**

- Create: `src/app/api/meetings/[meetingId]/minutes/[minutesId]/route.ts`

- [ ] **Step 1: Implement the PATCH handler**

```typescript
import { withAssociation } from '@src/shared/api/with-association';
import { withRole } from '@src/shared/api/with-role';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { updateMeetingMinute } from '@src/features/meetings/services/minutes';
import { UpdateMeetingMinuteSchema } from '@src/features/meetings/validators/minutes';
import { z } from 'zod';

const ParamsSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
  minutesId: z.string().uuid('Invalid minute ID'),
});

export const PATCH = withAssociation(
  { params: ParamsSchema, body: UpdateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);

    const minute = await updateMeetingMinute({
      meetingId: params!.meetingId,
      minuteId: params!.minutesId,
      associationId: association.id,
      data: body!,
    });

    return SuccessResponse({
      data: minute,
      message: 'Meeting minute updated successfully',
    });
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/meetings/[meetingId]/minutes/[minutesId]/route.ts
git commit -m "feat: add meeting minute resource api route"
```
