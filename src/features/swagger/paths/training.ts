export const trainingPaths = {
  '/training/modules': {
    get: {
      tags: ['Training'],
      summary: 'List training modules',
      description: 'Retrieve training modules for an association with pagination',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
      ],
      responses: {
        '200': {
          description: 'List of training modules',
        },
      },
    },
    post: {
      tags: ['Training'],
      summary: 'Create a training module',
      description: 'Create a new training module (requires DPO or higher role)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', minLength: 3, maxLength: 200 },
                description: { type: 'string', maxLength: 1000 },
                content: { type: 'string', minLength: 1 },
                durationMinutes: { type: 'integer' },
                requiredForRoles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY', 'FINANCE', 'DPO', 'MEMBER'],
                  },
                },
                isActive: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Training module created',
        },
      },
    },
  },
  '/training/modules/{moduleId}': {
    get: {
      tags: ['Training'],
      summary: 'Get a training module by ID',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Training module details',
        },
      },
    },
    patch: {
      tags: ['Training'],
      summary: 'Update a training module',
      description: 'Update a training module (requires DPO or higher role)',
      parameters: [
        {
          name: 'moduleId',
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
                title: { type: 'string', minLength: 3, maxLength: 200 },
                description: { type: 'string', maxLength: 1000 },
                content: { type: 'string' },
                durationMinutes: { type: 'integer' },
                requiredForRoles: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY', 'FINANCE', 'DPO', 'MEMBER'],
                  },
                },
                isActive: { type: 'boolean' },
                version: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Training module updated',
        },
      },
    },
  },
  '/training/modules/{moduleId}/complete': {
    post: {
      tags: ['Training'],
      summary: 'Self-report completion',
      description: 'User self-reports completion for a training module',
      parameters: [
        {
          name: 'moduleId',
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
                certificateUrl: { type: 'string', format: 'uri' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Completion recorded',
        },
      },
    },
  },
  '/training/modules/{moduleId}/assign': {
    get: {
      tags: ['Training'],
      summary: 'List module assignments',
      description: 'List all training assignments for a module',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'List of assignments',
        },
      },
    },
    post: {
      tags: ['Training'],
      summary: 'Assign a user to a module',
      description: 'Assign a single user to a training module (requires DPO or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
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
                userId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'User assigned',
        },
      },
    },
    put: {
      tags: ['Training'],
      summary: 'Bulk assign users',
      description: 'Bulk assign users to a training module (requires DPO or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userIds'],
              properties: {
                userIds: {
                  type: 'array',
                  items: { type: 'string', format: 'uuid' },
                  minItems: 1,
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Users assigned',
        },
      },
    },
    delete: {
      tags: ['Training'],
      summary: 'Remove user assignment',
      description: "Remove a single user's assignment (requires DPO or higher)",
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
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
                userId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Assignment removed',
        },
      },
    },
    patch: {
      tags: ['Training'],
      summary: 'Bulk remove assignments',
      description: 'Bulk remove user assignments (requires DPO or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userIds'],
              properties: {
                userIds: {
                  type: 'array',
                  items: { type: 'string', format: 'uuid' },
                  minItems: 1,
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Assignments removed',
        },
      },
    },
  },
  '/training/modules/{moduleId}/assigned-users': {
    get: {
      tags: ['Training'],
      summary: 'List assigned users with completion status',
      description:
        'Get all assigned users for a module with their completion status (requires SECRETARY or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'List of assigned users',
        },
      },
    },
  },
  '/training/modules/{moduleId}/assignments/{userId}/complete': {
    post: {
      tags: ['Training'],
      summary: 'Admin mark assignment as complete',
      description: "Admin marks a user's assignment as complete (requires SECRETARY or higher)",
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'userId',
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
                scorePercent: { type: 'number', minimum: 0, maximum: 100 },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Assignment completed',
        },
      },
    },
  },
  '/training/modules/{moduleId}/supplements': {
    get: {
      tags: ['Training'],
      summary: 'List training supplements',
      description: 'List all supplements for a training module',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'List of supplements',
        },
      },
    },
    post: {
      tags: ['Training'],
      summary: 'Create a training supplement',
      description:
        'Add a supplement to a training module (requires DPO or higher). Accepts multipart/form-data with a file and a metadata JSON string.',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file', 'metadata'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The supplement file (PDF, video, image, etc.)',
                },
                metadata: {
                  type: 'string',
                  description: 'JSON string containing supplement metadata',
                  schema: {
                    type: 'object',
                    required: ['title', 'type'],
                    properties: {
                      title: { type: 'string', minLength: 3, maxLength: 200 },
                      description: { type: 'string', maxLength: 1000 },
                      type: {
                        type: 'string',
                        enum: ['PDF', 'VIDEO', 'IMAGE', 'LINK'],
                      },
                      thumbnailUrl: { type: 'string', format: 'uri' },
                      sortOrder: { type: 'integer', default: 0 },
                      isActive: { type: 'boolean', default: true },
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
          description: 'Supplement created',
        },
      },
    },
  },
  '/training/modules/{moduleId}/supplements/{supplementId}': {
    get: {
      tags: ['Training'],
      summary: 'Get a training supplement by ID',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'supplementId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Supplement details',
        },
      },
    },
    patch: {
      tags: ['Training'],
      summary: 'Update a training supplement',
      description:
        'Update a supplement (requires DPO or higher). Accepts multipart/form-data with an optional file and a required metadata JSON string.',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'supplementId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Optional new supplement file to replace the existing one',
                },
                metadata: {
                  type: 'string',
                  description: 'JSON string containing supplement metadata fields to update',
                  schema: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', minLength: 3, maxLength: 200 },
                      description: { type: 'string', maxLength: 1000 },
                      type: {
                        type: 'string',
                        enum: ['PDF', 'VIDEO', 'IMAGE', 'LINK'],
                      },
                      thumbnailUrl: { type: 'string', format: 'uri' },
                      sortOrder: { type: 'integer' },
                      isActive: { type: 'boolean' },
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
          description: 'Supplement updated',
        },
      },
    },
    delete: {
      tags: ['Training'],
      summary: 'Delete a training supplement',
      description:
        'Delete a supplement and its associated file from storage (requires DPO or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'supplementId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Supplement deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
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
  '/training/completions': {
    get: {
      tags: ['Training'],
      summary: 'List all completions',
      description:
        'Retrieve all training completions with optional filters (requires SECRETARY or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'userId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
      ],
      responses: {
        '200': {
          description: 'List of completions',
        },
      },
    },
    post: {
      tags: ['Training'],
      summary: 'Admin record completion',
      description: 'Admin records a completion for a user (requires SECRETARY or higher)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'moduleId'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                moduleId: { type: 'string', format: 'uuid' },
                scorePercent: { type: 'number', minimum: 0, maximum: 100 },
                certificateUrl: { type: 'string', format: 'uri' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Completion recorded',
        },
      },
    },
  },
  '/training/modules/{moduleId}/certificates': {
    get: {
      tags: ['Training'],
      summary: 'List training certificates',
      description: 'List all certificates for a training module',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'List of certificates',
        },
      },
    },
    post: {
      tags: ['Training'],
      summary: 'Create a training certificate',
      description:
        'Upload a certificate for a user on a training module (requires DPO or higher). Accepts multipart/form-data with a file and a metadata JSON string.',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file', 'metadata'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The certificate file (PDF, image, etc.)',
                },
                metadata: {
                  type: 'string',
                  description: 'JSON string containing certificate metadata',
                  schema: {
                    type: 'object',
                    required: ['userId'],
                    properties: {
                      userId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'User to issue the certificate to',
                      },
                      certificateNumber: {
                        type: 'string',
                        description: 'Optional certificate number',
                      },
                      issuedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Issue date (defaults to now)',
                      },
                      thumbnailUrl: {
                        type: 'string',
                        format: 'uri',
                        description: 'Optional thumbnail URL',
                      },
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
          description: 'Certificate created',
        },
      },
    },
  },
  '/training/modules/{moduleId}/certificates/{certificateId}': {
    get: {
      tags: ['Training'],
      summary: 'Get a training certificate by ID',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'certificateId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Certificate details',
        },
      },
    },
    patch: {
      tags: ['Training'],
      summary: 'Update a training certificate',
      description:
        'Update a certificate (requires DPO or higher). Accepts multipart/form-data with an optional file and a required metadata JSON string.',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'certificateId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Optional new certificate file to replace the existing one',
                },
                metadata: {
                  type: 'string',
                  description: 'JSON string containing certificate metadata fields to update',
                  schema: {
                    type: 'object',
                    properties: {
                      certificateNumber: { type: 'string' },
                      issuedAt: { type: 'string', format: 'date-time' },
                      thumbnailUrl: { type: 'string', format: 'uri' },
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
          description: 'Certificate updated',
        },
      },
    },
    delete: {
      tags: ['Training'],
      summary: 'Delete a training certificate',
      description:
        'Delete a certificate and its associated file from storage (requires DPO or higher)',
      parameters: [
        {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'certificateId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Certificate deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
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
  '/training/my-assignments': {
    get: {
      tags: ['Training'],
      summary: 'Get my training assignments',
      description: "Retrieve the current user's training assignments",
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
      ],
      responses: {
        '200': {
          description: 'List of user assignments',
        },
      },
    },
  },
  '/training/my-completions': {
    get: {
      tags: ['Training'],
      summary: 'Get my training completions',
      description: "Retrieve the current user's training completions",
      parameters: [
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
          description: 'List of user completions',
        },
      },
    },
  },
};
