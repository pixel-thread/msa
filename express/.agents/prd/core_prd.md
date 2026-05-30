# MFSA Connect — Security-First Technical PRD

**Version:** 2.0.0 | **Date:** 2026-05-07
**Organization:** Meghalaya Finance Service Association (MFSA)
**Stack:** Next.js 15 (App Router) · Clerk · PostgreSQL · Prisma · Zod · Redis (Upstash) · T3 Env

> **v2.0 Changes:**
>
> - Every table now carries `associationId` — one user belongs to exactly one association at a time
> - New `Association` model — MFSA, MPSA, and future associations share one backend
> - `MeetingAttendee` join table — admins assign/invite specific members to meetings within their association
> - Association context injected by middleware; Prisma middleware auto-scopes all queries
> - Updated `middleware.ts`, all API routes, Prisma schema, and Zod schemas

---

## Table of Contents

1. [Executive Summary & Stack Alignment](#1-executive-summary--stack-alignment)
2. [Information Architecture (Frontend Pages)](#2-information-architecture-frontend-pages)
3. [API Route Structure (Backend)](#3-api-route-structure-backend)
4. [Core Security Implementation — Middleware](#4-core-security-implementation--middleware)
5. [Database & Compliance Schema — Prisma & Zod](#5-database--compliance-schema--prisma--zod)
6. [Security-First Constraints](#6-security-first-constraints)
7. [Feature Specifications](#7-feature-specifications)
8. [Subscription Engine](#8-subscription-engine)
9. [Financial General Ledger](#9-financial-general-ledger)
10. [Meeting & Governance Module](#10-meeting--governance-module)
11. [Audit Logging Strategy](#11-audit-logging-strategy)
12. [Environment Configuration (T3 Env)](#12-environment-configuration-t3-env)
13. [Multi-Association Architecture](#13-multi-association-architecture)
14. [Role × Feature Matrix](#14-role--feature-matrix)

---

## 1. Executive Summary & Stack Alignment

### 1.1 Why This Stack Satisfies Core Objectives

MFSA Connect is a finance-sector member platform for government-affiliated bodies in North-East India. The same backend serves multiple independent associations (MFSA, MPSA, …) with full data isolation. The platform must satisfy the **Digital Personal Data Protection (DPDP) Act 2023** and handle financial ledger operations with zero tolerance for security compromise.

| Core Objective                  | Stack Solution                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-Association Isolation** | Every table carries `associationId`; Prisma middleware auto-injects it on every query; PostgreSQL RLS enforces it at the database level       |
| **DPDP Consent Management**     | Clerk webhooks trigger `ConsentReceipt` writes scoped to the user's association; every action is immutable and timestamped                    |
| **Data Subject Rights (DSAR)**  | `DsarTicket` table with auto-computed `responseDeadline` (created + 21 days) and association scope                                            |
| **Enterprise-Grade Security**   | `middleware.ts` enforces Clerk JWT verification, Redis rate limiting, and Helmet-equivalent headers before any route handler runs             |
| **Role-Based Access Control**   | Clerk `org_role` metadata (`super_admin`, `president`, `secretary`, `finance`, `dpo`, `member`) maps to Next.js route groups and `withRole()` |
| **Audit Trail**                 | Prisma middleware intercepts every mutation and writes an `AuditLog` row — scoped to the association — in the same transaction                |
| **Data Retention (7 years)**    | `dataRetentionUntil` auto-set on user insert; Vercel Cron runs `anonymize_expired_users()` daily at 02:00                                     |
| **Encryption at Rest**          | AES-256-GCM column encryption via Prisma middleware for designated PII fields; keys from T3 Env                                               |
| **Meeting Assignment**          | `MeetingAttendee` join table lets admins invite/assign specific members; members see only meetings they're part of                            |

### 1.2 Key Architectural Decisions

- **Single Codebase, Multi-Association:** One Next.js deployment serves MFSA, MPSA, and any future association. The `x-association-id` header, set by middleware from the subdomain or mobile app config, scopes every query automatically.
- **Clerk as Identity Plane:** Clerk handles sessions, OAuth (Google), and JWT issuance. The app never stores passwords. Each Clerk organization maps to one association.
- **Prisma as the Single DB Gate:** All database access goes through Prisma — no raw SQL in route handlers. Association scoping and audit log injection happen via Prisma middleware, transparent to business logic.
- **Zod at Every Boundary:** All external input — request bodies, query params, webhook payloads, environment variables — is validated with Zod before touching business logic.
- **Redis as Rate-Limit Ledger:** Upstash Redis (HTTP, edge-compatible) stores sliding-window counters keyed by `associationSlug:ip`.

---

## 2. Information Architecture (Frontend Pages)

### 2.1 App Router Directory Tree

```
app/
│
├── (auth)/                              # Unauthenticated routes
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx                 # Clerk <SignIn /> component
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx                 # Clerk <SignUp />
│   └── onboarding/
│       └── page.tsx                     # Post-signup: date of joining govt,
│                                        # date of joining association, mobile,
│                                        # designation — writes to User model
│
├── (member)/                            # Role: member (and above)
│   ├── layout.tsx                       # MemberShell: sidebar, nav, session + association guard
│   ├── dashboard/
│   │   └── page.tsx                     # Member home: subscription status, meeting invites, quick actions
│   ├── profile/
│   │   ├── page.tsx                     # View profile
│   │   └── edit/
│   │       └── page.tsx                 # Edit profile (triggers audit log)
│   ├── subscription/
│   │   ├── page.tsx                     # Current plan, renewal date, payment history
│   │   └── upgrade/
│   │       └── page.tsx                 # Plan selection & payment
│   ├── payments/
│   │   └── page.tsx                     # Payment history, receipts, download PDF
│   ├── consent/
│   │   ├── page.tsx                     # Grant / withdraw consent per purpose
│   │   └── history/
│   │       └── page.tsx                 # Consent audit timeline
│   ├── dsar/
│   │   ├── page.tsx                     # File new DSAR request
│   │   ├── [ticketId]/
│   │   │   └── page.tsx                 # Ticket status & response download
│   │   └── history/
│   │       └── page.tsx                 # All DSAR tickets
│   └── meetings/
│       ├── page.tsx                     # Meetings I'm assigned to (upcoming + past)
│       └── [meetingId]/
│           └── page.tsx                 # Meeting detail: agenda, decisions, action items, RSVP
│
├── (finance)/                           # Role: finance, president, super_admin
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx                     # Financial summary: income, expense, balance
│   ├── cashbook/
│   │   ├── page.tsx                     # Day book / cashbook view
│   │   └── entry/
│   │       └── page.tsx                 # New cash entry
│   ├── ledger/
│   │   ├── page.tsx                     # General ledger (all accounts)
│   │   ├── [accountCode]/
│   │   │   └── page.tsx                 # Per-account ledger
│   │   └── member/
│   │       └── [memberId]/
│   │           └── page.tsx             # Individual member ledger
│   ├── receipts/
│   │   ├── page.tsx
│   │   └── [receiptId]/
│   │       └── page.tsx                 # Receipt detail + PDF
│   ├── payments/
│   │   ├── page.tsx
│   │   └── record/
│   │       └── page.tsx                 # Manual payment recording
│   ├── subscriptions/
│   │   └── page.tsx                     # Subscription collection tracking
│   └── reports/
│       ├── page.tsx
│       ├── income-expenditure/
│       │   └── page.tsx
│       ├── balance-sheet/
│       │   └── page.tsx
│       └── member-collection/
│           └── page.tsx
│
├── (admin)/                             # Role: secretary, president, super_admin
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── members/
│   │   ├── page.tsx                     # Member list: search, filter, export
│   │   ├── [memberId]/
│   │   │   ├── page.tsx                 # Member profile (admin view)
│   │   │   └── ledger/
│   │   │       └── page.tsx
│   │   ├── invite/
│   │   │   └── page.tsx
│   │   └── bulk-import/
│   │       └── page.tsx
│   ├── meetings/
│   │   ├── page.tsx                     # All meetings list (EC + General)
│   │   ├── new/
│   │   │   └── page.tsx                 # Schedule meeting
│   │   └── [meetingId]/
│   │       ├── page.tsx                 # Meeting detail + attendance roster
│   │       ├── agenda/
│   │       │   └── page.tsx             # Manage agenda items
│   │       ├── attendees/
│   │       │   └── page.tsx             # ★ ASSIGN MEMBERS TO MEETING
│   │       │                            #   Search members within association
│   │       │                            #   Set role: REQUIRED | OPTIONAL | OBSERVER
│   │       │                            #   Track RSVP: PENDING | ACCEPTED | DECLINED
│   │       │                            #   Send meeting notice to selected members
│   │       ├── minutes/
│   │       │   └── page.tsx             # Record decisions & minutes
│   │       └── notice/
│   │           └── page.tsx             # Issue formal notice + notification trigger
│   ├── training/
│   │   ├── page.tsx
│   │   └── [moduleId]/
│   │       └── page.tsx
│   └── notices/
│       └── page.tsx
│
├── (president)/                         # Role: president, super_admin
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx                     # Executive analytics
│   ├── approvals/
│   │   └── page.tsx                     # Pending financial approvals
│   └── reports/
│       └── page.tsx
│
├── (dpo)/                               # Role: dpo
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── dsar/
│   │   ├── page.tsx
│   │   └── [ticketId]/
│   │       └── page.tsx
│   ├── consent/
│   │   ├── page.tsx
│   │   └── audit/
│   │       └── page.tsx
│   └── compliance/
│       ├── page.tsx
│       └── reports/
│           └── page.tsx
│
├── (super-admin)/                       # Role: super_admin only
│   ├── layout.tsx
│   ├── associations/                    # ★ Manage all associations
│   │   ├── page.tsx                     # List all associations
│   │   ├── new/
│   │   │   └── page.tsx                 # Create new association
│   │   └── [associationId]/
│   │       └── page.tsx                 # Edit settings & branding
│   ├── plans/
│   │   ├── page.tsx
│   │   └── [planId]/
│   │       └── page.tsx
│   ├── roles/
│   │   └── page.tsx
│   └── config/
│       └── page.tsx
│
├── api/
│   └── ...
│
├── _components/
├── _lib/
├── layout.tsx
└── page.tsx                             # Landing / association selector / redirect
```

---

## 3. API Route Structure (Backend)

> **All authenticated routes are automatically scoped to the requesting user's association** via the `x-association-id` header set by middleware. No route handler manually filters by association — the Prisma association middleware handles it.

### 3.1 Authentication & Identity

| Route                       | Method | Purpose                                        | Roles             |
| --------------------------- | ------ | ---------------------------------------------- | ----------------- |
| `/api/auth/sign-up`         | POST   | Register new user with email/password          | Public            |
| `/api/auth/sign-in`         | POST   | Authenticate with email/password + MFA support | Public            |
| `/api/auth/sign-in/verify`  | POST   | Verify MFA code and issue tokens               | Public            |
| `/api/auth/refresh`         | POST   | Refresh access token using refresh token       | Authenticated     |
| `/api/auth/logout`          | POST   | Invalidate refresh token and clear cookies     | Authenticated     |
| `/api/auth/me`              | GET    | Current user profile + role + association      | All authenticated |
| `/api/auth/forgot-password` | POST   | Request password reset email                   | Public            |
| `/api/auth/reset-password`  | POST   | Reset password with token                      | Public            |
| `/api/auth/change-password` | POST   | Change password (authenticated)                | Authenticated     |
| `/api/auth/mfa/setup`       | POST   | Start MFA setup (requires password)            | Authenticated     |
| `/api/auth/mfa/verify`      | POST   | Verify and enable MFA                          | Authenticated     |
| `/api/auth/mfa/disable`     | POST   | Disable MFA (requires password)                | Authenticated     |

### 3.2 Associations (Super Admin)

| Route                                          | Method | Purpose                              | Roles       |
| ---------------------------------------------- | ------ | ------------------------------------ | ----------- |
| `/api/associations`                            | GET    | List all associations                | super_admin |
| `/api/associations`                            | POST   | Create a new association             | super_admin |
| `/api/associations/[associationId]`            | GET    | Association detail                   | super_admin |
| `/api/associations/[associationId]`            | PATCH  | Update branding / settings / contact | super_admin |
| `/api/associations/[associationId]/deactivate` | POST   | Soft-deactivate                      | super_admin |

### 3.3 Member Management

| Route                             | Method | Purpose                                         | Roles                                  |
| --------------------------------- | ------ | ----------------------------------------------- | -------------------------------------- |
| `/api/members`                    | GET    | List members in current association (paginated) | secretary, president, super_admin      |
| `/api/members/[memberId]`         | GET    | Single member profile                           | secretary, president, super_admin, dpo |
| `/api/members/[memberId]`         | PATCH  | Update member profile                           | secretary, super_admin                 |
| `/api/members/[memberId]/suspend` | POST   | Suspend member                                  | president, super_admin                 |
| `/api/members/[memberId]/ledger`  | GET    | Member transaction history                      | finance, president, super_admin        |
| `/api/members/onboarding`         | POST   | Complete post-signup onboarding                 | Authenticated (own only)               |

### 3.4 Subscription Management

| Route                                          | Method | Purpose                       | Roles                            |
| ---------------------------------------------- | ------ | ----------------------------- | -------------------------------- |
| `/api/subscriptions/plans`                     | GET    | Plans for current association | All authenticated                |
| `/api/subscriptions/plans`                     | POST   | Create plan                   | super_admin                      |
| `/api/subscriptions/plans/[planId]`            | PATCH  | Update plan — future-dated    | super_admin                      |
| `/api/subscriptions/plans/[planId]`            | DELETE | Deactivate plan               | super_admin                      |
| `/api/subscriptions/my`                        | GET    | Own active subscription       | member                           |
| `/api/subscriptions/subscribe`                 | POST   | Subscribe to plan             | member                           |
| `/api/subscriptions/waive`                     | POST   | Waive on death/exit           | secretary, super_admin           |
| `/api/subscriptions/[subscriptionId]/payments` | GET    | Subscription payment history  | member (own), finance, president |

### 3.5 Payments & Finance

| Route                                   | Method | Purpose                       | Roles                           |
| --------------------------------------- | ------ | ----------------------------- | ------------------------------- |
| `/api/payments`                         | GET    | All payments in association   | finance, president, super_admin |
| `/api/payments/my`                      | GET    | Own payments                  | member                          |
| `/api/payments/record`                  | POST   | Record manual payment         | finance, super_admin            |
| `/api/payments/[paymentId]`             | GET    | Payment detail                | finance, president, owner       |
| `/api/payments/[paymentId]/receipt`     | GET    | Generate receipt PDF          | finance, owner                  |
| `/api/ledger/entries`                   | GET    | All ledger entries            | finance, president, super_admin |
| `/api/ledger/entries`                   | POST   | Post double-entry transaction | finance, super_admin            |
| `/api/ledger/entries/[entryId]/approve` | POST   | Approve pending entry         | president, super_admin          |
| `/api/ledger/accounts`                  | GET    | Chart of accounts             | finance, president              |
| `/api/ledger/accounts`                  | POST   | Create new account            | finance, super_admin            |
| `/api/ledger/summary`                   | GET    | Balance summary by account    | finance, president, super_admin |
| `/api/ledger/member/[memberId]`         | GET    | Member-specific ledger        | finance, president, super_admin |

### 3.6 DSAR

| Route                          | Method | Purpose                    | Roles                       |
| ------------------------------ | ------ | -------------------------- | --------------------------- |
| `/api/dsar/submit`             | POST   | File DSAR ticket           | member (own)                |
| `/api/dsar/my`                 | GET    | Own DSAR tickets           | member                      |
| `/api/dsar/my/[ticketId]`      | GET    | Own ticket status          | member                      |
| `/api/dsar`                    | GET    | All tickets in association | secretary, dpo, super_admin |
| `/api/dsar/[ticketId]`         | GET    | Ticket detail              | secretary, dpo, super_admin |
| `/api/dsar/[ticketId]/assign`  | PATCH  | Assign to admin            | dpo, super_admin            |
| `/api/dsar/[ticketId]/respond` | POST   | Post response              | secretary, dpo, super_admin |
| `/api/dsar/[ticketId]/reject`  | POST   | Reject with reason         | dpo, super_admin            |
| `/api/dsar/sla-report`         | GET    | SLA compliance report      | dpo, president, super_admin |

### 3.7 Consent Management

| Route                  | Method | Purpose                            | Roles            |
| ---------------------- | ------ | ---------------------------------- | ---------------- |
| `/api/consent/my`      | GET    | Own consent state per purpose      | member           |
| `/api/consent/grant`   | POST   | Grant consent                      | member           |
| `/api/consent/revoke`  | POST   | Revoke consent                     | member           |
| `/api/consent/history` | GET    | Own consent change log             | member           |
| `/api/consent/all`     | GET    | All consent records in association | dpo, super_admin |
| `/api/consent/report`  | GET    | Consent rate by purpose            | dpo, president   |

### 3.8 Meetings & Governance

| Route                                          | Method | Purpose                                                              | Roles                             |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------- | --------------------------------- |
| `/api/meetings`                                | GET    | All meetings in association                                          | secretary, president, super_admin |
| `/api/meetings`                                | POST   | Schedule new meeting                                                 | secretary, president, super_admin |
| `/api/meetings/my`                             | GET    | Meetings current user is assigned to                                 | member                            |
| `/api/meetings/[meetingId]`                    | GET    | Meeting detail                                                       | Assigned attendees + all admins   |
| `/api/meetings/[meetingId]`                    | PATCH  | Update title / venue / time                                          | secretary, president, super_admin |
| `/api/meetings/[meetingId]/cancel`             | POST   | Cancel meeting                                                       | president, super_admin            |
| `/api/meetings/[meetingId]/notice`             | POST   | Issue formal notice → notify all attendees                           | secretary, super_admin            |
| `/api/meetings/[meetingId]/agenda`             | GET    | Agenda items                                                         | Assigned attendees + admins       |
| `/api/meetings/[meetingId]/agenda`             | POST   | Add agenda item                                                      | secretary, president, super_admin |
| `/api/meetings/[meetingId]/agenda/[itemId]`    | PATCH  | Edit agenda item                                                     | secretary, president, super_admin |
| `/api/meetings/[meetingId]/agenda/[itemId]`    | DELETE | Remove agenda item                                                   | secretary, president, super_admin |
| `/api/meetings/[meetingId]/attendees`          | GET    | Full attendee roster + RSVP status                                   | secretary, president, super_admin |
| `/api/meetings/[meetingId]/attendees`          | POST   | **Assign / invite members** (single or array)                        | secretary, president, super_admin |
| `/api/meetings/[meetingId]/attendees/bulk`     | POST   | **Bulk assign** — up to 200 members at once                          | secretary, president, super_admin |
| `/api/meetings/[meetingId]/attendees/[userId]` | PATCH  | Update attendee role or RSVP (admin sets role; member sets own RSVP) | secretary / member (own RSVP)     |
| `/api/meetings/[meetingId]/attendees/[userId]` | DELETE | Remove attendee                                                      | secretary, president, super_admin |
| `/api/meetings/[meetingId]/attendees/rsvp`     | POST   | Member submits own RSVP (ACCEPTED / DECLINED + note)                 | member (own)                      |
| `/api/meetings/[meetingId]/minutes`            | GET    | Recorded minutes & decisions                                         | Assigned attendees + admins       |
| `/api/meetings/[meetingId]/minutes`            | POST   | Record decisions                                                     | secretary, president, super_admin |
| `/api/meetings/[meetingId]/report`             | GET    | Generate PDF: agenda + decisions + action items + roster             | secretary, president, super_admin |

### 3.9 Training

| Route                                       | Method | Purpose                       | Roles                       |
| ------------------------------------------- | ------ | ----------------------------- | --------------------------- |
| `/api/training/modules`                     | GET    | Active modules in association | All authenticated           |
| `/api/training/modules`                     | POST   | Create module                 | super_admin, dpo            |
| `/api/training/modules/[moduleId]`          | GET    | Module content                | All authenticated           |
| `/api/training/modules/[moduleId]/complete` | POST   | Record completion + score     | member                      |
| `/api/training/completions`                 | GET    | All completion records        | secretary, dpo, super_admin |
| `/api/training/my-completions`              | GET    | Own completions               | member                      |

### 3.10 Compliance & Audit

| Route                      | Method | Purpose                   | Roles                       |
| -------------------------- | ------ | ------------------------- | --------------------------- |
| `/api/compliance/checks`   | GET    | Latest compliance results | dpo, super_admin            |
| `/api/compliance/checks`   | POST   | Trigger manual check      | dpo, super_admin            |
| `/api/compliance/evidence` | GET    | Evidence bundle           | dpo, super_admin            |
| `/api/audit-logs`          | GET    | Audit log viewer          | dpo, president, super_admin |

### 3.11 Cron Jobs (Internal — protected by `CRON_SECRET`)

| Route                           | Schedule    | Purpose                                   |
| ------------------------------- | ----------- | ----------------------------------------- |
| `/api/cron/dsar-sla`            | Daily 08:00 | Alert on breaching / at-risk DSAR tickets |
| `/api/cron/anonymize`           | Daily 02:00 | Anonymize users past 7-year retention     |
| `/api/cron/subscription-expiry` | Daily 00:00 | Flag / expire overdue subscriptions       |

---

## 4. Core Security Implementation — Middleware

### 4.1 `middleware.ts`

```typescript
// middleware.ts — root of project
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { verifyAccessToken } from "@src/shared/lib/jwt";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ROUTE CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/api/auth/sign-up",
  "/api/auth/sign-in",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
  "/api/docs",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );
}
  "/api/consent/all(.*)",
  "/api/consent/report(.*)",
  "/api/compliance(.*)",
  "/api/audit-logs(.*)",
]);

const isSuperAdminRoute = createRouteMatcher([
  "/(super-admin)(.*)",
  "/api/associations(.*)",
  "/api/subscriptions/plans(.*)",
]);

// ─────────────────────────────────────────────────────────────────────────────
// 2. RATE LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

let globalLimiter: Ratelimit | null = null;
let authLimiter: Ratelimit | null = null;

const getGlobalLimiter = () => {
  globalLimiter ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "15 m"),
    analytics: true,
    prefix: "mfsa:global",
  });
  return globalLimiter;
};

const getAuthLimiter = () => {
  authLimiter ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "mfsa:auth",
  });
  return authLimiter;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECURITY HEADERS
// ─────────────────────────────────────────────────────────────────────────────

function applySecurityHeaders(res: NextResponse): NextResponse {
  const h = res.headers;
  h.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-XSS-Protection", "1; mode=block");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  h.set("X-Permitted-Cross-Domain-Policies", "none");
  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  );
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ASSOCIATION RESOLUTION
//    Priority: subdomain → x-association-slug header → query param → default
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_SLUGS = new Set(["mfsa", "mpsa", "nfsa", "upsa"]);

function resolveAssociationSlug(req: NextRequest): string {
  const { hostname, searchParams } = new URL(req.url);

  const subdomain = hostname.split(".")[0] ?? "";
  if (KNOWN_SLUGS.has(subdomain)) return subdomain;

  const fromHeader = req.headers.get("x-association-slug") ?? "";
  if (KNOWN_SLUGS.has(fromHeader)) return fromHeader;

  const fromQuery = searchParams.get("association") ?? "";
  if (KNOWN_SLUGS.has(fromQuery)) return fromQuery;

  return "mfsa";
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type SessionClaims = { org_role?: string; metadata?: { role?: string } };

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 0,
  president: 1,
  dpo: 2,
  finance: 3,
  secretary: 4,
  member: 5,
};

function extractRole(claims: SessionClaims | null): string {
  return claims?.org_role ?? claims?.metadata?.role ?? "member";
}

function hasMinRole(userRole: string, required: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 99) <= (ROLE_HIERARCHY[required] ?? 99);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MAIN MIDDLEWARE (JWT-based)
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A. Public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // B. Rate limiting
  const ip = request.ip ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = pathname.startsWith("/api/auth/") ? getAuthLimiter() : getGlobalLimiter();
  const identifier = `${ip}:${pathname}`;

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // C. JWT Authentication
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    request.headers.set("x-user-id", payload.sub);
    request.headers.set("x-user-email", payload.email);
    request.headers.set("x-user-role", payload.role);
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Invalid or expired token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
```

---

### 4.2 JWT Authentication Flow

The application uses custom JWT-based authentication with the following flow:

1. **Sign Up** (`/api/auth/sign-up`): Creates user with bcrypt-hashed password, issues access + refresh tokens
2. **Sign In** (`/api/auth/sign-in`): Validates credentials, optionally requires MFA verification
3. **Token Refresh** (`/api/auth/refresh`): Rotates refresh tokens, issues new access token
4. **MFA** (`/api/auth/mfa/*`): Email-based 6-digit OTP verification

#### Token Configuration

- **Access Token**: 15 minutes expiry (short-lived for security)
- **Refresh Token**: 7 days expiry with rotation (new token issued on each use)
- **MFA OTP**: 6 digits, 5 minutes expiry, max 3 attempts
  [isSuperAdminRoute, "super_admin"],
  [isDpoRoute, "dpo"],
  [isFinanceRoute, "finance"],
  [isAdminRoute, "secretary"],
  ];

  for (const [matcher, required] of roleGuards) {
  if (matcher(req) && !hasMinRole(role, required)) {
  if (pathname.startsWith("/api/")) {
  return applySecurityHeaders(
  NextResponse.json(
  { error: "Insufficient permissions", code: "FORBIDDEN", required },
  { status: 403 },
  ),
  );
  }
  return NextResponse.redirect(new URL("/forbidden", req.url));
  }
  }

  // E. Enrich request headers for downstream handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", userId);
  requestHeaders.set("x-user-role", role);
  requestHeaders.set("x-association-slug", assocSlug);
  requestHeaders.set(
  "x-trace-id",
  req.headers.get("x-trace-id") ?? crypto.randomUUID(),
  );

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());
  res.headers.set("x-trace-id", requestHeaders.get("x-trace-id")!);

  return applySecurityHeaders(res);
  });

export const config = {
matcher: [
"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
],
};

````

---

## 5. Database & Compliance Schema — Prisma & Zod

### 5.1 `schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm]
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN
  PRESIDENT
  SECRETARY
  FINANCE
  DPO
  MEMBER
  @@map("user_role")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ANONYMIZED
  @@map("user_status")
}

enum ConsentPurpose {
  PAYMENTS
  COMMUNICATIONS
  MEETINGS
  ANALYTICS
  MARKETING
  @@map("consent_purpose")
}

enum ConsentStatus {
  GRANTED
  WITHDRAWN
  @@map("consent_status")
}

enum DsarRequestType {
  ACCESS
  CORRECTION
  DELETION
  PORTABILITY
  @@map("dsar_request_type")
}

enum DsarStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
  @@map("dsar_status")
}

enum PaymentType {
  SUBSCRIPTION
  DONATION
  EVENT_FEE
  BANK_INTEREST
  FAMILY_CONTRIBUTION
  @@map("payment_type")
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  WAIVED
  @@map("payment_status")
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  @@map("approval_status")
}

enum MeetingType {
  EC_MEETING
  GENERAL_MEETING
  @@map("meeting_type")
}

enum MeetingStatus {
  SCHEDULED
  NOTICE_ISSUED
  COMPLETED
  CANCELLED
  @@map("meeting_status")
}

enum AttendeeRole {
  REQUIRED    // Must attend
  OPTIONAL    // Invited; attendance is optional
  OBSERVER    // View-only participant
  @@map("attendee_role")
}

enum RsvpStatus {
  PENDING     // Invited, not yet responded
  ACCEPTED
  DECLINED
  @@map("rsvp_status")
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  CONSENT_GRANT
  CONSENT_REVOKE
  DSAR_SUBMIT
  DSAR_RESPOND
  PAYMENT_RECORD
  SUBSCRIPTION_CHANGE
  ANONYMIZE
  ROLE_CHANGE
  MEETING_ASSIGN
  MEETING_RSVP
  @@map("audit_action")
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSOCIATION  (root tenant)
// ─────────────────────────────────────────────────────────────────────────────

model Association {
  id             String   @id @default(cuid())
  slug           String   @unique            // "mfsa" | "mpsa"
  name           String   @unique
  description    String?
  logo           String?
  country        String   @default("IN")
  state          String?
  timezone       String   @default("Asia/Kolkata")
  currencyCode   String   @default("INR")
  primaryColor   String?  @default("#1f2937")
  secondaryColor String?  @default("#3b82f6")
  contactEmail   String?
  contactPhone   String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  users             User[]
  subscriptionPlans SubscriptionPlan[]
  payments          Payment[]
  dsarTickets       DsarTicket[]
  consentReceipts   ConsentReceipt[]
  accounts          Account[]
  meetings          Meeting[]
  trainingModules   TrainingModule[]
  auditLogs         AuditLog[]

  @@index([slug])
  @@index([isActive])
  @@map("associations")
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

model User {
  id                   String        @id @default(cuid())
  associationId        String                         // ★ Every user belongs to one association
  email                String
  name                 String
  mobile               String?                        // Encrypted (AES-256-GCM)
  designation          String?                        // Encrypted (AES-256-GCM)
  role                 UserRole      @default(MEMBER)
  status               UserStatus    @default(ACTIVE)
  dateOfJoiningGovt    DateTime?
  dateOfJoiningAssociation    DateTime?
  membershipNumber     String?
  overallConsentStatus ConsentStatus @default(GRANTED)
  dataRetentionUntil   DateTime      @default(dbgenerated("(NOW() + INTERVAL '7 years')"))
  failedLoginAttempts  Int           @default(0)
  lockedUntil          DateTime?
  password             String?                        // bcrypt hashed
  passwordResetToken   String?
  passwordResetExpires DateTime?
  mfaEnabled           Boolean       @default(false)
  deletedAt            DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  refreshTokens        RefreshToken[]
  verificationCodes    VerificationCode[]

  association          Association   @relation(fields: [associationId], references: [id], onDelete: Cascade)

  subscription         Subscription?
  payments             Payment[]
  dsarTickets          DsarTicket[]          @relation("MemberTickets")
  assignedDsarTickets  DsarTicket[]          @relation("AssignedTickets")
  consentReceipts      ConsentReceipt[]
  auditLogs            AuditLog[]            @relation("ActorLogs")
  ledgerEntries        LedgerEntry[]         @relation("CreatedEntries")
  approvedEntries      LedgerEntry[]         @relation("ApprovedEntries")
  trainingCompletions  TrainingCompletion[]
  meetingsCreated      Meeting[]             @relation("CreatedMeetings")
  meetingAttendances   MeetingAttendee[]     // ★ Meetings this user is assigned to

  // Email is unique within one association; same person can join MFSA and MPSA separately
  @@unique([associationId, email])
  @@unique([associationId, membershipNumber])
  @@index([passwordResetToken])
  @@index([associationId])
  @@index([email])
  @@index([role])
  @@index([status])
  @@index([dataRetentionUntil])
  @@map("users")
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TOKENS
// ─────────────────────────────────────────────────────────────────────────────

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique                        // Hashed
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

model VerificationCode {
  id        String    @id @default(cuid())
  userId    String
  code      String                                  // Hashed
  type      String                                  // "LOGIN_MFA" | "SETUP_MFA" | "PASSWORD_RESET"
  expiresAt DateTime
  usedAt    DateTime?
  attempts  Int        @default(0)
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("verification_codes")
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT
// ─────────────────────────────────────────────────────────────────────────────

model ConsentReceipt {
  id            String         @id @default(cuid())
  associationId String                               // ★
  userId        String
  purpose       ConsentPurpose
  status        ConsentStatus
  ipAddress     String?
  userAgent     String?
  channel       String         @default("web")
  metadata      Json?
  createdAt     DateTime       @default(now())       // Immutable — each change is a new row

  association   Association    @relation(fields: [associationId], references: [id], onDelete: Cascade)
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([associationId])
  @@index([userId, purpose])
  @@index([createdAt])
  @@map("consent_receipts")
}

// ─────────────────────────────────────────────────────────────────────────────
// DSAR
// ─────────────────────────────────────────────────────────────────────────────

model DsarTicket {
  id               String          @id @default(cuid())
  associationId    String                               // ★
  ticketNumber     String          @unique
  userId           String
  requestType      DsarRequestType
  requestedData    String[]
  description      String?
  status           DsarStatus      @default(PENDING)
  assignedToId     String?
  responseDeadline DateTime        @default(dbgenerated("(NOW() + INTERVAL '21 days')"))
  rejectedReason   String?
  completedAt      DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  association      Association     @relation(fields: [associationId], references: [id], onDelete: Cascade)
  member           User            @relation("MemberTickets",   fields: [userId],       references: [id], onDelete: Cascade)
  assignedTo       User?           @relation("AssignedTickets", fields: [assignedToId], references: [id])
  responses        DsarResponse[]

  @@unique([associationId, ticketNumber])
  @@index([associationId])
  @@index([userId])
  @@index([status])
  @@index([responseDeadline])
  @@map("dsar_tickets")
}

model DsarResponse {
  id             String     @id @default(cuid())
  dsarTicketId   String
  responseType   String
  storageKey     String?
  deliveryMethod String     @default("secure_download")
  notes          String?
  deliveredAt    DateTime?
  createdAt      DateTime   @default(now())

  ticket         DsarTicket @relation(fields: [dsarTicketId], references: [id], onDelete: Cascade)
  @@map("dsar_responses")
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

model SubscriptionPlan {
  id            String        @id @default(cuid())
  associationId String                               // ★
  name          String
  description   String?
  amount        Decimal       @db.Decimal(10, 2)
  currency      String        @default("INR")
  billingCycle  String        @default("YEARLY")
  features      Json
  isActive      Boolean       @default(true)
  effectiveFrom DateTime      @default(now())
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  association   Association   @relation(fields: [associationId], references: [id], onDelete: Cascade)
  subscriptions Subscription[]

  @@unique([associationId, name])
  @@index([associationId])
  @@map("subscription_plans")
}

model Subscription {
  id           String           @id @default(cuid())
  userId       String           @unique              // One active subscription per user
  planId       String
  status       String           @default("ACTIVE")
  startDate    DateTime         @default(now())
  endDate      DateTime
  waivedAt     DateTime?
  waivedReason String?
  waivedBy     String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan         SubscriptionPlan @relation(fields: [planId], references: [id])
  payments     Payment[]

  @@index([status])
  @@index([endDate])
  @@map("subscriptions")
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

model Payment {
  id             String        @id @default(cuid())
  associationId  String                               // ★
  userId         String
  subscriptionId String?
  amount         Decimal       @db.Decimal(10, 2)
  currency       String        @default("INR")
  type           PaymentType
  status         PaymentStatus @default(PENDING)
  receiptNumber  String?
  notes          String?
  paymentDate    DateTime      @default(now())
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  association    Association   @relation(fields: [associationId], references: [id], onDelete: Cascade)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
  ledgerEntries  LedgerEntry[]

  @@unique([associationId, receiptNumber])
  @@index([associationId])
  @@index([userId])
  @@index([status])
  @@map("payments")
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL LEDGER
// ─────────────────────────────────────────────────────────────────────────────

model Account {
  id            String       @id @default(cuid())
  associationId String                               // ★
  code          String
  name          String
  type          String
  description   String?
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())

  association   Association  @relation(fields: [associationId], references: [id], onDelete: Cascade)
  debitLines    LedgerLine[] @relation("DebitAccount")
  creditLines   LedgerLine[] @relation("CreditAccount")

  @@unique([associationId, code])
  @@unique([associationId, name])
  @@index([associationId])
  @@map("accounts")
}

model LedgerEntry {
  id              String         @id @default(cuid())
  referenceNumber String         @unique
  description     String
  transactionDate DateTime       @default(now())
  paymentId       String?
  category        String?
  approvalStatus  ApprovalStatus @default(PENDING)
  createdById     String
  approvedById    String?
  approvedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  createdBy       User           @relation("CreatedEntries",  fields: [createdById],  references: [id])
  approvedBy      User?          @relation("ApprovedEntries", fields: [approvedById], references: [id])
  payment         Payment?       @relation(fields: [paymentId], references: [id])
  lines           LedgerLine[]

  @@index([approvalStatus])
  @@index([transactionDate])
  @@map("ledger_entries")
}

model LedgerLine {
  id              String      @id @default(cuid())
  entryId         String
  debitAccountId  String?
  creditAccountId String?
  amount          Decimal     @db.Decimal(12, 2)
  narration       String?

  entry           LedgerEntry @relation(fields: [entryId],          references: [id], onDelete: Cascade)
  debitAccount    Account?    @relation("DebitAccount",  fields: [debitAccountId],  references: [id])
  creditAccount   Account?    @relation("CreditAccount", fields: [creditAccountId], references: [id])

  @@map("ledger_lines")
}

// ─────────────────────────────────────────────────────────────────────────────
// MEETINGS & GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

model Meeting {
  id             String          @id @default(cuid())
  associationId  String                               // ★
  title          String
  type           MeetingType
  status         MeetingStatus   @default(SCHEDULED)
  scheduledAt    DateTime
  venue          String?
  noticeIssuedAt DateTime?
  createdById    String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  association    Association     @relation(fields: [associationId], references: [id], onDelete: Cascade)
  createdBy      User            @relation("CreatedMeetings", fields: [createdById], references: [id])

  attendees      MeetingAttendee[]   // ★ All assigned members
  agendaItems    AgendaItem[]
  minutes        MeetingMinutes[]

  @@index([associationId])
  @@index([type])
  @@index([status])
  @@index([scheduledAt])
  @@map("meetings")
}

// ★ Meeting assignment join table
model MeetingAttendee {
  id           String       @id @default(cuid())
  meetingId    String
  userId       String
  attendeeRole AttendeeRole @default(OPTIONAL)
  rsvpStatus   RsvpStatus   @default(PENDING)
  rsvpNote     String?                           // Decline reason, etc.
  rsvpAt       DateTime?                         // Timestamp of RSVP
  notifiedAt   DateTime?                         // When meeting notice was sent to them
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  meeting      Meeting      @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId],   references: [id], onDelete: Cascade)

  @@unique([meetingId, userId])    // One row per member per meeting
  @@index([meetingId])
  @@index([userId])
  @@index([rsvpStatus])
  @@map("meeting_attendees")
}

model AgendaItem {
  id          String   @id @default(cuid())
  meetingId   String
  order       Int
  title       String
  description String?
  createdAt   DateTime @default(now())

  meeting     Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@index([meetingId])
  @@map("agenda_items")
}

model MeetingMinutes {
  id          String   @id @default(cuid())
  meetingId   String
  agendaPoint String
  decision    String
  actionItems Json?    // [{ assigneeId, task, dueDate }]
  recordedAt  DateTime @default(now())

  meeting     Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  @@map("meeting_minutes")
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING
// ─────────────────────────────────────────────────────────────────────────────

model TrainingModule {
  id               String              @id @default(cuid())
  associationId    String                               // ★
  title            String
  description      String?
  content          String
  durationMinutes  Int?
  requiredForRoles UserRole[]          @default([MEMBER])
  version          Int                 @default(1)
  isActive         Boolean             @default(true)
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  association      Association         @relation(fields: [associationId], references: [id], onDelete: Cascade)
  completions      TrainingCompletion[]

  @@unique([associationId, title])
  @@index([associationId])
  @@map("training_modules")
}

model TrainingCompletion {
  id             String         @id @default(cuid())
  userId         String
  moduleId       String
  scorePercent   Decimal?       @db.Decimal(5, 2)
  certificateUrl String?
  completedAt    DateTime       @default(now())

  user           User           @relation(fields: [userId],   references: [id], onDelete: Cascade)
  module         TrainingModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleId])
  @@map("training_completions")
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG  (append-only — no updatedAt)
// ─────────────────────────────────────────────────────────────────────────────

model AuditLog {
  id            String      @id @default(cuid())
  associationId String                               // ★
  actorId       String?
  action        AuditAction
  resourceType  String
  resourceId    String?
  oldValues     Json?
  newValues     Json?
  ipAddress     String?
  userAgent     String?
  traceId       String?
  createdAt     DateTime    @default(now())

  association   Association @relation(fields: [associationId], references: [id], onDelete: Cascade)
  actor         User?       @relation("ActorLogs", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([associationId])
  @@index([actorId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
````

### 5.2 Row-Level Security

```sql
-- Enable RLS on all association-scoped tables
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_receipts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsar_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;

-- Association isolation (same pattern for every scoped table)
CREATE POLICY assoc_isolation ON users
  USING (association_id = current_setting('app.current_association_id', true));

CREATE POLICY assoc_isolation ON meetings
  USING (association_id = current_setting('app.current_association_id', true));

-- Members see only meeting_attendees rows where they are the attendee
-- Admins (secretary+) see all rows within their association
CREATE POLICY member_attendee_self ON meeting_attendees
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) IN (
      'SUPER_ADMIN','PRESIDENT','SECRETARY','DPO'
    )
  );

-- Audit log is INSERT-only for the application DB role
REVOKE UPDATE, DELETE ON audit_logs FROM mfsa_app;
```

### 5.3 Zod Validation Schemas

```typescript
// lib/validations/meetings.ts
import { z } from 'zod';

// Admin assigning members to a meeting
export const AssignAttendeesSchema = z.object({
  attendees: z
    .array(
      z.object({
        userId: z.string().cuid('Invalid member ID'),
        role: z.enum(['REQUIRED', 'OPTIONAL', 'OBSERVER']).default('OPTIONAL'),
      }),
    )
    .min(1, 'At least one member required')
    .max(200, 'Cannot assign more than 200 members at once'),
  sendNotice: z.boolean().default(false), // Immediately email meeting notice
});

// Member submitting RSVP
export const RsvpSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  note: z
    .string()
    .max(300)
    .optional()
    .transform((v) => v?.trim()),
});

// Schedule a new meeting
export const CreateMeetingSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  type: z.enum(['EC_MEETING', 'GENERAL_MEETING']),
  scheduledAt: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), 'Must be in the future'),
  venue: z.string().max(300).optional(),
  agendaItems: z
    .array(
      z.object({
        title: z.string().min(3).max(200).trim(),
        description: z.string().max(500).optional(),
      }),
    )
    .max(20)
    .optional(),
});

// lib/validations/dsar.ts
export const SubmitDsarSchema = z.object({
  requestType: z.enum(['ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY']),
  requestedData: z
    .array(
      z.enum([
        'PROFILE_DATA',
        'PAYMENT_HISTORY',
        'CONSENT_RECORDS',
        'MEETING_ATTENDANCE',
        'TRAINING_RECORDS',
        'ALL',
      ]),
    )
    .min(1)
    .max(6),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v?.trim()),
});

// lib/validations/consent.ts
export const ConsentUpdateSchema = z.object({
  purposes: z
    .array(z.enum(['PAYMENTS', 'COMMUNICATIONS', 'MEETINGS', 'ANALYTICS', 'MARKETING']))
    .min(1),
  action: z.enum(['GRANT', 'REVOKE']),
  channel: z.enum(['web', 'mobile', 'email']).default('web'),
});

// lib/validations/associations.ts
export const CreateAssociationSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(10)
    .toLowerCase()
    .regex(/^[a-z]+$/),
  name: z.string().min(3).max(200),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default('IN'),
  contactEmail: z.string().email().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

// lib/validations/ledger.ts
export const CreateLedgerEntrySchema = z.object({
  description: z.string().min(3).max(500).trim(),
  transactionDate: z.string().datetime(),
  category: z.enum([
    'MEMBERSHIP_FEE',
    'DONATION',
    'EVENT_INCOME',
    'BANK_INTEREST',
    'MEETING_EXPENSE',
    'CONFERENCE_EXPENSE',
    'PICNIC_EXPENSE',
    'RELIEF_EXPENSE',
    'ADMINISTRATIVE_EXPENSE',
    'BANK_CHARGES',
    'MISCELLANEOUS',
  ]),
  lines: z
    .array(
      z
        .object({
          debitAccountId: z.string().cuid().optional(),
          creditAccountId: z.string().cuid().optional(),
          amount: z.number().positive().multipleOf(0.01),
          narration: z.string().max(200).optional(),
        })
        .refine((l) => l.debitAccountId || l.creditAccountId, 'Need debit or credit account'),
    )
    .min(2, 'Double-entry requires at least two lines'),
  paymentId: z.string().cuid().optional(),
});

// lib/validations/members.ts
export const OnboardingSchema = z.object({
  dateOfJoiningGovt: z
    .string()
    .datetime()
    .refine((d) => new Date(d) < new Date(), 'Cannot be in the future'),
  dateOfJoiningAssociation: z
    .string()
    .datetime()
    .refine((d) => new Date(d) < new Date(), 'Cannot be in the future'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid Indian mobile number required'),
  designation: z.string().min(2).max(100).trim(),
});
```

---

## 6. Security-First Constraints

### 6.1 Encryption at Rest

PII fields (`mobile`, `designation`) encrypted with AES-256-GCM before writing to PostgreSQL via Prisma middleware:

```typescript
// lib/prisma/encryption-middleware.ts
import * as crypto from 'crypto';
import { prisma } from './prisma';

const KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex');

export const encrypt = (plain: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
};

export const decrypt = (ciphertext: string): string => {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');
  const enc = Buffer.from(encHex!, 'hex');
  const dec = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(enc), dec.final()]).toString('utf8');
};

const ENCRYPTED_FIELDS: Record<string, string[]> = {
  User: ['mobile', 'designation'],
};

prisma.$use(async (params, next) => {
  const fields = ENCRYPTED_FIELDS[params.model ?? ''];
  if (fields && ['create', 'update', 'upsert'].includes(params.action)) {
    for (const f of fields) {
      if (params.args.data?.[f]) params.args.data[f] = encrypt(params.args.data[f] as string);
    }
  }
  const result = await next(params);
  if (fields && result && typeof result === 'object') {
    for (const f of fields) {
      const r = result as Record<string, unknown>;
      if (r[f]) r[f] = decrypt(r[f] as string);
    }
  }
  return result;
});
```

### 6.2 Association Middleware (Prisma)

Auto-injects `associationId` from `AsyncLocalStorage` into every query — no route handler needs to pass it manually:

```typescript
// lib/prisma/association-middleware.ts
import { AsyncLocalStorage } from 'async_hooks';
import { prisma } from './prisma';

export const associationStore = new AsyncLocalStorage<string>();

const SCOPED = [
  'User',
  'ConsentReceipt',
  'DsarTicket',
  'SubscriptionPlan',
  'Subscription',
  'Payment',
  'Account',
  'LedgerEntry',
  'Meeting',
  'MeetingAttendee',
  'TrainingModule',
  'AuditLog',
];

prisma.$use(async (params, next) => {
  const aid = associationStore.getStore();
  if (!aid || !SCOPED.includes(params.model ?? '')) return next(params);

  if (['create', 'upsert'].includes(params.action)) {
    params.args.data = { ...params.args.data, associationId: aid };
  }
  if (
    [
      'update',
      'updateMany',
      'findMany',
      'findFirst',
      'findFirstOrThrow',
      'count',
      'delete',
      'deleteMany',
    ].includes(params.action)
  ) {
    params.args.where = { ...params.args.where, associationId: aid };
  }
  if (['findUnique', 'findUniqueOrThrow'].includes(params.action)) {
    params.args.where = { ...params.args.where, associationId: aid };
  }

  return next(params);
});
```

### 6.3 DSAR 21-Day SLA — Three-Level Enforcement

1. **DB DEFAULT** — `responseDeadline` set by PostgreSQL itself: `DEFAULT (NOW() + INTERVAL '21 days')` — application code cannot accidentally omit it.
2. **Daily Cron** — `/api/cron/dsar-sla` at 08:00 alerts DPO and assigned handler when `responseDeadline < NOW() + 3 days`.
3. **DPO Dashboard** — Real-time SLA widget: Breached (red) / At Risk < 3 days (amber) / On Track (green).

### 6.4 Meeting Assignment — Security Guarantees

- `POST /api/meetings/[meetingId]/attendees` validates that **every `userId` in the payload belongs to the same association as the meeting** before creating any rows. Cross-association assignment throws `403 FORBIDDEN`.
- The Prisma association middleware also enforces this at the ORM layer.
- Members calling `/api/meetings/my` only receive meetings where a `MeetingAttendee` row exists for their own `userId`.

```typescript
// Validation helper used in the attendees route
export async function assignAttendees(
  meetingId: string,
  associationId: string,
  attendees: Array<{ userId: string; role: AttendeeRole }>,
) {
  // Cross-association protection: count members that belong to THIS association
  const validCount = await prisma.user.count({
    where: {
      id: { in: attendees.map((a) => a.userId) },
      associationId,
      status: 'ACTIVE',
    },
  });

  if (validCount !== attendees.length) {
    throw new ForbiddenError(
      'One or more members do not belong to this association or are not active.',
    );
  }

  // Upsert — idempotent; re-assigning updates the role
  await prisma.$transaction(
    attendees.map((a) =>
      prisma.meetingAttendee.upsert({
        where: { meetingId_userId: { meetingId, userId: a.userId } },
        create: { meetingId, userId: a.userId, attendeeRole: a.role },
        update: { attendeeRole: a.role },
      }),
    ),
  );
}
```

---

## 7. Feature Specifications

### 7.1 Authentication & Onboarding

- Google OAuth + email/password via Clerk
- Clerk webhook `user.created` creates `User` in DB with `associationId` resolved from `x-association-slug`
- Post-signup `/onboarding` collects `dateOfJoiningGovt`, `dateOfJoiningAssociation`, `mobile`, `designation`
- `membershipNumber` auto-generated as `{SLUG}-{YEAR}-{SEQUENCE}` (e.g., `MFSA-2026-0042`)
- Same person can hold membership in both MFSA and MPSA via separate `User` rows — `@@unique([associationId, email])`

### 7.2 Member Dashboard

Shows: subscription status + renewal date, upcoming assigned meetings (next 3 with RSVP badges), pending DSAR tickets, consent preference summary.

---

## 8. Subscription Engine

### 8.1 Plan Management

- Plans are `@@unique([associationId, name])` — each association has its own set of plans
- `effectiveFrom` ensures price increases are forward-only; active subscriptions keep their original plan amount
- `isActive: false` hides plan from new sign-ups; existing subscribers unaffected

### 8.2 Lifecycle

```
ACTIVE ──(end date reached)──► EXPIRED
ACTIVE ──(resignation)───────► CANCELLED
ACTIVE ──(death)─────────────► WAIVED   (waivedReason = "DEATH")
ACTIVE ──(flexible payment)──► ACTIVE   with Payment.status = PENDING
```

### 8.3 Death/Exit Waiver

`POST /api/subscriptions/waive` by secretary/super_admin sets `status = WAIVED`, records reason and actor, and auto-posts a `LedgerEntry` crediting the "Waived Subscriptions" account.

---

## 9. Financial General Ledger

### 9.1 Account Code Structure (per association)

| Code      | Type        | Examples                                                          |
| --------- | ----------- | ----------------------------------------------------------------- |
| 1000–1999 | ASSET       | Cash, Bank Account                                                |
| 2000–2999 | LIABILITY   | Payables, Member Deposits                                         |
| 3000–3999 | EQUITY      | Retained Surplus                                                  |
| 4000–4499 | INCOME      | Subscription, Donation, Event, Bank Interest, Family Contribution |
| 5000–5999 | EXPENDITURE | Meeting, Conference, Picnic, Relief, Admin, Bank Charges, Misc    |

### 9.2 Maker-Checker

Finance officer creates entry (`PENDING`) → President approves → Posted. Rejected entries are retained with reason; deletion blocked via Prisma middleware.

### 9.3 Reports

Cashbook, General Ledger, Member Ledger, Income & Expenditure, Balance Sheet, Member Collection Report.

---

## 10. Meeting & Governance Module

### 10.1 Full Lifecycle

```
SCHEDULED
  │ Admin assigns members (MeetingAttendee rows created)
  │ Admin issues notice → notifications sent to all attendees
  ▼
NOTICE_ISSUED
  │ Members RSVP (ACCEPTED / DECLINED)
  │ Meeting is held; minutes recorded
  ▼
COMPLETED
```

### 10.2 Assigning Members

1. Admin opens `/admin/meetings/[meetingId]/attendees`
2. Searches members within the association by name or designation (fuzzy — `pg_trgm`)
3. Selects members, sets `AttendeeRole` (REQUIRED / OPTIONAL / OBSERVER)
4. Optionally toggles **Send Notice Now** to immediately email invitations
5. `POST /api/meetings/[meetingId]/attendees` — validated with `AssignAttendeesSchema`
6. Prisma upserts `MeetingAttendee` rows; `assignAttendees()` validates association membership first
7. AuditLog entry written: `MEETING_ASSIGN`

### 10.3 Member View

- `/member/meetings` — only shows meetings where the member has a `MeetingAttendee` row
- RSVP badge shown on each card (PENDING / ACCEPTED / DECLINED)
- `POST /api/meetings/[meetingId]/attendees/rsvp` — updates their own `MeetingAttendee` row only
- AuditLog entry: `MEETING_RSVP`

### 10.4 PDF Report Contents

- Association name + meeting type, title, date, venue
- Attendee roster with role and RSVP status
- Agenda items (ordered)
- Recorded decisions per agenda point
- Action items table: assignee name, task, due date

---

## 11. Audit Logging Strategy

### 11.1 Events Logged

| Event                         | `AuditAction`                      | Trigger                      |
| ----------------------------- | ---------------------------------- | ---------------------------- |
| Profile update                | `UPDATE`                           | Prisma middleware            |
| Consent grant/revoke          | `CONSENT_GRANT` / `CONSENT_REVOKE` | Explicit in consent handler  |
| DSAR submitted                | `DSAR_SUBMIT`                      | Prisma middleware            |
| DSAR responded                | `DSAR_RESPOND`                     | Explicit in DSAR handler     |
| Payment recorded              | `PAYMENT_RECORD`                   | Prisma middleware            |
| Ledger entry created/approved | `CREATE` / `UPDATE`                | Prisma middleware            |
| Subscription changed          | `SUBSCRIPTION_CHANGE`              | Prisma middleware            |
| **Meeting member assigned**   | `MEETING_ASSIGN`                   | Explicit in attendee handler |
| **Member RSVP submitted**     | `MEETING_RSVP`                     | Explicit in RSVP handler     |
| Role changed                  | `ROLE_CHANGE`                      | Explicit in role handler     |
| Login / Logout                | `LOGIN` / `LOGOUT`                 | Clerk webhook                |
| User anonymized               | `ANONYMIZE`                        | Cron job                     |

### 11.2 Immutability

- `AuditLog` has no `updatedAt` — Prisma cannot accidentally add one
- Prisma middleware throws on any `update`/`delete` against `AuditLog`
- PostgreSQL: `REVOKE UPDATE, DELETE ON audit_logs FROM mfsa_app`

---

## 12. Environment Configuration (T3 Env)

```typescript
// env.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().startsWith('sk_'),
    CLERK_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    FIELD_ENCRYPTION_KEY: z.string().length(64), // 32-byte hex
    CRON_SECRET: z.string().min(32),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().startsWith('re_').optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/member/dashboard'),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/onboarding'),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_ASSOCIATION_SLUG: z.string().min(2).max(10), // Set per-app build
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ASSOCIATION_SLUG: process.env.NEXT_PUBLIC_ASSOCIATION_SLUG,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

---

## 13. Multi-Association Architecture

### 13.1 Request Scoping Flow

```
Mobile app (MFSA build)
  Header: x-association-slug: mfsa
       │
       ▼
middleware.ts
  resolveAssociationSlug() → "mfsa"
  Sets x-association-slug on forwarded headers
       │
       ▼
Route handler
  withAssociation(req) → Association { id: "clx...", slug: "mfsa" }
  associationStore.run(association.id, handler)
       │
       ▼
Prisma association middleware
  Reads id from AsyncLocalStorage
  WHERE associationId = "clx..." injected on every query
       │
       ▼
PostgreSQL RLS (second layer)
  SET LOCAL app.current_association_id = 'clx...'
  DB refuses cross-association row access
```

### 13.2 Mobile App Configuration

Each mobile build sets `NEXT_PUBLIC_ASSOCIATION_SLUG` at build time and sends `x-association-slug` on every API request. No other code changes are needed to launch a new association app.

### 13.3 Adding a New Association

1. Super admin: `POST /api/associations` → creates `Association` record
2. Seed default plans and chart of accounts for that association
3. Build new mobile binary with the new `slug`, branding colors, and logo
4. Deploy — no schema migrations, no backend changes

---

## 14. Role × Feature Matrix

| Feature                        | member | secretary | finance | dpo | president | super_admin |
| ------------------------------ | :----: | :-------: | :-----: | :-: | :-------: | :---------: |
| View own profile               |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| Edit own profile               |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| Manage own consent             |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| File DSAR                      |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| View own assigned meetings     |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| RSVP to meeting                |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| View own payments              |   ✓    |     ✓     |    ✓    |  ✓  |     ✓     |      ✓      |
| Manage own subscription        |   ✓    |     —     |    —    |  —  |     —     |      ✓      |
| View all members (own assoc.)  |   —    |     ✓     |    —    |  ✓  |     ✓     |      ✓      |
| Invite / manage members        |   —    |     ✓     |    —    |  —  |     ✓     |      ✓      |
| **Assign members to meetings** |   —    |     ✓     |    —    |  —  |     ✓     |      ✓      |
| Schedule meetings              |   —    |     ✓     |    —    |  —  |     ✓     |      ✓      |
| Issue meeting notice           |   —    |     ✓     |    —    |  —  |     ✓     |      ✓      |
| Record meeting minutes         |   —    |     ✓     |    —    |  —  |     ✓     |      ✓      |
| Generate meeting PDF           |   —    |     ✓     |    —    |  —  |     ✓     |      ✓      |
| Process DSAR tickets           |   —    |     ✓     |    —    |  ✓  |     —     |      ✓      |
| View consent audit             |   —    |     —     |    —    |  ✓  |     —     |      ✓      |
| Record payments                |   —    |     —     |    ✓    |  —  |     —     |      ✓      |
| Post ledger entries            |   —    |     —     |    ✓    |  —  |     —     |      ✓      |
| Approve ledger entries         |   —    |     —     |    —    |  —  |     ✓     |      ✓      |
| View financial reports         |   —    |     —     |    ✓    |  —  |     ✓     |      ✓      |
| View compliance results        |   —    |     —     |    —    |  ✓  |     ✓     |      ✓      |
| View audit logs                |   —    |     —     |    —    |  ✓  |     ✓     |      ✓      |
| Waive subscriptions            |   —    |     ✓     |    —    |  —  |     —     |      ✓      |
| **Manage associations**        |   —    |     —     |    —    |  —  |     —     |      ✓      |
| Manage subscription plans      |   —    |     —     |    —    |  —  |     —     |      ✓      |

---

_MFSA Connect Technical PRD v2.0.0 — 2026-05-07_
_Multi-Association · DPDP Act 2023 Compliant · Security-First_
