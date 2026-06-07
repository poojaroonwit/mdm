import type { APIEndpoint } from '../api-documentation'

export const bulkOperationEndpoints: APIEndpoint[] = [
{
    path: '/api/bulk/import',
    method: 'POST',
    summary: 'Bulk import data',
    description: 'Import data from CSV or Excel file',
    tags: ['Bulk Operations'],
    requestBody: {
      description: 'File upload',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
              spaceId: { type: 'string' },
              dataModelId: { type: 'string' }
            }
          }
        }
      }
    },
    responses: [
      {
        status: 200,
        description: 'Import completed successfully'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/bulk/export',
    method: 'GET',
    summary: 'Bulk export data',
    description: 'Export data to CSV or Excel format',
    tags: ['Bulk Operations'],
    parameters: [
      {
        name: 'format',
        in: 'query',
        required: true,
        description: 'Export format (csv, xlsx, json)',
        schema: { type: 'string', enum: ['csv', 'xlsx', 'json'] }
      },
      {
        name: 'spaceId',
        in: 'query',
        required: true,
        description: 'Space ID',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Export file generated',
        content: {
          'application/octet-stream': {
            schema: { type: 'string', format: 'binary' }
          }
        }
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  }
]
