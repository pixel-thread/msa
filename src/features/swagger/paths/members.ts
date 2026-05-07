export const memberPaths = {
  "/members": {
    get: {
      tags: ["Members"],
      summary: "Get all members",
      description: "Get all members in the current association",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
        },
      ],
      responses: {
        "200": {
          description: "List of members",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  members: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string" },
                        status: { type: "string" },
                        membershipNumber: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      total: { type: "integer" },
                      totalPages: { type: "integer" },
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
  "/members/{memberId}": {
    get: {
      tags: ["Members"],
      summary: "Get member details",
      description: "Get detailed information about a specific member",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "memberId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the member",
        },
      ],
      responses: {
        "200": {
          description: "Member details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  member: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                      role: { type: "string" },
                      status: { type: "string" },
                      membershipNumber: { type: "string" },
                      designation: { type: "string" },
                      mobile: { type: "string" },
                      dateOfJoiningGovt: { type: "string", format: "date-time" },
                      dateOfJoiningMfsa: { type: "string", format: "date-time" },
                      createdAt: { type: "string", format: "date-time" },
                      hasPaid: { type: "boolean" },
                      lastPaymentDate: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        "404": {
          description: "Member not found",
        },
      },
    },
  },
};