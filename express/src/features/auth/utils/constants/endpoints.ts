// ---- Auth Endpoints ----

export const authEndpoints = {
  signIn: '/auth/sign-in',
  signInResendMfa: '/auth/sign-in/resend',
  signInVerifyMfa: '/auth/sign-in/verify',
  signUp: '/auth/sign-up',

  mfaDisable: '/auth/mfa/disable',
  mfaSetup: '/auth/mfa/setup',
  mfaResend: '/auth/mfa/resend',
  mfaVerify: '/auth/mfa/verify',

  logout: '/auth/logout',

  refresh: '/auth/refresh',

  changePassword: '/auth/change-password',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  me: '/auth/me',
};
