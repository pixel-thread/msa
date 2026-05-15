export const authEndpoints = {
  signIn: '/auth/sign-in',
  signInVerify: '/auth/sign-in/verify',
  signUp: '/auth/sign-up',
  resendSignInVerifyCode: '/auth/sign-in/resend',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  signOut: '/auth/logout',
  changePassword: '/auth/change-password',
} as const;

export const associationEndpoints = {
  list: '/associations',
  get: (id: string) => `/associations/${id}`,
  create: '/associations',
  update: (id: string) => `/associations/${id}`,
  deactivate: (id: string) => `/associations/${id}/deactivate`,
} as const;

export const memberEndpoints = {
  list: '/members',
  get: (id: string) => `/members/${id}`,
  create: '/members',
  update: (id: string) => `/members/${id}`,
  suspend: (id: string) => `/members/${id}/suspend`,
  ledger: (id: string) => `/members/${id}/ledger`,
  onboarding: '/members/onboarding',
} as const;

export const meetingEndpoints = {
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

export const paymentEndpoints = {
  get: (id: string) => `/payments/${id}`,
  receipt: (id: string) => `/payments/${id}/receipt`,
  my: '/payments/my',
  stats: '/payments/stats',
  collectionsReport: '/payments/reports/collections',
} as const;

export const subscriptionEndpoints = {
  list: '/subscriptions/plans',
  get: (id: string) => `/subscriptions/plans/${id}`,
  my: '/subscriptions/my',
  payments: (id: string) => `/subscriptions/${id}/payments`,
} as const;

export const ledgerEndpoints = {
  entries: '/ledger/entries',
  approve: (id: string) => `/ledger/entries/${id}/approve`,
  summary: '/ledger/summary',
  accounts: '/ledger/accounts',
  member: (memberId: string) => `/ledger/member/${memberId}`,
} as const;

export const consentEndpoints = {
  grant: '/consent/grant',
  revoke: '/consent/revoke',
  my: '/consent/my',
  history: '/consent/history',
  report: '/consent/report',
  all: '/consent/all',
} as const;

export const dsarEndpoints = {
  my: (ticketId: string) => `/dsar/my/${ticketId}`,
} as const;

export const auditLogEndpoints = {
  list: '/audit-logs',
} as const;

export const complianceEndpoints = {
  checks: '/compliance/checks',
  evidence: '/compliance/evidence',
} as const;

export const announcementEndpoints = {
  get: (id: string) => `/announcement/${id}`,
} as const;

export const trainingEndpoints = {
  modules: '/training/modules',
  getModule: (id: string) => `/training/modules/${id}`,
  complete: (id: string) => `/training/modules/${id}/complete`,
  myCompletions: '/training/my-completions',
  completions: '/training/completions',
} as const;

export const apiEndpoints = {
  auth: authEndpoints,
  associations: associationEndpoints,
  members: memberEndpoints,
  meetings: meetingEndpoints,
  payments: paymentEndpoints,
  subscriptions: subscriptionEndpoints,
  ledger: ledgerEndpoints,
  consent: consentEndpoints,
  dsar: dsarEndpoints,
  auditLogs: auditLogEndpoints,
  compliance: complianceEndpoints,
  announcements: announcementEndpoints,
  training: trainingEndpoints,
} as const;