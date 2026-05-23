export const AUTH_ENDPOINTS = {
  signIn: '/auth/sign-in',
  signInVerify: '/auth/sign-in/verify',
  signUp: '/auth/sign-up',
  resendSignInVerifyCode: '/auth/sign-in/resend',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  signOut: '/auth/logout',
  changePassword: '/auth/change-password',
} as const;

export const ASSOCIATION_ENDPOINTS = {
  list: '/associations',
  get: (id: string) => `/associations/${id}`,
  create: '/associations',
  update: (id: string) => `/associations/${id}`,
  deactivate: (id: string) => `/associations/${id}/deactivate`,
} as const;

export const MEMBER_ENDPOINTS = {
  list: '/members',
  get: (id: string) => `/members/${id}`,
  create: '/members',
  update: (id: string) => `/members/${id}`,
  suspend: (id: string) => `/members/${id}/suspend`,
  ledger: (id: string) => `/members/${id}/ledger`,
  onboarding: '/members/onboarding',
} as const;

export const MEETING_ENDPOINTS = {
  list: '/meetings',
  get: (id: string) => `/meetings/${id}`,
  create: '/meetings',
  update: (id: string) => `/meetings/${id}`,
  attendees: (id: string) => `/meetings/${id}/attendees`,
  agenda: (id: string) => `/meetings/${id}/agenda`,
  agendaItem: (meetingId: string, itemId: string) =>
    `/meetings/${meetingId}/agenda/${itemId}`,
  notice: (id: string) => `/meetings/${id}/notice`,
  cancel: (id: string) => `/meetings/${id}/cancel`,
  report: (id: string) => `/meetings/${id}/report`,
  rsvp: (id: string) => `/meetings/${id}/attendees/rsvp`,
  bulk: (id: string) => `/meetings/${id}/attendees/bulk`,
  my: '/meetings/my',
} as const;

export const PAYMENT_ENDPOINTS = {
  get: (id: string) => `/payments/${id}`,
  receipt: (id: string) => `/payments/${id}/receipt`,
  my: '/payments/my',
  stats: '/payments/stats',
  collectionsReport: '/payments/reports/collections',
} as const;

export const SUBSCRIPTION_ENDPOINTS = {
  list: '/subscriptions/plans',
  get: (id: string) => `/subscriptions/plans/${id}`,
  my: '/subscriptions/my',
  payments: (id: string) => `/subscriptions/${id}/payments`,
} as const;

export const LEDGER_ENDPOINTS = {
  entries: '/ledger/entries',
  approve: (id: string) => `/ledger/entries/${id}/approve`,
  summary: '/ledger/summary',
  accounts: '/ledger/accounts',
  member: (memberId: string) => `/ledger/member/${memberId}`,
} as const;

export const CONSENT_ENDPOINTS = {
  grant: '/consent/grant',
  revoke: '/consent/revoke',
  my: '/consent/my',
  history: '/consent/history',
  report: '/consent/report',
  all: '/consent/all',
} as const;

export const DSAR_ENDPOINTS = {
  my: (ticketId: string) => `/dsar/my/${ticketId}`,
} as const;

export const AUDIT_LOG_ENDPOINTS = {
  list: '/audit-logs',
} as const;

export const COMPLIANCE_ENDPOINTS = {
  checks: '/compliance/checks',
  evidence: '/compliance/evidence',
} as const;

export const ANNOUNCEMENT_ENDPOINTS = {
  get: (id: string) => `/announcement/${id}`,
} as const;

export const TRAINING_ENDPOINTS = {
  modules: '/training/modules',
  getModule: (id: string) => `/training/modules/${id}`,
  complete: (id: string) => `/training/modules/${id}/complete`,
  myCompletions: '/training/my-completions',
  completions: '/training/completions',
  assignedUsers: (id: string) => `/training/modules/${id}/assigned-users`,
  completeAssignment: (moduleId: string, userId: string) =>
    `/training/modules/${moduleId}/assignments/${userId}/complete`,
} as const;

export const API_ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
  associations: ASSOCIATION_ENDPOINTS,
  members: MEMBER_ENDPOINTS,
  meetings: MEETING_ENDPOINTS,
  payments: PAYMENT_ENDPOINTS,
  subscriptions: SUBSCRIPTION_ENDPOINTS,
  ledger: LEDGER_ENDPOINTS,
  consent: CONSENT_ENDPOINTS,
  dsar: DSAR_ENDPOINTS,
  auditLogs: AUDIT_LOG_ENDPOINTS,
  compliance: COMPLIANCE_ENDPOINTS,
  announcements: ANNOUNCEMENT_ENDPOINTS,
  training: TRAINING_ENDPOINTS,
} as const;