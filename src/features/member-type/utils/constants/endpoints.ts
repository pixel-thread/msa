export const memberTypeEndpoints = {
  base: '/member-types' as const,
  byId: (id: string) => `/member-types/${id}`,
} as const;
