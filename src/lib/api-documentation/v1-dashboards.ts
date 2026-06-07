import type { APIEndpoint } from '../api-documentation'

export const v1DashboardEndpoints: APIEndpoint[] = [
{
    path: '/api/v1/dashboards',
    method: 'GET',
    summary: 'Get dashboards',
    description: 'Retrieve a paginated list of dashboards with filtering, sorting, and search',
    tags: ['Dashboards'],
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
        description: 'Page number',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Items per page',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      {
        name: 'search',
        in: 'query',
        required: false,
        description: 'Search query',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'List of dashboards',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                dashboards: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dashboard' }
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' }
              }
            }
          }
        }
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/v1/dashboards/bulk',
    method: 'POST',
    summary: 'Bulk operations on dashboards',
    description: 'Perform bulk operations (delete, update status) on multiple dashboards',
    tags: ['Dashboards'],
    requestBody: {
      description: 'Bulk operation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['operation', 'dashboardIds'],
            properties: {
              operation: {
                type: 'string',
                enum: ['delete', 'update_status']
              },
              dashboardIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' },
                minItems: 1
              },
              data: {
                type: 'object',
                properties: {
                  isActive: { type: 'boolean' }
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
        description: 'Bulk operation completed'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  }
]
