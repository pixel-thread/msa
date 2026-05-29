export const SHARED_ENDPOINTS = {
  AUTH: {
    MFA_DISABLE: '/auth/mfa/disable',
    MFA_SETUP: '/auth/mfa/setup',
    MFA_RESEND: '/auth/mfa/resend',
    MFA_VERIFY: '/auth/mfa/verify',
    ME: '/auth/me',
  },
} as const;
