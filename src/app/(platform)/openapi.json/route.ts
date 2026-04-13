import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Unified Data Platform API',
      version: '1.0.0',
      description:
        'OpenAPI specification for the Unified Data Platform. Authentication uses NextAuth/Supabase sessions and/or Bearer tokens where applicable.',
    },
    servers: [
      { url: '/' },
    ],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Customers' },
      { name: 'Companies' },
      { name: 'Assignments' },
      { name: 'ImportExport' },
      { name: 'Settings' },
      { name: 'SSE' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } },
                },
              },
            },
          },
        },
      },
      '/api/auth/signup': {
        post: {
          tags: ['Auth'],
          summary: 'Sign up new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'User created' },
            '400': { description: 'Invalid payload', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Customers list',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PaginatedCustomers',
                  },
                  examples: {
                    success: {
                      summary: 'First page of customers',
                      value: { data: [{ id: 'c_1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }], meta: { page: 1, limit: 10, total: 25 } },
                    },
                  },
                },
              },
            },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create customer',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CustomerCreate' },
                examples: {
                  create: {
                    summary: 'Create a basic customer',
                    value: {
                      firstName: 'Jane',
                      lastName: 'Doe',
                      email: 'jane@example.com',
                      phone: '+1-555-0100',
                      company: 'Acme Inc',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Customer' },
                  examples: {
                    created: {
                      summary: 'Created customer example',
                      value: {
                        id: 'c_2',
                        firstName: 'Jane',
                        lastName: 'Doe',
                        email: 'jane@example.com',
                        phone: '+1-555-0100',
                        company: 'Acme Inc',
                      },
                    },
                  },
                },
              },
            },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer by id',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Customer', content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
            '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        put: {
          tags: ['Customers'],
          summary: 'Update customer',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CustomerUpdate' },
                examples: {
                  updateEmail: {
                    summary: 'Update only the email',
                    value: { email: 'updated@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Customer' },
                  examples: {
                    updated: {
                      summary: 'Customer after update',
                      value: {
                        id: 'c_1',
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'updated@example.com',
                        phone: '+1-555-0123',
                        company: 'Tech Corp',
                      },
                    },
                  },
                },
              },
            },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Customers'],
          summary: 'Delete customer',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '204': { description: 'Deleted' },
            '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/companies': {
        get: {
          tags: ['Companies'],
          summary: 'List companies',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Companies list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedCompanies' } } } },
          },
        },
        post: {
          tags: ['Companies'],
          summary: 'Create company',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyCreate' } } } },
          responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Company' } } } } },
        },
      },
      '/api/companies/{id}': {
        get: {
          tags: ['Companies'],
          summary: 'Get company',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Company' } } } }, '404': { description: 'Not found' } },
        },
        put: {
          tags: ['Companies'],
          summary: 'Update company',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyUpdate' } } } },
          responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Company' } } } } },
        },
        delete: {
          tags: ['Companies'],
          summary: 'Delete company',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'No Content' }, '404': { description: 'Not found' } },
        },
      },
      '/api/assignments': {
        get: {
          tags: ['Assignments'],
          summary: 'List assignments',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in_progress', 'completed'] } },
          ],
          responses: { '200': { description: 'Assignments list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedAssignments' } } } } },
        },
        post: {
          tags: ['Assignments'],
          summary: 'Create assignment',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignmentCreate' } } } },
          responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assignment' } } } } },
        },
      },
      '/api/assignments/{id}': {
        get: {
          tags: ['Assignments'],
          summary: 'Get assignment',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assignment' } } } }, '404': { description: 'Not found' } },
        },
        put: {
          tags: ['Assignments'],
          summary: 'Update assignment',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignmentUpdate' } } } },
          responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Assignment' } } } } },
        },
        delete: {
          tags: ['Assignments'],
          summary: 'Delete assignment',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'No Content' }, '404': { description: 'Not found' } },
        },
      },
      '/api/import-export/import': {
        post: {
          tags: ['ImportExport'],
          summary: 'Import data',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } } } },
          responses: { '200': { description: 'Import accepted' }, '400': { description: 'Invalid file' } },
        },
      },
      '/api/import-export/export': {
        post: {
          tags: ['ImportExport'],
          summary: 'Export data',
          security: [{ sessionCookie: [] }, { bearerAuth: [] }],
          requestBody: { required: false },
          responses: { '200': { description: 'Export file' } },
        },
      },
      '/api/settings': {
        get: { tags: ['Settings'], summary: 'Get settings', security: [{ sessionCookie: [] }, { bearerAuth: [] }], responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppSettings' } } } } } },
        post: { tags: ['Settings'], summary: 'Update settings', security: [{ sessionCookie: [] }, { bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AppSettingsUpdate' } } } }, responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AppSettings' } } } } } },
      },
      '/api/sse': {
        get: {
          tags: ['SSE'],
          summary: 'Server-Sent Events stream',
          responses: { '200': { description: 'SSE stream' } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'Session cookie set by NextAuth. On some environments, the cookie name may be `__Secure-next-auth.session-token`.',
        },
      },
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' },
          },
          required: ['id', 'firstName', 'lastName'],
        },
        CustomerCreate: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' },
          },
          required: ['firstName', 'lastName'],
        },
        CustomerUpdate: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            website: { type: 'string' },
            industry: { type: 'string' },
          },
          required: ['id', 'name'],
        },
        CompanyCreate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            website: { type: 'string' },
            industry: { type: 'string' },
          },
          required: ['name'],
        },
        CompanyUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            website: { type: 'string' },
            industry: { type: 'string' },
          },
        },
        Assignment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            assigneeId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'status'],
        },
        AssignmentCreate: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            assigneeId: { type: 'string' },
          },
          required: ['title'],
        },
        AssignmentUpdate: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          },
        },
        AppSettings: {
          type: 'object',
          properties: {
            siteName: { type: 'string' },
            primaryColor: { type: 'string' },
            secondaryColor: { type: 'string' },
            deletePolicyDays: { type: 'integer' },
          },
        },
        AppSettingsUpdate: {
          type: 'object',
          properties: {
            siteName: { type: 'string' },
            primaryColor: { type: 'string' },
            secondaryColor: { type: 'string' },
            deletePolicyDays: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object', additionalProperties: true },
          },
          required: ['message'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
          },
          required: ['page', 'limit', 'total'],
        },
        PaginatedCustomers: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          },
          required: ['data', 'meta'],
        },
        PaginatedCompanies: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          },
          required: ['data', 'meta'],
        },
        PaginatedAssignments: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Assignment' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          },
          required: ['data', 'meta'],
        },
      },
    },
    security: [{ sessionCookie: [] }],
  }

  return NextResponse.json(spec)
}


