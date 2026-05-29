export const healthPath = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns the health status of the API',
      responses: {
        '200': {
          description: 'API is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};
