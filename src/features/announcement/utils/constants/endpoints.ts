export const announcementEndpoints = {
  base: '/announcements' as const,
  list: (page: number = 1, status?: string) =>
    `/announcements?page=${page}${status ? `&status=${status}` : ''}`,
  byId: (id: string) => `/announcements/${id}`,
  upload: (id: string) => `/announcements/${id}/upload`,
  read: (id: string) => `/announcements/${id}/read`,
} as const;
