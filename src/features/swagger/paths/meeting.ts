export const meetingPaths = {
  "/meetings": {
    get: {
      tags: ["Meetings"],
      summary: "Get all meetings",
      description: "Retrieve meetings for an association with pagination",
      parameters: [
        {
          name: "type",
          in: "query",
          schema: {
            type: "string",
            enum: ["ANNUAL", "GENERAL", "EXTRAORDINARY", "COMMITTEE"],
          },
        },
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
          },
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
        },
      ],
      responses: {
        "200": {
          description: "List of meetings",
        },
      },
    },
    post: {
      tags: ["Meetings"],
      summary: "Create a meeting",
      description:
        "Create a new meeting (requires SECRETARY, PRESIDENT, or SUPER_ADMIN role)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "type", "scheduledAt", "agendaItems"],
              properties: {
                title: { type: "string", minLength: 3 },
                type: {
                  type: "string",
                  enum: ["ANNUAL", "GENERAL", "EXTRAORDINARY", "COMMITTEE"],
                },
                scheduledAt: { type: "string", format: "date-time" },
                venue: { type: "string", maxLength: 500 },
                agendaItems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      duration: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Meeting created",
        },
      },
    },
  },
  "/meetings/{meetingId}": {
    get: {
      tags: ["Meetings"],
      summary: "Get a meeting by ID",
      parameters: [
        {
          name: "meetingId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Meeting details",
        },
      },
    },
    patch: {
      tags: ["Meetings"],
      summary: "Update a meeting",
      parameters: [
        {
          name: "meetingId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                type: { type: "string" },
                scheduledAt: { type: "string", format: "date-time" },
                venue: { type: "string" },
                status: {
                  type: "string",
                  enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Meeting updated",
        },
      },
    },
    delete: {
      tags: ["Meetings"],
      summary: "Delete a meeting",
      parameters: [
        {
          name: "meetingId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "204": {
          description: "Meeting deleted",
        },
      },
    },
  },

  "/meetings/{meetingId}/rsvp": {
    patch: {
      tags: ["Meetings"],
      summary: "Update a meeting",
      parameters: [
        {
          name: "meetingId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                type: { type: "string" },
                scheduledAt: { type: "string", format: "date-time" },
                venue: { type: "string" },
                status: {
                  type: "string",
                  enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Meeting updated",
        },
      },
    },
    delete: {
      tags: ["Meetings"],
      summary: "Delete a meeting",
      parameters: [
        {
          name: "meetingId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "204": {
          description: "Meeting deleted",
        },
      },
    },
  },
};
