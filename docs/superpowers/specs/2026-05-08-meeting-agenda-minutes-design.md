# Design Spec: Granular Meeting Agenda & Decisions API

**Status:** DRAFT
**Created:** 2026-05-08
**Topic:** Meeting Management Enhancements

## 1. Purpose

Enable secretaries and administrators to surgically manage meeting agendas and record specific decisions (minutes) with action items. This replaces bulk updates with granular operations to improve concurrency and user experience.

## 2. Architecture & Data Flow

### 2.1 API Endpoints

#### `PATCH /api/meetings/[meetingId]/agenda`

Handles bulk-granular updates to the agenda items.

- **Operations supported:** `CREATE`, `UPDATE`, `DELETE`, `REORDER`.
- **Validation:** Ensures all items belong to the meeting and orders are valid.

#### `POST /api/meetings/[meetingId]/minutes`

Records a new decision or meeting minute.

- **Fields:** `agendaPoint`, `decision`, `actionItems` (JSON).

#### `PATCH /api/meetings/[meetingId]/minutes/[minutesId]`

Updates an existing decision record.

### 2.2 Data Models (Prisma)

- `AgendaItem`: `id`, `meetingId`, `order`, `title`, `description`.
- `MeetingMinutes`: `id`, `meetingId`, `agendaPoint`, `decision`, `actionItems`.

## 3. Implementation Plan

### 3.1 Schemas (Zod)

Define `AgendaOperationSchema` and `MeetingMinutesSchema`.

```typescript
const AgendaOperationSchema = z.object({
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

### 3.2 Services

- `processAgendaOperations`: Handles the transaction-safe execution of agenda changes.
- `createMeetingMinute`: Records a decision.
- `updateMeetingMinute`: Modifies an existing record.

## 4. Security

- Access restricted to `SECRETARY`, `PRESIDENT`, and `SUPER_ADMIN`.
- Uses `withAssociation` middleware to ensure tenant isolation.

## 5. Testing Strategy

- **Unit Tests:** Validate reordering logic and schema constraints.
- **Integration Tests:** Verify that agenda items and minutes are correctly linked to meetings in the database.
