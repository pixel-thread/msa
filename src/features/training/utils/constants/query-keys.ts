export const trainingQueryKeys = {
  modules: {
    all: ["training-modules"] as const,
    list: (page?: number, isActive?: boolean) =>
      ["training-modules", page, isActive] as const,
    detail: (id: string | null) => ["training-module", id] as const,
  },
  supplements: {
    all: (moduleId: string | null) =>
      ["training-supplements", moduleId] as const,
  },
  assignments: {
    all: (moduleId: string | null) =>
      ["training-assignments", moduleId] as const,
  },
  assignedUsers: {
    all: (moduleId: string | null) =>
      ["module-assigned-users", moduleId] as const,
    base: ["module-assigned-users"] as const,
  },
  completions: {
    admin: ["admin-training-completions"] as const,
    my: ["my-training-completions"] as const,
    byModule: (moduleId: string | null) =>
      ["training-completions", moduleId] as const,
  },
} as const;
