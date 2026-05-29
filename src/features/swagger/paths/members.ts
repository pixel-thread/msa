export const memberPaths = {
  '/members': {
    get: {
      tags: ['Members'],
      summary: 'Get all members',
      description: 'Get all members in the current association',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20 },
        },
      ],
      responses: {
        '200': {
          description: 'List of members',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  members: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        status: { type: 'string' },
                        membershipNumber: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' },
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
  '/members/{memberId}': {
    get: {
      tags: ['Members'],
      summary: 'Get member details',
      description: 'Get detailed information about a specific member',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID of the member',
        },
      ],
      responses: {
        '200': {
          description: 'Member details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  member: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' },
                      status: { type: 'string' },
                      membershipNumber: { type: 'string' },
                      designation: { type: 'string' },
                      mobile: { type: 'string' },
                      dateOfJoiningGovt: {
                        type: 'string',
                        format: 'date-time',
                      },
                      dateOfJoiningAssociation: {
                        type: 'string',
                        format: 'date-time',
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                      hasPaid: { type: 'boolean' },
                      lastPaymentDate: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '404': {
          description: 'Member not found',
        },
      },
    },
  },
  '/members/{memberId}/role': {
    post: {
      tags: ['Members'],
      summary: 'Add role to member',
      description: 'Add a role to a member (PRESIDENT only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the member',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY', 'FINANCE', 'DPO', 'MEMBER'],
                  description: 'Role to add to the member',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Role added successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  role: { type: 'array', items: { type: 'string' } },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        '404': { description: 'User does not exist in the association' },
        '409': { description: 'User already has the role' },
      },
    },
    put: {
      tags: ['Members'],
      summary: 'Remove role from member',
      description: 'Remove a role from a member (PRESIDENT only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the member',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY', 'FINANCE', 'DPO', 'MEMBER'],
                  description: 'Role to remove from the member',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Role removed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  role: { type: 'array', items: { type: 'string' } },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        '404': { description: 'User does not exist in the association' },
        '409': { description: 'User does not have the role' },
      },
    },
  },
  '/members/{memberId}/status': {
    patch: {
      tags: ['Members'],
      summary: 'Update member status',
      description: "Update a member's status (PRESIDENT only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the member',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'],
                  description: 'New status for the member',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        '404': { description: 'User does not exist in the association' },
      },
    },
  },
};
