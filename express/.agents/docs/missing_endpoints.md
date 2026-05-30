Missing API Endpoints

2. Subscription Management
   Route
   /api/subscriptions/my
   /api/subscriptions/plans/[planId]
   /api/subscriptions/plans/[planId]
   /api/subscriptions/[subscriptionId]/payments

---

3. Payments & Finance
   Route Method
   /api/payments/my GET

---

4. Ledger (All Missing — No Implementation)
   Route Method
   /api/ledger/entries GET
   /api/ledger/entries POST
   /api/ledger/entries/[entryId]/approve POST
   /api/ledger/accounts GET
   /api/ledger/accounts POST
   /api/ledger/summary GET
   /api/ledger/member/[memberId] GET

---

5. Meetings & Governance
   Route Method
   /api/meetings/my GET
   /api/meetings/[meetingId] PATCH
   /api/meetings/[meetingId]/cancel POST
   /api/meetings/[meetingId]/notice POST
   /api/meetings/[meetingId]/attendees/bulk POST
   /api/meetings/[meetingId]/report GET
   /api/meetings/[meetingId]/agenda/[itemId] PATCH
   /api/meetings/[meetingId]/agenda/[itemId] DELETE

---

6. DSAR
   Route Method
   /api/dsar/my/[ticketId] GET

---

Summary

- Total Missing: 24 API endpoints
- Largest Gap: Ledger module (7 endpoints) — completely unimplemented
- High Priority: Subscription management and meetings have significant gaps
