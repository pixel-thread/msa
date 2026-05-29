export const authPaths = {
  '/auth/sign-up': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Create a new user account with email and password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address',
                },
                password: {
                  type: 'string',
                  minLength: 8,
                  description: 'Password (min 8 chars, 1 uppercase, 1 number, 1 special)',
                },
                name: { type: 'string', description: 'Full name' },
                associationId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Association ID (optional)',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  data: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          role: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': { description: 'Invalid input or weak password' },
        '409': { description: 'User already exists' },
      },
    },
  },
  '/auth/sign-in': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign in to an existing account',
      description: 'Authenticate with email and password. Returns tokens or MFA required response.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Signed in successfully',
          headers: {
            'Set-Cookie': {
              schema: { type: 'string' },
              description: 'access_token and refresh_token cookies',
            },
          },
        },
        '401': { description: 'Invalid credentials' },
        '423': { description: 'Account locked' },
        '400': {
          description: 'MFA verification required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mfaRequired: { type: 'boolean' },
                  tempToken: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/auth/sign-in/verify': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify MFA code and complete sign in',
      description: "Verify the 6-digit MFA code sent to user's email",
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  minLength: 6,
                  maxLength: 6,
                  description: '6-digit MFA code',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Signed in successfully' },
        '400': { description: 'Session expired' },
        '401': { description: 'Invalid or expired verification code' },
        '429': { description: 'Too many attempts' },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description:
        'Use refresh token to get a new access token. Automatically rotates the refresh token.',
      security: [],
      responses: {
        '200': { description: 'Token refreshed successfully' },
        '401': { description: 'Invalid or expired refresh token' },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign out',
      description: 'Invalidate the refresh token and clear auth cookies',
      responses: {
        '200': { description: 'Logged out successfully' },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user',
      description: 'Returns the profile of the currently authenticated user',
      responses: {
        '200': {
          description: 'User profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  mfaEnabled: { type: 'boolean' },
                  associationId: { type: 'string' },
                },
              },
            },
          },
        },
        '401': { description: 'Authentication required' },
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset',
      description: "Send a password reset email to the user's registered email address",
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'If account exists, reset email will be sent' },
      },
    },
  },
  '/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password with token',
      description: 'Reset the password using the token from the reset email',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'password'],
              properties: {
                token: {
                  type: 'string',
                  description: 'Reset token from email',
                },
                password: {
                  type: 'string',
                  minLength: 8,
                  description: 'New password',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Password reset successfully' },
        '400': { description: 'Invalid or expired reset token' },
      },
    },
  },
  '/auth/change-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Change password (authenticated)',
      description: "Change the current user's password. Requires authentication.",
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  description: 'Current password',
                },
                newPassword: {
                  type: 'string',
                  minLength: 8,
                  description: 'New password',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Password changed successfully' },
        '400': { description: 'Invalid new password' },
        '401': { description: 'Current password is incorrect' },
      },
    },
  },
  '/auth/mfa/setup': {
    post: {
      tags: ['MFA'],
      summary: 'Start MFA setup',
      description:
        'Initiate MFA setup by verifying password and sending verification code to email',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password'],
              properties: {
                password: {
                  type: 'string',
                  description: 'Current password to verify',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Verification code sent to email' },
        '400': { description: 'MFA already enabled or password not set' },
        '401': { description: 'Invalid password' },
      },
    },
  },
  '/auth/mfa/verify': {
    post: {
      tags: ['MFA'],
      summary: 'Verify and enable MFA',
      description: 'Verify the 6-digit code to enable MFA for the account',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: { type: 'string', minLength: 6, maxLength: 6 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'MFA enabled successfully' },
        '401': { description: 'Invalid or expired verification code' },
        '429': { description: 'Too many attempts' },
      },
    },
  },
  '/auth/mfa/disable': {
    post: {
      tags: ['MFA'],
      summary: 'Disable MFA',
      description: 'Disable MFA for the account (requires password)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password'],
              properties: {
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'MFA disabled successfully' },
        '400': { description: 'MFA not enabled' },
        '401': { description: 'Invalid password' },
      },
    },
  },
  '/auth/mfa/resend': {
    post: {
      tags: ['MFA'],
      summary: 'Resend MFA verification code',
      description: 'Resend the 6-digit MFA verification code (60 second cooldown)',
      responses: {
        '200': { description: 'Verification code sent' },
        '429': { description: 'Please wait before requesting another code' },
      },
    },
  },
  '/auth/sign-in/resend': {
    post: {
      tags: ['Authentication'],
      summary: 'Resend MFA code during sign-in',
      description:
        'Resend the 6-digit MFA verification code during the sign-in flow (60 second cooldown)',
      security: [],
      responses: {
        '200': {
          description: 'Verification code sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  data: {
                    type: 'object',
                    properties: {
                      codeSent: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': { description: 'Session expired. Please sign-in again' },
        '429': { description: 'Please wait before requesting another code' },
      },
    },
  },
};
