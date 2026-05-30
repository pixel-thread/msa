export const dsarEndpoints = {
  base: '/dsar' as const,
  byId: (id: string) => `/dsar/${id}`,
  respond: (id: string) => `/dsar/${id}/respond`,
  reject: (id: string) => `/dsar/${id}/reject`,
  assign: (id: string) => `/dsar/${id}/assign`,
  slaReport: '/dsar/sla-report' as const,
} as const;
