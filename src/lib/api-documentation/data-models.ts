import type { APIEndpoint } from '../api-documentation'

export const dataModelEndpoints: APIEndpoint[] = [
{
    path: '/api/data-models',
    method: 'GET',
    summary: 'Get all data models',
    description: 'Retrieve a list of all data models',
    tags: ['Data Models'],
    parameters: [
      {
        name: 'spaceId',
        in: 'query',
        required: false,
        description: 'Filter by space ID',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'List of data models'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/data-models',
    method: 'POST',
    summary: 'Create a new data model',
    description: 'Create a new data model with attributes',
    tags: ['Data Models'],
    requestBody: {
      description: 'Data model creation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              display_name: { type: 'string' },
              description: { type: 'string' },
              space_ids: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['name', 'display_name']
          }
        }
      }
    },
    responses: [
      {
        status: 201,
        description: 'Data model created successfully'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  }
]
