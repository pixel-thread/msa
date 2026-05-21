# Update Training Pages to Admin-Only Flow

## 1. Overview
The training module is being streamlined to serve purely as an administrative tool for managing training modules, their supplements, and user assignments. End-user facing pages (e.g., "My Training", "My Completions") will be removed. 

The new flow will consist of two primary routes:
- `/training`: A list of all training modules in a data table.
- `/training/:id`: A detail page for managing a specific training module (editing, deleting, adding supplements, assigning users, and recording completion/scores).

## 2. Changes to Routing
- Update `src/app/(dashboard)/training/page.tsx` to render `<TrainingListPage />`.
- Rename `src/app/(dashboard)/training/modules/[moduleId]/page.tsx` to `src/app/(dashboard)/training/[id]/page.tsx` and render `<TrainingDetailPage />`.
- **Delete** the following obsolete directories:
  - `src/app/(dashboard)/training/completions`
  - `src/app/(dashboard)/training/modules`
  - `src/app/(dashboard)/training/my-completions`

## 3. Changes to Pages
### A. Create `TrainingListPage.tsx`
- Replace `AdminModulesPage.tsx` with this new page.
- Render a `DataTable` listing all training modules.
- Ensure row clicks navigate to `/training/${module.id}`.

### B. Refactor `TrainingDetailPage.tsx`
- Remove end-user course content view logic.
- Add "Edit Module" and "Delete Module" actions.
- Add a "Supplements" section to list and add module supplements using the `CreateSupplementSchema`.
- Retain the "Assigned Users" data table at the bottom, which already includes the dialog to mark completion and assign a score.

### C. Clean Up Obsolete Pages
- Delete the following from `src/features/training/pages/`:
  - `AdminCompletionsPage.tsx`, `AdminModulesPage.tsx`, `MyCompletionsPage.tsx`, `TrainingAdminPage.tsx`, `TrainingPortalPage.tsx`, `training.tsx`
- Update `src/features/training/pages/index.ts` to export only `TrainingListPage` and `TrainingDetailPage`.

## 4. Components & Hooks Updates
- Create an `AddSupplementDialog.tsx` to utilize the existing supplements endpoint.
- Ensure `useModuleTableColumns` is updated to handle row clicks for navigation.
