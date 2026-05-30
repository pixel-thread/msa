export const EXPO_ROUTES = {
  MEETINGS: {
    MEETING_DETAIL: (id: string) => `/meetings/${id}`,
    MEETING: '/meetings',
  },
  ANNOUNCEMENTS: {
    DETAIL: (id: string) => `/announcements/${id}`,
    LIST: '/announcements',
  },
};
