export const associationsEndpoints = {
  current: '/associations/current' as const,
  base: '/associations' as const,
  admin: '/admin/associations' as const,
  byId: (id: string) => `/associations/${id}`,
  deactivate: (id: string) => `/associations/${id}/deactivate`,
  logo: (id: string) => `/associations/${id}/logo`,
} as const;
