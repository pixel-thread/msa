export const announcementPaths = {
  '/announcements': {
    get: {
      tags: ['Announcements'],
      summary: 'Get all announcements',
      description: 'Retrieve announcements for an association with pagination and filters',
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'],
          },
        },
        {
          name: 'priority',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
          },
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
        },
      ],
      responses: {
        '200': {
          description: 'List of announcements',
        },
      },
    },
    post: {
      tags: ['Announcements'],
      summary: 'Create an announcement',
      description: 'Create a new announcement (requires SUPER_ADMIN, PRESIDENT, or SECRETARY role)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
                summary: { type: 'string', maxLength: 500 },
                content: { type: 'string', minLength: 1 },
                imageUrl: { type: 'string', format: 'uri' },
                status: {
                  type: 'string',
                  enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'],
                  default: 'DRAFT',
                },
                priority: {
                  type: 'string',
                  enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
                  default: 'NORMAL',
                },
                targetRoles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY', 'FINANCE', 'DPO', 'MEMBER'],
                  },
                  default: [],
                },
                isPinned: { type: 'boolean', default: false },
                publishedAt: { type: 'string', format: 'date-time' },
                expiresAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Announcement created',
        },
      },
    },
  },
  '/announcements/{announcementId}': {
    get: {
      tags: ['Announcements'],
      summary: 'Get an announcement by ID',
      parameters: [
        {
          name: 'announcementId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Announcement details',
        },
      },
    },
    put: {
      tags: ['Announcements'],
      summary: 'Update an announcement',
      description: 'Update an announcement (author only)',
      parameters: [
        {
          name: 'announcementId',
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
                title: { type: 'string', minLength: 1, maxLength: 200 },
                summary: { type: 'string', maxLength: 500 },
                content: { type: 'string', minLength: 1 },
                imageUrl: { type: 'string', format: 'uri', nullable: true },
                status: {
                  type: 'string',
                  enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'],
                },
                priority: {
                  type: 'string',
                  enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
                },
                targetRoles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY', 'FINANCE', 'DPO', 'MEMBER'],
                  },
                },
                isPinned: { type: 'boolean' },
                publishedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                expiresAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Announcement updated',
        },
      },
    },
    delete: {
      tags: ['Announcements'],
      summary: 'Delete an announcement',
      description: 'Delete an announcement (author only)',
      parameters: [
        {
          name: 'announcementId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Announcement deleted',
        },
      },
    },
  },
  '/announcements/{announcementId}/publish': {
    patch: {
      tags: ['Announcements'],
      summary: 'Publish an announcement',
      description: 'Publish a draft announcement (author only)',
      parameters: [
        {
          name: 'announcementId',
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
                action: {
                  type: 'string',
                  enum: ['publish', 'archive', 'unpublish'],
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Announcement status updated',
        },
      },
    },
  },
};
