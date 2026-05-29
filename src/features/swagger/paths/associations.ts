export const associationPaths = {
  '/associations': {
    get: {
      tags: ['Associations'],
      summary: 'Get all associations',
      description: 'Retrieve a list of all associations',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of associations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/associations/{associationId}/members': {
    post: {
      tags: ['Associations'],
      summary: 'Add member to association',
      description: 'Add an existing user as a member to the association (PRESIDENT only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'associationId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the association',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['memberId'],
              properties: {
                memberId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'ID of the user to add',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Member added to association',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'array', items: { type: 'string' } },
                  status: { type: 'string' },
                  membershipNumber: { type: 'string' },
                  associationId: { type: 'string' },
                },
              },
            },
          },
        },
        '404': { description: 'Member not found' },
        '409': { description: 'Member already in this association' },
      },
    },
  },
};
