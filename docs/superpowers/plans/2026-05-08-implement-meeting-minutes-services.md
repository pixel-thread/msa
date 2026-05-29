# Implement Meeting Minutes Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement services for creating and updating meeting minutes (decisions and action items) with validation for meeting and association ownership.

**Architecture:** Create a new service file `src/features/meetings/services/minutes.ts` that interacts with Prisma. Ensure association isolation by verifying that the meeting belongs to the provided `associationId`.

**Tech Stack:** TypeScript, Prisma, Zod (for validation types).

---

### Task 1: Initialize Service File and Export

**Files:**

- Create: `src/features/meetings/services/minutes.ts`
- Modify: `src/features/meetings/services/index.ts`

- [ ] **Step 1: Create the service file with stubs**

```typescript
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';
import { CreateMeetingMinuteInput, UpdateMeetingMinuteInput } from '../validators/minutes';

interface CreateMeetingMinuteProps {
  meetingId: string;
  associationId: string;
  data: CreateMeetingMinuteInput;
}

interface UpdateMeetingMinuteProps {
  meetingId: string;
  minuteId: string;
  associationId: string;
  data: UpdateMeetingMinuteInput;
}

export async function createMeetingMinute({
  meetingId,
  associationId,
  data,
}: CreateMeetingMinuteProps) {
  // Stub
}

export async function updateMeetingMinute({
  meetingId,
  minuteId,
  associationId,
  data,
}: UpdateMeetingMinuteProps) {
  // Stub
}
```

- [ ] **Step 2: Export from index.ts**

Modify `src/features/meetings/services/index.ts`:

```typescript
export * from './minutes';
```

- [ ] **Step 3: Commit**

```bash
git add src/features/meetings/services/minutes.ts src/features/meetings/services/index.ts
git commit -m "feat: initialize meeting minutes services"
```

### Task 2: Implement createMeetingMinute

**Files:**

- Modify: `src/features/meetings/services/minutes.ts`
- Create: `src/features/meetings/services/__tests__/minutes.test.ts`

- [ ] **Step 1: Write failing test for createMeetingMinute**

```typescript
import { createMeetingMinute } from '../minutes';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

describe('createMeetingMinute', () => {
  it('should throw NotFoundError if meeting does not exist or belongs to different association', async () => {
    await expect(
      createMeetingMinute({
        meetingId: 'non-existent',
        associationId: 'assoc-1',
        data: { agendaPoint: 'Test', decision: 'Test' },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/features/meetings/services/__tests__/minutes.test.ts`
Expected: FAIL (NotFoundError not thrown or function not implemented)

- [ ] **Step 3: Implement createMeetingMinute logic**

```typescript
export async function createMeetingMinute({
  meetingId,
  associationId,
  data,
}: CreateMeetingMinuteProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });
  if (!meeting) throw new NotFoundError('Meeting');

  return await prisma.meetingMinutes.create({
    data: {
      ...data,
      meetingId,
      actionItems: data.actionItems as any,
    },
  });
}
```

- [ ] **Step 4: Add success test case**

```typescript
it('should create meeting minute if meeting exists and belongs to association', async () => {
  // Mock prisma responses if possible or use real DB in test env
  // For now, assume integration test setup or just verify the calls
});
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npx vitest src/features/meetings/services/__tests__/minutes.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/features/meetings/services/minutes.ts src/features/meetings/services/__tests__/minutes.test.ts
git commit -m "feat: implement createMeetingMinute service"
```

### Task 3: Implement updateMeetingMinute

**Files:**

- Modify: `src/features/meetings/services/minutes.ts`
- Modify: `src/features/meetings/services/__tests__/minutes.test.ts`

- [ ] **Step 1: Write failing test for updateMeetingMinute**

```typescript
describe('updateMeetingMinute', () => {
  it('should throw NotFoundError if minute does not exist or association mismatch', async () => {
    await expect(
      updateMeetingMinute({
        meetingId: 'meeting-1',
        minuteId: 'non-existent',
        associationId: 'assoc-1',
        data: { decision: 'Updated' },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/features/meetings/services/__tests__/minutes.test.ts`

- [ ] **Step 3: Implement updateMeetingMinute logic**

```typescript
export async function updateMeetingMinute({
  meetingId,
  minuteId,
  associationId,
  data,
}: UpdateMeetingMinuteProps) {
  const minute = await prisma.meetingMinutes.findFirst({
    where: {
      id: minuteId,
      meetingId,
      meeting: { associationId },
    },
  });
  if (!minute) throw new NotFoundError('Meeting Minute');

  return await prisma.meetingMinutes.update({
    where: { id: minuteId },
    data: {
      ...data,
      actionItems: data.actionItems ? (data.actionItems as any) : undefined,
    },
  });
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npx vitest src/features/meetings/services/__tests__/minutes.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/features/meetings/services/minutes.ts src/features/meetings/services/__tests__/minutes.test.ts
git commit -m "feat: implement updateMeetingMinute service"
```
