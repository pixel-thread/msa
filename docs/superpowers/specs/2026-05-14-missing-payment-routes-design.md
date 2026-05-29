# Design Spec: Missing Payment Routes

**Status:** DRAFT
**Created:** 2026-05-14
**PRD Reference:** .agents/prd/features/subscription-feature.md

## 1. Overview

This spec covers the implementation of missing payment-related API routes to complete the "Full Admin & Reporting" scope. These routes provide administration capabilities for finance officers and detailed transaction visibility for members.

## 2. API Endpoints

### 2.1 GET /api/payments (Admin List)

List all payment transactions with filtering and pagination.

- **Role:** FINANCE, SECRETARY, PRESIDENT, SUPER_ADMIN
- **Query Parameters:**
  - `userId`: (Optional) Filter by specific user
  - `status`: (Optional) Filter by PaymentStatus enum
  - `method`: (Optional) Filter by PaymentMethod enum
  - `gateway`: (Optional) Filter by PaymentGateway enum
  - `search`: (Optional) String search on referenceNumber, receiptNumber, or notes
  - `startDate`: (Optional) ISO Date string
  - `endDate`: (Optional) ISO Date string
  - `page`: Default 1
  - `pageSize`: Default 20
- **Response:** Paginated list of transactions including user profile info.

### 2.2 GET /api/payments/[id] (Transaction Detail)

Retrieve a single transaction with its allocations and metadata.

- **Role:** Owner (MEMBER) or FINANCE+
- **Response:** Full transaction object with `user`, `allocations` (including period details), and `ledgerEntries`.

### 2.3 GET /api/payments/[id]/receipt (Receipt Data)

Retrieve formatted data for receipt generation.

- **Role:** Owner (MEMBER) or FINANCE+
- **Response:** Object containing `receiptNumber`, `paidAt`, `memberInfo`, `associationInfo`, `amount`, `paymentMethod`, and `appliedTo` (breakdown of which months were paid).

### 2.4 GET /api/payments/stats (Financial Dashboard)

Summary statistics for the association's financial health.

- **Role:** FINANCE+
- **Response:**
  - `totalCollected`: Current month vs total.
  - `pendingDuesCount`: Number of members with dues.
  - `pendingDuesAmount`: Total sum of all outstanding `dueAmount`.
  - `methodBreakdown`: Distribution across Cash, Online, etc.

### 2.5 GET /api/payments/reports/collections (Collection Report)

Flattened data optimized for reporting and export.

- **Role:** FINANCE+
- **Query Parameters:** `year`, `month`, `status`.
- **Response:** Array of records mapping payments to members and specific contribution periods.

## 3. Implementation Details

### 3.1 Services

- Extend `payment.service.ts` with:
  - `getAllTransactions`
  - `getTransactionById`
  - `getFinancialStats`
- Extend `contribution.service.ts` for reporting logic.

### 3.2 Security

- Use `withAssociation` for multi-tenant scoping.
- Use `withRole` for RBAC enforcement.
- Ensure `GET /api/payments/[id]` verifies `userId` matches if caller is only a MEMBER.

### 3.3 Validation

- Create `GetTransactionsQuerySchema` in `validators/index.ts`.
- Create `CollectionReportQuerySchema`.

## 4. Success Criteria

1. Finance officers can see all payments in the system.
2. Members can view details and "receipt info" for their specific payments.
3. Dashboard shows accurate financial health (pending vs collected).
