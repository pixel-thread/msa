export const notificationPaths = {
  '/notifications/register': {
    post: {
      tags: ['Notifications'],
      summary: 'Register push token',
      description: 'Register a push notification token for the user',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: {
                  type: 'string',
                  description: 'Push notification token',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Push token registered',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  token: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        '400': { description: 'Missing token' },
      },
    },
  },
  '/notifications/link': {
    post: {
      tags: ['Notifications'],
      summary: 'Link notification token to user',
      description: 'Link a push token to the authenticated user',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: {
                  type: 'string',
                  description: 'Push notification token',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Token linked to user' },
      },
    },
  },
  '/notifications/{notificationId}': {
    patch: {
      tags: ['Notifications'],
      summary: 'Update notification status',
      description: 'Mark a notification as read/unread',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'notificationId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the notification',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isRead: { type: 'boolean' },
                readAt: { type: 'string', format: 'date-time' },
                isRecived: { type: 'boolean' },
                recivedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Notification updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  isRead: { type: 'boolean' },
                  readAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        '404': { description: 'Notification not found' },
      },
    },
  },
};
