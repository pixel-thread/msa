export const subscriptionPaths = {
  '/subscriptions/plans': {
    get: {
      tags: ['Subscriptions'],
      summary: 'Get active subscription plans',
      description: 'Retrieve all active subscription plans for the association',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of active plans',
        },
      },
    },
    post: {
      tags: ['Subscriptions'],
      summary: 'Create a subscription plan',
      description: 'Create a new subscription plan (Admin/President only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'amount'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string', default: 'INR' },
                billingCycle: {
                  type: 'string',
                  enum: ['MONTHLY', 'YEARLY'],
                  default: 'YEARLY',
                },
                features: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Plan created' },
        '403': { description: 'Unauthorized' },
      },
    },
  },
  '/subscriptions/subscribe': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Subscribe to a plan',
      description: 'Allows a member to subscribe to a specific plan',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['planId'],
              properties: {
                planId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Subscribed successfully' },
        '404': { description: 'Plan not found' },
        '409': { description: 'User already has an active subscription' },
      },
    },
  },
  '/subscriptions/waive': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Waive a subscription',
      description: "Admin endpoint to waive a user's subscription",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['subscriptionId', 'reason'],
              properties: {
                subscriptionId: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Subscription waived' },
        '403': { description: 'Unauthorized' },
        '404': { description: 'Subscription not found' },
      },
    },
  },
  '/payments/record': {
    post: {
      tags: ['Payments'],
      summary: 'Record a payment',
      description: 'Record a manual payment and generate ledger entries (Finance/Admin only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'amount', 'method', 'type'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                subscriptionId: { type: 'string', format: 'uuid' },
                amount: { type: 'number' },
                method: {
                  type: 'string',
                  enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'ONLINE'],
                },
                type: {
                  type: 'string',
                  enum: [
                    'SUBSCRIPTION',
                    'DONATION',
                    'EVENT_FEE',
                    'BANK_INTEREST',
                    'FAMILY_CONTRIBUTION',
                  ],
                },
                notes: { type: 'string' },
                receiptNumber: { type: 'string' },
                razorpayOrderId: { type: 'string' },
                razorpayPaymentId: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Payment recorded and ledger updated' },
        '403': { description: 'Unauthorized' },
      },
    },
  },
  '/subscriptions/plan': {
    get: {
      tags: ['Subscriptions'],
      summary: 'Get membership plan',
      description: 'Get the current membership plan for the association',
      responses: {
        '200': {
          description: 'Membership plan details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  plan: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                      billingCycle: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Subscriptions'],
      summary: 'Set membership plan',
      description: 'Create or update the membership plan (admin only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount'],
              properties: {
                amount: { type: 'number' },
                description: { type: 'string' },
                billingCycle: { type: 'string', enum: ['ONE_TIME', 'YEARLY'] },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Membership plan created',
        },
        '200': {
          description: 'Membership plan updated',
        },
      },
    },
  },
  '/subscriptions/pay': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Pay membership fee',
      description: 'Process payment for membership fee',
      security: [{ bearerAuth: [] }],
      responses: {
        '201': {
          description: 'Payment successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  message: { type: 'string' },
                  payment: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                      receiptNumber: { type: 'string' },
                      paymentDate: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/subscriptions/me': {
    get: {
      tags: ['Subscriptions'],
      summary: 'Get my subscription status',
      description: "Get current user's subscription/payment status",
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Subscription status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  hasPaid: { type: 'boolean' },
                  plan: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                      billingCycle: { type: 'string' },
                    },
                  },
                  lastPayment: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      receiptNumber: { type: 'string' },
                      amount: { type: 'number' },
                      paymentDate: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/subscriptions/all': {
    get: {
      tags: ['Subscriptions'],
      summary: 'Get all membership payments',
      description: 'Admin endpoint to view all membership payments',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of all payments',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        amount: { type: 'number' },
                        status: { type: 'string' },
                        receiptNumber: { type: 'string' },
                        user: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            email: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  summary: {
                    type: 'object',
                    properties: {
                      totalCollected: { type: 'number' },
                      totalMembers: { type: 'number' },
                      paidMembers: { type: 'number' },
                      pendingMembers: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
