export const membershipApplicationEndpoints = {
  base: '/admin/membership-applications' as const,
  approve: (id: string) => `/admin/membership-applications/${id}/approve`,
  reject: (id: string) => `/admin/membership-applications/${id}/reject`,
} as const;
