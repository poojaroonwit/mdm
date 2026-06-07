import type { APIEndpoint } from '../api-documentation'

export const spacesEndpoints: APIEndpoint[] = [
{
    path: '/api/spaces',
    method: 'GET',
    summary: 'Get all spaces',
    description: 'Retrieve a list of all spaces the user has access to',
    tags: ['Spaces'],
    responses: [
      {
        status: 200,
        description: 'List of spaces',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                spaces: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      slug: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/spaces',
    method: 'POST',
    summary: 'Create a new space',
    description: 'Create a new space with the provided details',
    tags: ['Spaces'],
    requestBody: {
      description: 'Space creation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' }
            },
            required: ['name', 'slug']
          }
        }
      }
    },
    responses: [
      {
        status: 201,
        description: 'Space created successfully'
      },
      {
        status: 400,
        description: 'Invalid input data'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  }
]
