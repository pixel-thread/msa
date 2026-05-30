export const meetingsEndpoints = {
  base: '/meetings' as const,
  list: (page: number = 1) => `/meetings?page=${page}`,
  byId: (id: string) => `/meetings/${id}`,
  rsvp: (id: string) => `/meetings/${id}/rsvp`,
  attendees: {
    base: (meetingId: string) => `/meetings/${meetingId}/attendees`,
    byId: (meetingId: string, userId: string) =>
      `/meetings/${meetingId}/attendees/${userId}`,
  },
  minutes: {
    base: (meetingId: string) => `/meetings/${meetingId}/minutes`,
    byId: (meetingId: string, minuteId: string) =>
      `/meetings/${meetingId}/minutes/${minuteId}`,
  },
} as const;
