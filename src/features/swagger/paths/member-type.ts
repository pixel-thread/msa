export const memberTypePaths = {
  '/member-types': {
    get: {
      tags: ['Member Types'],
      summary: 'List all member types',
      description: 'Retrieve all member types for the association',
      responses: {
        '200': {
          description: 'List of member types',
        },
      },
    },
    post: {
      tags: ['Member Types'],
      summary: 'Create a member type',
      description: 'Create a new member type (requires PRESIDENT role)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['description', 'level'],
              properties: {
                description: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 255,
                  description: 'Description of the member type',
                },
                level: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Level/hierarchy of the member type',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Member type created',
        },
      },
    },
  },
  '/member-types/{memberTypeId}': {
    get: {
      tags: ['Member Types'],
      summary: 'Get a member type by ID',
      description: 'Retrieve a specific member type',
      parameters: [
        {
          name: 'memberTypeId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Member type details',
        },
      },
    },
    patch: {
      tags: ['Member Types'],
      summary: 'Update a member type',
      description: 'Update a member type (requires PRESIDENT role)',
      parameters: [
        {
          name: 'memberTypeId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 255,
                },
                level: {
                  type: 'integer',
                  minimum: 1,
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Member type updated',
        },
      },
    },
    delete: {
      tags: ['Member Types'],
      summary: 'Delete a member type',
      description: 'Delete a member type (requires PRESIDENT role)',
      parameters: [
        {
          name: 'memberTypeId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Member type deleted',
        },
      },
    },
  },
};
