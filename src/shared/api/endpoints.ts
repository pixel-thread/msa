export const API_BASE = "/api/v1";

export const endpoints = {
  products: {
    list: `${API_BASE}/products`,
    get: (productId: string) => `${API_BASE}/products/${productId}`,
    featured: `${API_BASE}/products/featured`,
  },
  dineIn: {
    list: `/dine-in`,
  },
  orders: {
    list: `${API_BASE}/orders`,
    create: `${API_BASE}/orders`,
    get: (orderId: string) => `${API_BASE}/orders/${orderId}`,
    feedback: (orderId: string) => `${API_BASE}/orders/${orderId}/feedback`,
  },
  admin: {
    products: {
      list: `${API_BASE}/admin/products`,
      get: (productId: string) => `${API_BASE}/admin/products/${productId}`,
    },
    orders: {
      list: `${API_BASE}/admin/orders`,
      get: (orderId: string) => `${API_BASE}/admin/orders/${orderId}`,
    },
    analytics: {
      revenue: `${API_BASE}/admin/analytics/revenue`,
    },
  },
  auth: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    signOut: "/auth/logout",
    me: "/auth/me",
    refresh: "/auth/refresh",
    changePassword: "/auth/change-password",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyMfa: "/auth/sign-in/verify",
    resendMfa: "/auth/mfa/resend-login",
    setupMfa: "/auth/mfa/setup",
    enableMfa: "/auth/mfa/verify",
    disableMfa: "/auth/mfa/disable",
  },
  pusher: {
    auth: `${API_BASE}/pusher/auth`,
  },
  consent: {
    my: `/api/consent/my`,
    grant: `/api/consent/grant`,
    revoke: `/api/consent/revoke`,
    history: `/api/consent/history`,
    all: `/api/consent/all`,
    report: `/api/consent/report`,
  },
  webhooks: {
    clerk: `${API_BASE}/webhooks/clerk`,
  },
} as const;

export type Endpoints = typeof endpoints;
