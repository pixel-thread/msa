export const trainingEndpoints = {
  base: '/training/modules' as const,
  byId: (id: string) => `/training/modules/${id}`,
  supplements: {
    list: (moduleId: string, page?: number) =>
      `/training/modules/${moduleId}/supplements?page=${page ?? 1}`,
    byId: (moduleId: string, supplementId: string) =>
      `/training/modules/${moduleId}/supplements/${supplementId}`,
  },
  assignments: {
    base: (moduleId: string, page?: number) =>
      `/training/modules/${moduleId}/assign?page=${page ?? 1}`,
  },
  assignedUsers: {
    list: (moduleId: string, page?: number) =>
      `/training/modules/${moduleId}/assigned-users?page=${page}`,
    complete: (moduleId: string, userId: string) =>
      `/training/modules/${moduleId}/assignments/${userId}/complete`,
  },
  completions: {
    byId: (id: string) => `training/modules/${id}/complete`,
    all: () => '/training/completions' as const,
  },
  certificates: {
    list: (moduleId: string) => `/training/modules/${moduleId}/certificates`,
    byId: (moduleId: string, certificateId: string) =>
      `/training/modules/${moduleId}/certificates/${certificateId}`,
    template: (moduleId: string) =>
      `/training/modules/${moduleId}/certificate-template`,
  },
} as const;
