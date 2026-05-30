// ---------------------------------------------------------------------------
// Constants — API endpoint builders for member-related routes
// ---------------------------------------------------------------------------
export const membersEndpoints = {
  list: (page: number = 1, status: string = 'ACTIVE') => `/members?page=${page}&status=${status}`,
  byId: (id: string) => `/members/${id}`,
  status: (id: string) => `/members/${id}/status`,
  role: (id: string) => `/members/${id}/role`,
  types: '/member-types' as const,
  applications: {
    approve: (id: string) => `/admin/membership-applications/${id}/approve`,
    reject: (id: string) => `/admin/membership-applications/${id}/reject`,
  },
} as const;
