export const paymentPaths = {
  '/payments/history': {
    get: {
      tags: ['Payments'],
      summary: 'Get user payment history',
      description: "Get the authenticated user's payment history with contribution allocations",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'pageSize',
          in: 'query',
          schema: { type: 'integer', default: 20 },
        },
      ],
      responses: {
        '200': {
          description: 'Payment history with summary',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  transactions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        amount: { type: 'number' },
                        type: { type: 'string' },
                        status: { type: 'string' },
                        receiptNumber: { type: 'string' },
                        paymentDate: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  summary: {
                    type: 'object',
                    properties: {
                      totalPaid: { type: 'number' },
                      pendingAmount: { type: 'number' },
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
  '/payments/order': {
    post: {
      tags: ['Payments'],
      summary: 'Create payment order',
      description: "Create a Razorpay order for a user's payment",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount'],
              properties: {
                amount: { type: 'number', description: 'Amount in INR' },
                notes: { type: 'string', description: 'Payment notes' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Order created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                  receipt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/payments/contributions': {
    post: {
      tags: ['Payments'],
      summary: 'Generate monthly contributions',
      description:
        'Generate monthly contribution period rows for all active members (FINANCE role required)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['year', 'month'],
              properties: {
                year: { type: 'integer', description: 'Year (e.g., 2024)' },
                month: { type: 'integer', description: 'Month (1-12)' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Contributions generated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  generated: { type: 'integer' },
                  markedOverdue: { type: 'integer' },
                },
              },
            },
          },
        },
        '403': { description: 'Unauthorized - FINANCE role required' },
      },
    },
    patch: {
      tags: ['Payments'],
      summary: 'Waive contribution',
      description: 'Waive a contribution period for a member (FINANCE role required)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['contributionPeriodId', 'reason'],
              properties: {
                contributionPeriodId: { type: 'string', format: 'uuid' },
                reason: { type: 'string', description: 'Reason for waiving' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Contribution waived',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  waivedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        '403': { description: 'Unauthorized - FINANCE role required' },
        '404': { description: 'Contribution period not found' },
      },
    },
  },
  '/payments/verify': {
    post: {
      tags: ['Payments'],
      summary: 'Verify payment',
      description: 'Verify a payment with Razorpay signature',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature'],
              properties: {
                razorpayOrderId: { type: 'string' },
                razorpayPaymentId: { type: 'string' },
                razorpaySignature: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Payment verified successfully' },
        '400': { description: 'Invalid signature' },
      },
    },
  },
  '/payments/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Razorpay webhook',
      description: 'Handle Razorpay webhook events',
      security: [],
      responses: {
        '200': { description: 'Webhook processed' },
      },
    },
  },
};
