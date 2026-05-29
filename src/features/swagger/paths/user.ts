export const userPaths = {
  '/user': {
    post: {
      tags: ['User'],
      summary: 'Update user profile',
      description: "Update the current user's profile information",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'mobile'],
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  description: 'Full name',
                },
                mobile: {
                  type: 'number',
                  description: 'Mobile number (10 digits)',
                },
                designation: {
                  type: 'string',
                  description: 'Designation/job title',
                },
                dateOfJoiningGovt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Date of joining government service',
                },
                dateOfJoiningAssociation: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Date of joining MFSA',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'User profile updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  mobile: { type: 'number' },
                  designation: { type: 'string' },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
