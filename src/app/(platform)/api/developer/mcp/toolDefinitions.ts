export const TOOL_DEFINITIONS = [
  {
    name: 'list_project_modules',
    description: 'List major features, platform pages, plugin modules, and project docs in this repository.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'read_project_module',
    description: 'Read one module or folder inside the repository and return child entries plus previews.',
    inputSchema: {
      type: 'object',
      properties: {
        modulePath: { type: 'string', description: 'Project-relative path such as src/features/marketplace or plugin-hub/plugins' },
      },
      required: ['modulePath'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_project_docs',
    description: 'Return the developer snapshot for this project, including commands and important endpoints.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_plugin_catalog',
    description: 'List marketplace plugins from service_registry with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        status: { type: 'string' },
        verified: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_plugin',
    description: 'Read one marketplace plugin by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_plugin',
    description: 'Update one marketplace plugin by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        patch: { type: 'object' },
      },
      required: ['slug', 'patch'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_plugin',
    description: 'Soft-delete one marketplace plugin by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_installations',
    description: 'List plugin installations with optional space or service filters.',
    inputSchema: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        serviceId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_installation',
    description: 'Read a single plugin installation by id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_installation',
    description: 'Update installation config, status, permissions, or credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        config: { type: 'object' },
        credentials: { type: 'object' },
        mergeConfig: { type: 'boolean' },
        status: { type: 'string' },
        healthStatus: { type: 'string' },
        permissions: { type: 'object' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_installation',
    description: 'Soft-delete a plugin installation and clean up plugin menu state.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_plugin_starter_bundle',
    description: 'Generate the downloadable plugin starter bundle used by the marketplace developer workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        name: { type: 'string' },
        provider: { type: 'string' },
        category: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
]
