# Expo Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement backend support for registration and delivery of Expo Push Notifications for meeting assignments.

**Architecture:** Split-endpoint registration (Public `register`, Protected `link`) with a global `PushToken` model and an `ExpoNotificationService` wrapper around `expo-server-sdk`.

**Tech Stack:** Next.js, Prisma, Expo Server SDK, TypeScript.

---

### Task 1: Environment & Dependency Setup

- [ ] **Step 1: Install `expo-server-sdk`**

Run: `pnpm add expo-server-sdk`

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add expo-server-sdk dependency"
```

---

### Task 2: Database Schema Update

- **Modify:** `src/shared/lib/prisma/schema.prisma`

- [ ] **Step 1: Add `PushToken` model**

```prisma
model User {
  // ... existing fields ...
  pushTokens           PushToken[]
}

model PushToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("push_tokens")
}
```

- [ ] **Step 2: Run Prisma Generate**

Run: `npx prisma generate`

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/prisma/schema.prisma
git commit -m "feat: add PushToken model to schema"
```

---

### Task 3: Expo Service Wrapper

- **Create:** `src/shared/lib/expo.ts`

- [ ] **Step 1: Implement `ExpoNotificationService`**

```typescript
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from './prisma';

let expo = new Expo();

export class ExpoNotificationService {
  static async sendPushNotifications(tokens: string[], title: string, body: string, data?: any) {
    const messages: ExpoPushMessage[] = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Handle receipts and cleanup invalid tokens
    // For simplicity in this step, we just log. Comprehensive cleanup can be added later.
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/lib/expo.ts
git commit -m "feat: implement ExpoNotificationService wrapper"
```

---

### Task 4: API Endpoints

- **Create:** `src/app/api/notifications/register/route.ts`
- **Create:** `src/app/api/notifications/link/route.ts`

- [ ] **Step 1: Implement Public Register Route**

```typescript
// src/app/api/notifications/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { updatedAt: new Date() },
      create: { token },
    });

    return NextResponse.json(pushToken);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement Protected Link Route**

```typescript
// src/app/api/notifications/link/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { getAuth } from '@/shared/api/auth'; // Hypothetical auth helper

export async function POST(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const pushToken = await prisma.pushToken.update({
      where: { token },
      data: { userId: auth.user.id },
    });

    return NextResponse.json(pushToken);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/notifications/register/route.ts src/app/api/notifications/link/route.ts
git commit -m "feat: add notification registration API routes"
```

---

### Task 5: Meeting Assignment Integration

- **Modify:** `src/features/meetings/services/attendance.service.ts` (or similar)

- [ ] **Step 1: Trigger notification on meeting assignment**

Find where `MeetingAttendee` is created and add:

```typescript
const userTokens = await prisma.pushToken.findMany({
  where: { userId },
  select: { token: true },
});

if (userTokens.length > 0) {
  await ExpoNotificationService.sendPushNotifications(
    userTokens.map((t) => t.token),
    'New Meeting Assigned',
    `You have been assigned to: ${meeting.title}`,
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/meetings/services/attendance.service.ts
git commit -m "feat: trigger push notification on meeting assignment"
```
