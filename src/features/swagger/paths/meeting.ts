export const meetingPaths = {
  '/meetings': {
    get: {
      tags: ['Meetings'],
      summary: 'Get all meetings',
      description: 'Retrieve meetings for an association with pagination',
      parameters: [
        {
          name: 'type',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['ANNUAL', 'GENERAL', 'EXTRAORDINARY', 'COMMITTEE'],
          },
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          },
        },
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
          description: 'List of meetings',
        },
      },
    },
    post: {
      tags: ['Meetings'],
      summary: 'Create a meeting',
      description: 'Create a new meeting (requires SECRETARY, PRESIDENT, or SUPER_ADMIN role)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'type', 'scheduledAt', 'agendaItems'],
              properties: {
                title: { type: 'string', minLength: 3 },
                type: {
                  type: 'string',
                  enum: ['ANNUAL', 'GENERAL', 'EXTRAORDINARY', 'COMMITTEE'],
                },
                scheduledAt: { type: 'string', format: 'date-time' },
                venue: { type: 'string', maxLength: 500 },
                agendaItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      duration: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Meeting created',
        },
      },
    },
  },
  '/meetings/{meetingId}': {
    get: {
      tags: ['Meetings'],
      summary: 'Get a meeting by ID',
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
          description: 'Meeting details',
        },
      },
    },
    patch: {
      tags: ['Meetings'],
      summary: 'Update a meeting',
      parameters: [
        {
          name: 'meetingId',
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
                title: { type: 'string' },
                type: { type: 'string' },
                scheduledAt: { type: 'string', format: 'date-time' },
                venue: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Meeting updated',
        },
      },
    },
    delete: {
      tags: ['Meetings'],
      summary: 'Delete a meeting',
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': {
          description: 'Meeting deleted',
        },
      },
    },
  },

  '/meetings/{meetingId}/rsvp': {
    patch: {
      tags: ['Meetings'],
      summary: 'Update RSVP status',
      description: "Update user's own RSVP status for a meeting",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the meeting',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['CONFIRMED', 'DECLINED', 'PENDING'],
                  description: 'RSVP status',
                },
                checkInTime: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'RSVP updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  checkInTime: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        '403': { description: 'You can only update your own RSVP' },
      },
    },
    delete: {
      tags: ['Meetings'],
      summary: 'Remove attendee from meeting',
      description: 'Remove an attendee from a meeting (SECRETARY, PRESIDENT, or SUPER_ADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the meeting',
        },
      ],
      responses: {
        '200': {
          description: 'Attendee removed successfully',
        },
        '403': {
          description: 'Only secretary, president, or super admin can remove attendees',
        },
      },
    },
  },
  '/meetings/{meetingId}/agenda': {
    get: {
      tags: ['Meetings'],
      summary: 'Get meeting agenda',
      description: 'Retrieve the agenda items for a meeting',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID of the meeting',
        },
      ],
      responses: {
        '200': {
          description: 'Meeting agenda',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    duration: { type: 'integer' },
                    order: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    patch: {
      tags: ['Meetings'],
      summary: 'Update meeting agenda',
      description: 'Add, remove, or reorder agenda items (SECRETARY role or higher required)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID of the meeting',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                operations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      action: {
                        type: 'string',
                        enum: ['ADD', 'REMOVE', 'REORDER'],
                      },
                      itemId: { type: 'string' },
                      title: { type: 'string' },
                      duration: { type: 'integer' },
                      order: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Agenda updated successfully',
        },
        '403': { description: 'Unauthorized - SECRETARY role required' },
      },
    },
  },
  '/meetings/{meetingId}/minutes': {
    get: {
      tags: ['Meetings'],
      summary: 'Get meeting minutes',
      description: 'Retrieve meeting minutes for a specific meeting',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the meeting',
        },
      ],
      responses: {
        '200': {
          description: 'Meeting minutes',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    content: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Meetings'],
      summary: 'Create meeting minute',
      description: 'Create a new meeting minute (SECRETARY role or higher required)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the meeting',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['content'],
              properties: {
                content: { type: 'string', description: 'Minute content' },
                decision: { type: 'string', description: 'Decisions made' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Meeting minute recorded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        '403': { description: 'Unauthorized - SECRETARY role required' },
      },
    },
  },
  '/meetings/{meetingId}/minutes/{minutesId}': {
    patch: {
      tags: ['Meetings'],
      summary: 'Update meeting minute',
      description: 'Update a meeting minute (SECRETARY role or higher required)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the meeting',
        },
        {
          name: 'minutesId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the minute',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                decision: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Meeting minute updated',
        },
        '403': { description: 'Unauthorized - SECRETARY role required' },
      },
    },
    delete: {
      tags: ['Meetings'],
      summary: 'Delete meeting minute',
      description: 'Delete a meeting minute (SECRETARY role or higher required)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'meetingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the meeting',
        },
        {
          name: 'minutesId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the minute',
        },
      ],
      responses: {
        '200': {
          description: 'Meeting minute deleted',
        },
        '403': { description: 'Unauthorized - SECRETARY role required' },
      },
    },
  },
};
