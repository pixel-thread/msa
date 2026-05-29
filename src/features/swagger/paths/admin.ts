export const adminPaths = {
  '/admin/associations': {
    get: {
      tags: ['Admin'],
      summary: 'Get all associations',
      description: 'Admin endpoint to list all associations',
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
          description: 'List of associations',
        },
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create an association',
      description: 'Admin endpoint to create a new association',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'slug'],
              properties: {
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Association created',
        },
      },
    },
  },
  '/admin/associations/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'Get association by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Association details',
        },
      },
    },
    patch: {
      tags: ['Admin'],
      summary: 'Update an association',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Association updated',
        },
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete an association',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': {
          description: 'Association deleted',
        },
      },
    },
  },
  '/admin/associations/{id}/member': {
    post: {
      tags: ['Admin'],
      summary: 'Add member to association (admin)',
      description: 'Move a user to a different association (SUPER_ADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the target association',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['user_id', 'association_id'],
              properties: {
                user_id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'ID of the user to move',
                },
                association_id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'ID of the target association',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'User association changed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  role: { type: 'array', items: { type: 'string' } },
                  associationId: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        '404': { description: 'User or association not found' },
        '409': { description: 'User already under the target association' },
      },
    },
  },
};
