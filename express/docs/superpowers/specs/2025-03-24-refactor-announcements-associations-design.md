# Design Spec: Refactoring Announcements & Associations Features

**Version:** 1.0.0
**Status:** APPROVED
**Date:** 2025-03-24

## 1. Objective
Refactor 32 files in the `src/features/admin`, `src/features/announcements`, and `src/features/associations` directories for maximum readability, clean formatting, and consistent structure.

## 2. Standards & Rules

### 2.1 JSDoc Documentation
- **File Level:** Every file must start with a JSDoc block describing its role.
- **Exports:** Every exported function, class, or variable must have a JSDoc block.
- **Content:** Include `@description`, `@param`, `@returns`, and `@throws` where applicable.

### 2.2 Formatting & Spacing
- **Airy Structure:** Generous use of blank lines between logical sections.
- **Import Grouping:**
  1. External libraries (e.g., express, prisma)
  2. Shared utilities/lib (@src/shared)
  3. Local feature components (services, validators)
  - One blank line between groups.
- **Function Internals:**
  - Blank line after variable setup.
  - Blank line before the `return` statement.
  - One blank line between major logical steps (e.g., input validation -> database call -> response).
- **No Clustering:** One operation per line. No multiple assignments or complex nested ternaries on a single line.

### 2.3 Comments
- **Inline Only:** Use `//` for logic explanation inside functions.
- **No Internal JSDoc:** JSDoc is strictly for definitions, not for commenting logic steps.

## 3. Scope (32 Files)

### Group A: Admin Features
- `src/features/admin/routes/associations.route.ts`
- `src/features/admin/routes/index.ts`
- `src/features/admin/routes/membership-applications.route.ts`
- `src/features/admin/routes/stub.ts`

### Group B: Announcement Features (Routes)
- `src/features/announcements/routes/announcement-detail.route.ts`
- `src/features/announcements/routes/announcements.route.ts`
- `src/features/announcements/routes/index.ts`
- `src/features/announcements/routes/mark-read.route.ts`
- `src/features/announcements/routes/upload-image.route.ts`

### Group C: Announcement Features (Services)
- `src/features/announcements/services/createAnnouncement.ts`
- `src/features/announcements/services/deleteAnnouncement.ts`
- `src/features/announcements/services/findManyAnnouncements.ts`
- `src/features/announcements/services/findUniqueAnnouncement.ts`
- `src/features/announcements/services/index.ts`
- `src/features/announcements/services/markAnnouncementRead.ts`
- `src/features/announcements/services/sendAnnouncementNotifications.ts`
- `src/features/announcements/services/updateAnnouncement.ts`
- `src/features/announcements/services/uploadImage.ts`

### Group D: Association Features (Routes)
- `src/features/associations/routes/associations.route.ts`
- `src/features/associations/routes/index.ts`
- `src/features/associations/routes/stub.ts`

### Group E: Association Features (Services)
- `src/features/associations/services/createAssociation.ts`
- `src/features/associations/services/deleteAssociation.ts`
- `src/features/associations/services/findFirstAssociation.ts`
- `src/features/associations/services/findManyAssociation.ts`
- `src/features/associations/services/findUniqueAssociation.ts`
- `src/features/associations/services/updateAssociation.ts`

### Group F: Shared Logic & Validators
- `src/features/announcements/validators/index.ts`
- `src/features/associations/types/association.ts`
- `src/features/associations/types/index.ts`
- `src/features/associations/validators/associations.ts`
- `src/features/associations/validators/index.ts`

## 4. Verification Plan
- **Pre-check:** Ensure all files exist.
- **Refactor:** Apply changes batch by batch.
- **Static Analysis:** Run `pnpm run lint` or equivalent if available to ensure no regressions in formatting or types.
- **Functionality:** Exact business logic must be preserved.
