import type { APIEndpoint } from '../api-documentation'

export const pluginToolingEndpoints: APIEndpoint[] = [
{
    path: '/api/developer/mcp',
    method: 'POST',
    summary: 'HTTP MCP endpoint',
    description: 'Single HTTP JSON-RPC endpoint for project module discovery plus marketplace plugin and installation tooling.',
    tags: ['Developer'],
    requestBody: {
      description: 'JSON-RPC request payload',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['jsonrpc', 'method'],
            properties: {
              jsonrpc: { type: 'string', example: '2.0' },
              id: { type: 'string' },
              method: { type: 'string', enum: ['initialize', 'tools/list', 'tools/call'] },
              params: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  arguments: { type: 'object' }
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
        description: 'JSON-RPC response envelope'
      }
    ],
    security: [{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }]
  },
  {
    path: '/api/marketplace/templates/plugin-starter',
    method: 'GET',
    summary: 'Download plugin starter bundle',
    description: 'Download a generated JSON starter bundle for building a new marketplace plugin.',
    tags: ['Marketplace'],
    parameters: [
      {
        name: 'slug',
        in: 'query',
        required: false,
        description: 'Plugin slug override',
        schema: { type: 'string' }
      },
      {
        name: 'name',
        in: 'query',
        required: false,
        description: 'Plugin display name override',
        schema: { type: 'string' }
      },
      {
        name: 'provider',
        in: 'query',
        required: false,
        description: 'Plugin provider override',
        schema: { type: 'string' }
      },
      {
        name: 'category',
        in: 'query',
        required: false,
        description: 'Plugin category override',
        schema: { type: 'string' }
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Starter bundle download',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                generatedAt: { type: 'string', format: 'date-time' },
                slug: { type: 'string' },
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      content: { type: 'string' }
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
  }
]
