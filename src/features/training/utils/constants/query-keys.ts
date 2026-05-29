export const trainingQueryKeys = {
  modules: {
    all: (page?: number) => ['training-modules', page] as const,
    list: (page?: number, isActive?: boolean) => ['training-modules', page, isActive] as const,
    detail: (id: string | null) => ['training-module', id] as const,
  },
  supplements: {
    all: (moduleId: string | null, page?: number) =>
      ['training-supplements', moduleId, page] as const,
  },
  assignments: {
    all: (moduleId: string | null, page?: number) =>
      ['training-assignments', moduleId, page] as const,
  },
  assignedUsers: {
    all: (moduleId: string | null, page?: number) =>
      ['module-assigned-users', moduleId, page] as const,
    base: ['module-assigned-users'] as const,
  },
  completions: {
    admin: ['admin-training-completions'] as const,
    adminList: (page?: number) => ['admin-training-completions', page] as const,
    my: ['my-training-completions'] as const,
    byModule: (moduleId: string | null, page?: number) =>
      ['training-completions', moduleId, page] as const,
  },
  certificates: {
    all: (moduleId: string | null) => ['training-certificates', moduleId] as const,
  },
} as const;
