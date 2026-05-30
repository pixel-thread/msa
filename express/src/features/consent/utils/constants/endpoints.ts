// ---- Consent endpoint path constants

/** Endpoint path constants for the consent feature. */
export const consentEndpoints = {
  all: '/consent/all' as const,
  report: '/consent/report' as const,
  userHistory: (userId: string) => `/consent/users/${userId}`,
  byId: (id: string) => `/consent/${id}`,
} as const;
