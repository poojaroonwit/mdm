import { openApiComponents } from './components'
import { openApiPaths } from './paths'

export const openApiSpec = {
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
  paths: openApiPaths,
  components: openApiComponents,
  security: [{ sessionCookie: [] }],
} as const