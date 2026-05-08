# API Documentation

This document describes all the API routes available in the MFSA application.

## Base URL
`/api`

## Swagger / OpenAPI
- **OpenAPI Spec (JSON):** `/api/docs`
- **Swagger UI:** `/api/docs/ui`

---

## Health
### `GET /health`
Returns the health status of the API.
- **Tags:** Health
- **Summary:** Health check
- **Responses:**
  - `200`: API is healthy.

---

## Admin (Associations)
### `GET /admin/associations`
Admin endpoint to list all associations.
- **Tags:** Admin
- **Summary:** Get all associations
- **Parameters:**
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Results per page (default: 20)
- **Responses:**
  - `200`: List of associations.

### `POST /admin/associations`
Admin endpoint to create a new association.
- **Tags:** Admin
- **Summary:** Create an association
- **Request Body:** `name`, `slug`, `description`
- **Responses:**
  - `201`: Association created.

### `GET /admin/associations/{id}`
Get detailed information about an association.
- **Tags:** Admin
- **Summary:** Get association by ID
- **Parameters:**
  - `id` (path): Association ID
- **Responses:**
  - `200`: Association details.

### `PATCH /admin/associations/{id}`
Update association details.
- **Tags:** Admin
- **Summary:** Update an association
- **Parameters:**
  - `id` (path): Association ID
- **Request Body:** `name`, `description`, `status`
- **Responses:**
  - `200`: Association updated.

### `DELETE /admin/associations/{id}`
Delete an association.
- **Tags:** Admin
- **Summary:** Delete an association
- **Parameters:**
  - `id` (path): Association ID
- **Responses:**
  - `204`: Association deleted.

---

## User Profile
### `GET /me`
Returns the currently authenticated user's profile information.
- **Summary:** Get current user
- **Security:** Requires Clerk Authentication
- **Responses:**
  - `200`: User profile fetched successfully.
  - `401`: Unauthorized.

---

## Associations
### `GET /associations`
List all associations the current user is a member of.
- **Summary:** List associations
- **Security:** Requires MEMBER role
- **Responses:**
  - `200`: List of associations.

### `POST /associations/{associationId}/members`
Add a member to a specific association.
- **Summary:** Add member to association
- **Security:** Requires PRESIDENT or SUPER_ADMIN role
- **Parameters:**
  - `associationId` (path): ID of the association
- **Request Body:** `memberId`
- **Responses:**
  - `201`: Member added successfully.

---

## Members
### `GET /members`
List all members in the user's current association.
- **Tags:** Members
- **Summary:** Get all members
- **Security:** Requires Bearer Auth
- **Parameters:**
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Results per page (default: 20)
- **Responses:**
  - `200`: List of members.

### `GET /members/{memberId}`
Get detailed information about a specific member.
- **Tags:** Members
- **Summary:** Get member details
- **Security:** Requires Bearer Auth
- **Parameters:**
  - `memberId` (path): ID of the member
- **Responses:**
  - `200`: Member details.
  - `404`: Member not found.

---

## Meetings
### `GET /meetings`
Retrieve meetings for the user's association.
- **Tags:** Meetings
- **Summary:** Get all meetings
- **Parameters:**
  - `type` (query, optional): ANNUAL, GENERAL, EXTRAORDINARY, COMMITTEE
  - `status` (query, optional): SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Results per page (default: 20)
- **Responses:**
  - `200`: List of meetings.

### `POST /meetings`
Create a new meeting.
- **Tags:** Meetings
- **Summary:** Create a meeting
- **Security:** Requires SECRETARY, PRESIDENT, or SUPER_ADMIN role
- **Request Body:** `title`, `type`, `scheduledAt`, `venue`, `agendaItems`
- **Responses:**
  - `201`: Meeting created.

### `GET /meetings/{meetingId}`
Get details of a specific meeting.
- **Tags:** Meetings
- **Summary:** Get a meeting by ID
- **Parameters:**
  - `meetingId` (path): ID of the meeting
- **Responses:**
  - `200`: Meeting details.

### `PATCH /meetings/{meetingId}`
Update meeting details.
- **Tags:** Meetings
- **Summary:** Update a meeting
- **Parameters:**
  - `meetingId` (path): ID of the meeting
- **Request Body:** `title`, `type`, `scheduledAt`, `venue`, `status`
- **Responses:**
  - `200`: Meeting updated.

### `DELETE /meetings/{meetingId}`
Delete a meeting.
- **Tags:** Meetings
- **Summary:** Delete a meeting
- **Parameters:**
  - `meetingId` (path): ID of the meeting
- **Responses:**
  - `204`: Meeting deleted.

### `PATCH /meetings/{meetingId}/rsvp`
Update joining status for a meeting.
- **Summary:** Update RSVP
- **Security:** Requires MEMBER role. Users can update their own RSVP. Admin roles can update any attendee.
- **Parameters:**
  - `meetingId` (path): ID of the meeting
- **Request Body:** RSVP details (status, checkInTime)
- **Responses:**
  - `200`: RSVP updated successfully.

---

## Meeting Attendees
### `GET /meetings/{meetingId}/attendees`
List all attendees for a specific meeting.
- **Tags:** Attendees
- **Summary:** Get meeting attendees
- **Parameters:**
  - `meetingId` (path): ID of the meeting
- **Responses:**
  - `200`: List of attendees.

### `POST /meetings/{meetingId}/attendees`
Add an attendee to a meeting.
- **Tags:** Attendees
- **Summary:** Add attendee to meeting
- **Parameters:**
  - `meetingId` (path): ID of the meeting
- **Request Body:** `userId`, `role`
- **Responses:**
  - `201`: Attendee added.

### `GET /meetings/{meetingId}/attendees/{userId}`
Get attendee details for a specific user in a meeting.
- **Tags:** Attendees
- **Summary:** Get attendee by user ID
- **Parameters:**
  - `meetingId` (path): ID of the meeting
  - `userId` (path): ID of the user
- **Responses:**
  - `200`: Attendee details.

### `PATCH /meetings/{meetingId}/attendees/{userId}`
Update attendee status (e.g., check-in).
- **Tags:** Attendees
- **Summary:** Update attendee
- **Parameters:**
  - `meetingId` (path): ID of the meeting
  - `userId` (path): ID of the user
- **Request Body:** `status`, `checkInTime`
- **Responses:**
  - `200`: Attendee updated.

### `DELETE /meetings/{meetingId}/attendees/{userId}`
Remove an attendee from a meeting.
- **Tags:** Attendees
- **Summary:** Remove attendee from meeting
- **Parameters:**
  - `meetingId` (path): ID of the meeting
  - `userId` (path): ID of the user
- **Responses:**
  - `204`: Attendee removed.

---

## Subscriptions
### `GET /subscriptions/plan`
Get the current membership plan for the association.
- **Tags:** Subscriptions
- **Summary:** Get membership plan
- **Responses:**
  - `200`: Membership plan details.

### `POST /subscriptions/plan`
Create or update the membership plan for the association.
- **Tags:** Subscriptions
- **Summary:** Set membership plan
- **Security:** Requires Admin privileges
- **Request Body:** `amount`, `description`, `billingCycle`
- **Responses:**
  - `201`: Membership plan created.
  - `200`: Membership plan updated.

### `POST /subscriptions/pay`
Process payment for membership fee.
- **Tags:** Subscriptions
- **Summary:** Pay membership fee
- **Security:** Requires Bearer Auth
- **Responses:**
  - `201`: Payment successful.

### `GET /subscriptions/me`
Get current user's subscription/payment status.
- **Tags:** Subscriptions
- **Summary:** Get my subscription status
- **Security:** Requires Bearer Auth
- **Responses:**
  - `200`: Subscription status.

### `GET /subscriptions/all`
View all membership payments in the association.
- **Tags:** Subscriptions
- **Summary:** Get all membership payments
- **Security:** Requires Admin privileges
- **Responses:**
  - `200`: List of all payments and collection summary.
