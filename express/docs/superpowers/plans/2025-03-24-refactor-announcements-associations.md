# Refactor Announcements & Associations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor 32 files for maximum readability, clean formatting, proper spacing, and clear structure with full JSDoc documentation.

**Architecture:** Batch refactoring by category (Admin, Announcements, Associations, Shared) to ensure consistency. Use standardized JSDoc and spacing patterns.

**Tech Stack:** TypeScript, Express, Prisma.

---

### Task 1: Refactor Group A: Admin Features (4 files)

**Files:**
- Modify: `src/features/admin/routes/associations.route.ts`
- Modify: `src/features/admin/routes/index.ts`
- Modify: `src/features/admin/routes/membership-applications.route.ts`
- Modify: `src/features/admin/routes/stub.ts`

- [ ] **Step 1: Refactor `src/features/admin/routes/associations.route.ts`**
  - Add file-level JSDoc.
  - Group and space imports.
  - Add JSDoc to every `RequestHandler[]` export.
  - Add blank lines between logical steps in `asyncHandler`.
- [ ] **Step 2: Refactor `src/features/admin/routes/index.ts`**
  - Add file-level JSDoc.
  - Add JSDoc to the router export.
- [ ] **Step 3: Refactor `src/features/admin/routes/membership-applications.route.ts`**
  - Add file-level JSDoc.
  - Apply spacing and JSDoc to all handlers.
- [ ] **Step 4: Refactor `src/features/admin/routes/stub.ts`**
  - Add file-level JSDoc and export JSDoc.
- [ ] **Step 5: Verify syntax**
  Run: `npx tsc --noEmit`

### Task 2: Refactor Group B: Announcement Routes (5 files)

**Files:**
- Modify: `src/features/announcements/routes/announcement-detail.route.ts`
- Modify: `src/features/announcements/routes/announcements.route.ts`
- Modify: `src/features/announcements/routes/index.ts`
- Modify: `src/features/announcements/routes/mark-read.route.ts`
- Modify: `src/features/announcements/routes/upload-image.route.ts`

- [ ] **Step 1: Refactor Announcement Routes**
  - Apply the same standards: file-level JSDoc, group imports, handler JSDoc, airy structure.
- [ ] **Step 2: Verify syntax**
  Run: `npx tsc --noEmit`

### Task 3: Refactor Group C: Announcement Services (9 files)

**Files:**
- Modify: `src/features/announcements/services/createAnnouncement.ts`
- Modify: `src/features/announcements/services/deleteAnnouncement.ts`
- Modify: `src/features/announcements/services/findManyAnnouncements.ts`
- Modify: `src/features/announcements/services/findUniqueAnnouncement.ts`
- Modify: `src/features/announcements/services/index.ts`
- Modify: `src/features/announcements/services/markAnnouncementRead.ts`
- Modify: `src/features/announcements/services/sendAnnouncementNotifications.ts`
- Modify: `src/features/announcements/services/updateAnnouncement.ts`
- Modify: `src/features/announcements/services/uploadImage.ts`

- [ ] **Step 1: Refactor Announcement Services**
  - Add JSDoc to service functions.
  - Ensure clear separation between data validation, database calls, and notification triggers.
- [ ] **Step 2: Verify syntax**
  Run: `npx tsc --noEmit`

### Task 4: Refactor Group D: Association Routes (3 files)

**Files:**
- Modify: `src/features/associations/routes/associations.route.ts`
- Modify: `src/features/associations/routes/index.ts`
- Modify: `src/features/associations/routes/stub.ts`

- [ ] **Step 1: Refactor Association Routes**
  - Standardize headers and internal spacing.
- [ ] **Step 2: Verify syntax**
  Run: `npx tsc --noEmit`

### Task 5: Refactor Group E: Association Services (6 files)

**Files:**
- Modify: `src/features/associations/services/createAssociation.ts`
- Modify: `src/features/associations/services/deleteAssociation.ts`
- Modify: `src/features/associations/services/findFirstAssociation.ts`
- Modify: `src/features/associations/services/findManyAssociation.ts`
- Modify: `src/features/associations/services/findUniqueAssociation.ts`
- Modify: `src/features/associations/services/updateAssociation.ts`

- [ ] **Step 1: Refactor Association Services**
- [ ] **Step 2: Verify syntax**
  Run: `npx tsc --noEmit`

### Task 6: Refactor Group F: Shared Logic & Validators (5 files)

**Files:**
- Modify: `src/features/announcements/validators/index.ts`
- Modify: `src/features/associations/types/association.ts`
- Modify: `src/features/associations/types/index.ts`
- Modify: `src/features/associations/validators/associations.ts`
- Modify: `src/features/associations/validators/index.ts`

- [ ] **Step 1: Refactor Validators and Types**
  - Ensure Zod schemas and type definitions are properly documented.
- [ ] **Step 2: Verify syntax**
  Run: `npx tsc --noEmit`
- [ ] **Step 3: Final check of all 32 files**
