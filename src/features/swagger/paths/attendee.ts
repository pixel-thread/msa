export const attendeePaths = {
  '/meetings/{meetingId}/attendees': {
    get: {
      tags: ['Attendees'],
      summary: 'Get meeting attendees',
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'List of attendees',
        },
      },
    },
    post: {
      tags: ['Attendees'],
      summary: 'Add attendee to meeting',
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Attendee added',
        },
      },
    },
  },
  '/meetings/{meetingId}/attendees/{userId}': {
    get: {
      tags: ['Attendees'],
      summary: 'Get attendee by user ID',
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Attendee details',
        },
      },
    },
    patch: {
      tags: ['Attendees'],
      summary: 'Update attendee',
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
        {
          name: 'userId',
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
                status: { type: 'string' },
                checkInTime: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Attendee updated',
        },
      },
    },
    delete: {
      tags: ['Attendees'],
      summary: 'Remove attendee from meeting',
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': {
          description: 'Attendee removed',
        },
      },
    },
  },
};
