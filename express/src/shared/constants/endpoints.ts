export const sharedEndpoints = {
  auth: {
    mfaDisable: '/auth/mfa/disable',
    mfaSetup: '/auth/mfa/setup',
    mfaResend: '/auth/mfa/resend',
    mfaVerify: '/auth/mfa/verify',
    me: '/auth/me',
  },
} as const;
