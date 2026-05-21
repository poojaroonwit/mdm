export interface APIEndpoint {
  path: string
  method: string
  summary: string
  description: string
  tags: string[]
  parameters?: APIParameter[]
  requestBody?: APIRequestBody
  responses: APIResponse[]
  security?: APISecurity[]
  deprecated?: boolean
}

export interface APIParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required: boolean
  description: string
  schema: APISchema
  example?: any
}

export interface APIRequestBody {
  description: string
  required: boolean
  content: Record<string, APIContent>
}

export interface APIContent {
  schema: APISchema
  example?: any
}

export interface APIResponse {
  status: number
  description: string
  content?: Record<string, APIContent>
}

export interface APISchema {
  type?: string
  properties?: Record<string, APISchema>
  items?: APISchema
  required?: string[]
  enum?: any[]
  format?: string
  example?: any
  minimum?: number
  maximum?: number
  default?: any
  $ref?: string
  minItems?: number
  [key: string]: any // Allow additional OpenAPI schema properties
}

export interface APISecurity {
  type: string
  scheme: string
  bearerFormat?: string
}

export const API_ENDPOINTS: APIEndpoint[] = [
  // Spaces
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
  },

  // Data Models
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
  },

  // Attributes
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
  },

  // Bulk Operations
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
  },

  // V1 API - Tickets
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
  },

  // V1 API - Dashboards
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
  },

  // V1 API - Workflows
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
  },

  // Developer and Marketplace Plugin Tooling
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

export function generateOpenAPISpec(): any {
  return {
    openapi: '3.0.0',
    info: {
      title: 'MDM API',
      description: 'Master Data Management API Documentation',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@mdm.com'
      }
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Space: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            slug: { type: 'string' },
            is_default: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        DataModel: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            display_name: { type: 'string' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Attribute: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            display_name: { type: 'string' },
            type: { type: 'string' },
            is_required: { type: 'boolean' },
            is_unique: { type: 'boolean' },
            order: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'integer' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            dueDate: { type: 'string', format: 'date-time' },
            startDate: { type: 'string', format: 'date-time' },
            estimate: { type: 'number' },
            assignee: { type: 'object' },
            assignees: { type: 'array' },
            spaces: { type: 'array' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Dashboard: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            layout: { type: 'object' },
            widgets: { type: 'array' },
            isActive: { type: 'boolean' },
            spaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            steps: { type: 'array' },
            spaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: API_ENDPOINTS.reduce((paths, endpoint) => {
      const pathKey = endpoint.path.replace(/\/api/, '')
      if (!paths[pathKey]) {
        paths[pathKey] = {}
      }
      
      paths[pathKey][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        ...(endpoint.parameters && { parameters: endpoint.parameters }),
        ...(endpoint.requestBody && { requestBody: endpoint.requestBody }),
        responses: endpoint.responses.reduce((res, response) => {
          res[response.status] = {
            description: response.description,
            ...(response.content && { content: response.content })
          }
          return res
        }, {} as any),
        ...(endpoint.security && { security: endpoint.security })
      }
      
      return paths
    }, {} as any)
  }
}

export function generateMarkdownDocs(): string {
  let markdown = '# MDM API Documentation\n\n'
  
  markdown += '## Overview\n\n'
  markdown += 'This API provides endpoints for managing master data including spaces, data models, attributes, and bulk operations.\n\n'
  
  markdown += '## Authentication\n\n'
  markdown += 'All API endpoints require authentication using JWT Bearer tokens.\n\n'
  markdown += '```\n'
  markdown += 'Authorization: Bearer <your-jwt-token>\n'
  markdown += '```\n\n'
  
  // Group endpoints by tags
  const groupedEndpoints = API_ENDPOINTS.reduce((groups, endpoint) => {
    endpoint.tags.forEach(tag => {
      if (!groups[tag]) {
        groups[tag] = []
      }
      groups[tag].push(endpoint)
    })
    return groups
  }, {} as Record<string, APIEndpoint[]>)
  
  Object.entries(groupedEndpoints).forEach(([tag, endpoints]) => {
    markdown += `## ${tag}\n\n`
    
    endpoints.forEach(endpoint => {
      markdown += `### ${endpoint.method} ${endpoint.path}\n\n`
      markdown += `${endpoint.description}\n\n`
      
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += '#### Parameters\n\n'
        markdown += '| Name | Type | Location | Required | Description |\n'
        markdown += '|------|------|----------|----------|-------------|\n'
        endpoint.parameters.forEach(param => {
          markdown += `| ${param.name} | ${param.schema.type} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`
        })
        markdown += '\n'
      }
      
      if (endpoint.requestBody) {
        markdown += '#### Request Body\n\n'
        markdown += `${endpoint.requestBody.description}\n\n`
      }
      
      markdown += '#### Responses\n\n'
      endpoint.responses.forEach(response => {
        markdown += `- **${response.status}**: ${response.description}\n`
      })
      markdown += '\n'
    })
  })
  
  return markdown
}
