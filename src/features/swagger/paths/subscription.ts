export const subscriptionPaths = {
  "/subscriptions/plan": {
    get: {
      tags: ["Subscriptions"],
      summary: "Get membership plan",
      description: "Get the current membership plan for the association",
      responses: {
        "200": {
          description: "Membership plan details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  plan: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      amount: { type: "number" },
                      currency: { type: "string" },
                      billingCycle: { type: "string" },
                      description: { type: "string" },
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
      tags: ["Subscriptions"],
      summary: "Set membership plan",
      description: "Create or update the membership plan (admin only)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amount"],
              properties: {
                amount: { type: "number" },
                description: { type: "string" },
                billingCycle: { type: "string", enum: ["ONE_TIME", "YEARLY"] },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Membership plan created",
        },
        "200": {
          description: "Membership plan updated",
        },
      },
    },
  },
  "/subscriptions/pay": {
    post: {
      tags: ["Subscriptions"],
      summary: "Pay membership fee",
      description: "Process payment for membership fee",
      security: [{ bearerAuth: [] }],
      responses: {
        "201": {
          description: "Payment successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  message: { type: "string" },
                  payment: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      amount: { type: "number" },
                      currency: { type: "string" },
                      receiptNumber: { type: "string" },
                      paymentDate: { type: "string", format: "date-time" },
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
  "/subscriptions/me": {
    get: {
      tags: ["Subscriptions"],
      summary: "Get my subscription status",
      description: "Get current user's subscription/payment status",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Subscription status",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  hasPaid: { type: "boolean" },
                  plan: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      amount: { type: "number" },
                      currency: { type: "string" },
                      billingCycle: { type: "string" },
                    },
                  },
                  lastPayment: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      receiptNumber: { type: "string" },
                      amount: { type: "number" },
                      paymentDate: { type: "string", format: "date-time" },
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
  "/subscriptions/all": {
    get: {
      tags: ["Subscriptions"],
      summary: "Get all membership payments",
      description: "Admin endpoint to view all membership payments",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "List of all payments",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  payments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number" },
                        status: { type: "string" },
                        receiptNumber: { type: "string" },
                        user: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            email: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalCollected: { type: "number" },
                      totalMembers: { type: "number" },
                      paidMembers: { type: "number" },
                      pendingMembers: { type: "number" },
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