import type { APIEndpoint } from '../api-documentation'

export const v1TicketEndpoints: APIEndpoint[] = [
{
    path: '/api/v1/tickets',
    method: 'GET',
    summary: 'Get tickets',
    description: 'Retrieve a paginated list of tickets with filtering, sorting, and search',
    tags: ['Tickets'],
    parameters: [
      {
        name: 'spaceId',
        in: 'query',
        required: false,
        description: 'Filter by space ID',
        schema: { type: 'string', format: 'uuid' }
      },
      {
        name: 'page',
        in: 'query',
        required: false,
        description: 'Page number (default: 1)',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Items per page (default: 20)',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      {
        name: 'search',
        in: 'query',
        required: false,
        description: 'Search query',
        schema: { type: 'string' }
      },
      {
        name: 'sortBy',
        in: 'query',
        required: false,
        description: 'Field to sort by',
        schema: { type: 'string', enum: ['created_at', 'updated_at', 'title', 'status', 'priority'] }
      },
      {
        name: 'sortOrder',
        in: 'query',
        required: false,
        description: 'Sort order',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        description: 'Filter by status',
        schema: { type: 'string' }
      },
      {
        name: 'priority',
        in: 'query',
        required: false,
        description: 'Filter by priority',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'List of tickets',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                tickets: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Ticket' }
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      },
      {
        status: 401,
        description: 'Unauthorized'
      },
      {
        status: 403,
        description: 'Forbidden'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/v1/tickets',
    method: 'POST',
    summary: 'Create a ticket',
    description: 'Create a new ticket',
    tags: ['Tickets'],
    requestBody: {
      description: 'Ticket creation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['title', 'spaceId'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] },
              priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
              dueDate: { type: 'string', format: 'date-time' },
              startDate: { type: 'string', format: 'date-time' },
              estimate: { type: 'number' },
              spaceId: { type: 'string', format: 'uuid' },
              assignedTo: { type: 'string', format: 'uuid' }
            }
          }
        }
      }
    },
    responses: [
      {
        status: 201,
        description: 'Ticket created successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Ticket' }
          }
        }
      },
      {
        status: 400,
        description: 'Bad request'
      },
      {
        status: 401,
        description: 'Unauthorized'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/v1/tickets/bulk',
    method: 'POST',
    summary: 'Bulk operations on tickets',
    description: 'Perform bulk operations (delete, update status, update priority, assign) on multiple tickets',
    tags: ['Tickets'],
    requestBody: {
      description: 'Bulk operation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['operation', 'ticketIds'],
            properties: {
              operation: {
                type: 'string',
                enum: ['delete', 'update_status', 'update_priority', 'assign']
              },
              ticketIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' },
                minItems: 1
              },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  assigneeId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        }
      }
    },
    responses: [
      {
        status: 200,
        description: 'Bulk operation completed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                affected: { type: 'integer' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      {
        status: 400,
        description: 'Bad request'
      },
      {
        status: 401,
        description: 'Unauthorized'
      },
      {
        status: 403,
        description: 'Forbidden'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  }
]
