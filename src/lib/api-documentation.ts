import { attributeEndpoints } from './api-documentation/attributes'
import { bulkOperationEndpoints } from './api-documentation/bulk-operations'
import { dataModelEndpoints } from './api-documentation/data-models'
import { pluginToolingEndpoints } from './api-documentation/plugin-tooling'
import { spacesEndpoints } from './api-documentation/spaces'
import { v1DashboardEndpoints } from './api-documentation/v1-dashboards'
import { v1TicketEndpoints } from './api-documentation/v1-tickets'
import { v1WorkflowEndpoints } from './api-documentation/v1-workflows'
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
  ...spacesEndpoints,
  ...dataModelEndpoints,
  ...attributeEndpoints,
  ...bulkOperationEndpoints,
  ...v1TicketEndpoints,
  ...v1DashboardEndpoints,
  ...v1WorkflowEndpoints,
  ...pluginToolingEndpoints,
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
