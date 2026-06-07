import type { APIEndpoint } from '../api-documentation'

export const attributeEndpoints: APIEndpoint[] = [
{
    path: '/api/data-models/{id}/attributes',
    method: 'GET',
    summary: 'Get model attributes',
    description: 'Retrieve all attributes for a specific data model',
    tags: ['Attributes'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Data model ID',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'List of attributes'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/data-models/{id}/attributes',
    method: 'POST',
    summary: 'Create a new attribute',
    description: 'Add a new attribute to a data model',
    tags: ['Attributes'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Data model ID',
        schema: { type: 'string' }
      }
    ],
    requestBody: {
      description: 'Attribute creation data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              display_name: { type: 'string' },
              type: { type: 'string' },
              is_required: { type: 'boolean' },
              is_unique: { type: 'boolean' }
            },
            required: ['name', 'display_name', 'type']
          }
        }
      }
    },
    responses: [
      {
        status: 201,
        description: 'Attribute created successfully'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  }
]
