import type { APIEndpoint } from '../api-documentation'

export const v1WorkflowEndpoints: APIEndpoint[] = [
{
    path: '/api/v1/workflows',
    method: 'GET',
    summary: 'Get workflows',
    description: 'Retrieve a paginated list of workflows with filtering, sorting, and search',
    tags: ['Workflows'],
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
        name: 'status',
        in: 'query',
        required: false,
        description: 'Filter by status',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'List of workflows',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                workflows: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Workflow' }
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
    path: '/api/v1/workflows/bulk',
    method: 'POST',
    summary: 'Bulk operations on workflows',
    description: 'Perform bulk operations (delete, update status) on multiple workflows',
    tags: ['Workflows'],
    requestBody: {
      description: 'Bulk operation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['operation', 'workflowIds'],
            properties: {
              operation: {
                type: 'string',
                enum: ['delete', 'update_status']
              },
              workflowIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' },
                minItems: 1
              },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' }
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
