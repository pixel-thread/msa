export const compliancePaths = {
  '/compliance': {
    get: {
      tags: ['Compliance'],
      summary: 'List all complaints',
      description:
        'Retrieve all complaints for the association with pagination and filters (requires DPO or higher role)',
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
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
          },
        },
        {
          name: 'priority',
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'fromDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'toDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
      ],
      responses: {
        '200': {
          description: 'Paginated list of complaints',
        },
      },
    },
  },
  '/compliance/my': {
    get: {
      tags: ['Compliance'],
      summary: 'List my complaints',
      description: "Retrieve the authenticated user's complaints with pagination and filters",
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
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
          },
        },
        {
          name: 'priority',
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'fromDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'toDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
        },
      ],
      responses: {
        '200': {
          description: "Paginated list of user's complaints",
        },
      },
    },
  },
  '/compliance/my/{complaintId}': {
    get: {
      tags: ['Compliance'],
      summary: 'Get complaint detail',
      description: 'Retrieve a single complaint by ID (scoped to the authenticated user)',
      parameters: [
        {
          name: 'complaintId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Complaint details',
        },
        '404': {
          description: 'Complaint not found',
        },
      },
    },
  },
};
