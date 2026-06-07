export const openApiComponents = {
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
    } as const
