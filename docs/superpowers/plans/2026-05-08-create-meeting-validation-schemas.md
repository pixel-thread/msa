# Create Meeting Validation Schemas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Zod validation schemas for granular meeting agenda operations and meeting minutes to ensure data integrity.

**Architecture:** Use Zod to define schemas that match Prisma models. `AgendaOperationSchema` uses a discriminated union for bulk updates (CREATE, UPDATE, DELETE, REORDER).

**Tech Stack:** TypeScript, Zod

---

### Task 1: Update Agenda Item Validators

**Files:**

- Modify: `src/features/meetings/validators/agenda-items.ts`

- [ ] **Step 1: Implement UpdateAgendaItemSchema and AgendaOperationSchema**

```typescript
import { z } from 'zod';

export const CreateAgendaItemSchema = z.object({
  order: z
    .number({ message: 'Order must be a number' })
    .int({ message: 'Order must be an integer' })
    .positive({ message: 'Order must be a positive number' }),
  title: z.string({ message: 'Title is required' }).min(1, 'Agenda item title is required'),
  description: z
    .string({ message: 'Description must be a string' })
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
});

export type CreateAgendaItemInput = z.infer<typeof CreateAgendaItemSchema>;

export const UpdateAgendaItemSchema = CreateAgendaItemSchema.partial();
export type UpdateAgendaItemInput = z.infer<typeof UpdateAgendaItemSchema>;

export const AgendaOperationSchema = z.object({
  operations: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('CREATE'),
        data: CreateAgendaItemSchema,
      }),
      z.object({
        type: z.literal('UPDATE'),
        id: z.string().uuid('Invalid ID format'),
        data: UpdateAgendaItemSchema,
      }),
      z.object({
        type: z.literal('DELETE'),
        id: z.string().uuid('Invalid ID format'),
      }),
      z.object({
        type: z.literal('REORDER'),
        mappings: z.array(
          z.object({
            id: z.string().uuid('Invalid ID format'),
            order: z.number().int().positive(),
          }),
        ),
      }),
    ]),
  ),
});

export type AgendaOperationInput = z.infer<typeof AgendaOperationSchema>;
```

- [ ] **Step 2: Verify with a script (Manual validation since no test runner specified yet)**

```typescript
// No changes to code, just verify types and schema logic mentally or via a small scratch file if needed.
```

### Task 2: Create Meeting Minutes Validators

**Files:**

- Create: `src/features/meetings/validators/minutes.ts`

- [ ] **Step 1: Implement CreateMeetingMinuteSchema and UpdateMeetingMinuteSchema**

```typescript
import { z } from 'zod';

export const CreateMeetingMinuteSchema = z.object({
  agendaPoint: z.string().min(1, 'Agenda point is required'),
  decision: z.string().min(1, 'Decision is required'),
  actionItems: z
    .array(
      z.object({
        assigneeId: z.string().uuid('Invalid assignee ID').optional(),
        task: z.string().min(1, 'Task description is required'),
        dueDate: z.string().datetime('Invalid date format').optional(),
      }),
    )
    .optional(),
});

export type CreateMeetingMinuteInput = z.infer<typeof CreateMeetingMinuteSchema>;

export const UpdateMeetingMinuteSchema = CreateMeetingMinuteSchema.partial();
export type UpdateMeetingMinuteInput = z.infer<typeof UpdateMeetingMinuteSchema>;
```

### Task 3: Export Validators from Index

**Files:**

- Modify: `src/features/meetings/validators/index.ts`

- [ ] **Step 1: Add export for minutes**

```typescript
export * from './agenda-items';
export * from './attendee';
export * from './meetings';
export * from './minutes';
```

### Task 4: Commit and Report

- [ ] **Step 1: Commit changes**

```bash
git add src/features/meetings/validators/
git commit -m "feat: add agenda and minutes validators"
```
