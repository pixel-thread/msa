/** Expo deep-link routing paths used for push notifications. */
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
