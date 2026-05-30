// ---------------------------------------------------------------------------
// Payment Endpoint Constants — shared route path helpers
// ---------------------------------------------------------------------------

export const paymentEndpoints = {
  base: '/payments' as const,
  byId: (id: string) => `/payments/${id}`,
  contributions: '/payments/contributions' as const,
  contributionById: (id: string) => `/payments/contributions/${id}`,
  providers: '/payments/providers' as const,
  providerById: (id: string) => `/payments/providers/${id}`,
  activateProvider: (id: string) => `/payments/providers/${id}/activate`,
  testVerify: (id: string) => `/payments/providers/${id}/test/verify`,
  userPayments: (userId: string, page: number = 1) => `/payments/users/${userId}?page=${page}`,
  userContributions: (userId: string) => `/payments/users/${userId}/contributions`,
  memberSearch: (query: string) => `/members?search=${encodeURIComponent(query)}`,
} as const;
