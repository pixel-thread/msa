# MFSA Portal Memory Log

This is an append-only log of model actions, files created, and security findings.

## Logs

- **2026-05-20 19:30** - [AGENT-SPAWN] Started training module UI implementation. Scope: Implement dashboard pages and components for the 6 training API endpoints.
- **2026-05-20 19:30** - [FILE-CREATED] Created plans/memory.md
- **2026-05-20 19:40** - [ARCHIVED] Completed and archived Training Management UI plan to plans/completed/2026-05-20-training-management-ui.md.
- **2026-05-20 19:48** - [IMPL] Separated training portal and admin routes. Created separate pages at `/training` (TrainingPortalPage) and `/training/admin` (TrainingAdminPage) with role checks and Access Denied fallback. Added dynamic sidebar menu item links.
- **2026-05-20 20:00** - [IMPL] Refactored training route layout to map subroutes: `/training` (Active courses), `/training/my-completions` (My Completions logs), `/training/trainingdetail/[moduleId]` (Standalone course detail view and self-completion tool), `/training/completions` (Admin completions logs), `/training/modules` (Admin training modules creator/editor). Updated dynamic sidebar sub-links dynamically. Verified clean TypeScript compilation.
- **2026-05-20 20:05** - [IMPL] Swapped card grid with custom DataTable in TrainingPortalPage. Created usePortalModuleTableColumns hook to manage course list table headers, duration tags, completion indicators, and direct Start/Review action button links.
- **2026-05-20 20:10** - [IMPL] Fixed global CSS configuration. Restored Coinbase design palette in globals.css, mapping primary to Coinbase Blue (#0052ff) and populating custom variables (--ink, --canvas, --surface-card) in :root and .dark to fix transparent/broken UI colors.
- **2026-05-24 10:00** - [AGENT-SPAWN] Agent Role: Planner. Parent Task: Auth Security & Architecture Remediation. Scope: Generate structured execution plan for critical auth vulnerabilities.
- **2026-05-24 10:05** - [PLAN] Published Plan Artifact to plans/active_feature_plan.md. Outcome: COMPLETE.
- **2026-05-24 10:15** - [IMPL] Fixed missing JWT algorithm enforcement across all JWT verification functions.
- **2026-05-24 10:15** - [IMPL] Standardized CSRF cookie naming to prevent validation mismatch.
- **2026-05-24 10:15** - [IMPL] Removed sensitive tokens from JSON response bodies for /sign-in and /refresh endpoints.
- **2026-05-24 10:15** - [IMPL] Removed unsafe CSP directives ("unsafe-eval", "unsafe-inline") from middleware.
- **2026-05-24 10:15** - [IMPL] Reordered middleware chain to execute withLogging earlier and modified it to catch and log errors.
- **2026-05-24 10:15** - [IMPL] Implemented a 30-second Redis-backed grace period for refresh token rotation to prevent race conditions causing unintended family revocations.
- **2026-05-24 10:20** - [REVIEW] Validated all security hotfixes against OWASP Top 10 and project rules.
- **2026-05-24 10:25** - [ARCHIVED] Auth Security & Architecture Remediation plan archived to plans/completed/2026-05-24-auth-security-remediation.md.
- **2026-05-24 10:30** - [IMPL] Reverted removal of tokens from JSON response body in /sign-in and /refresh to support mobile app token consumption.
