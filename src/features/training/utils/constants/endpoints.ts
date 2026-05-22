export const trainingEndpoints = {
  base: "/training/modules" as const,
  byId: (id: string) => `/training/modules/${id}`,
  supplements: {
    list: (moduleId: string) => `/training/modules/${moduleId}/supplements`,
    byId: (moduleId: string, supplementId: string) =>
      `/training/modules/${moduleId}/supplements/${supplementId}`,
  },
  assignments: {
    base: (moduleId: string) => `/training/modules/${moduleId}/assign`,
  },
  assignedUsers: {
    list: (moduleId: string) => `/training/modules/${moduleId}/assigned-users`,
    complete: (moduleId: string, userId: string) =>
      `/training/modules/${moduleId}/assignments/${userId}/complete`,
  },
  completions: {
    byId: (id: string) => `training/modules/${id}/complete`,
    all: () => "/training/completions" as const,
  },
} as const;
