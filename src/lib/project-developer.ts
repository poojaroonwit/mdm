import { existsSync } from 'fs'
import { readdir, readFile } from 'fs/promises'
import { join, relative, resolve, sep } from 'path'
import type { PluginCategory } from '@/features/marketplace/types'

export const PROJECT_MCP_ENDPOINT = '/api/developer/mcp'
export const PROJECT_DEVELOPER_DOCS_ROUTE = '/marketplace/developer'
export const PROJECT_PLUGIN_TEMPLATE_ROUTE = '/api/marketplace/templates/plugin-starter'

const PROJECT_ROOT = process.cwd()
const SRC_ROOT = join(PROJECT_ROOT, 'src')
const FEATURES_ROOT = join(SRC_ROOT, 'features')
const PLATFORM_APP_ROOT = join(SRC_ROOT, 'app', '(platform)')
const PLUGIN_HUB_ROOT = join(PROJECT_ROOT, 'plugin-hub', 'plugins')
const DOC_ROOTS = [
  join(PROJECT_ROOT, 'docs'),
  join(PROJECT_ROOT, 'mdm-knowledge-base-graph'),
]

const DEFAULT_TEMPLATE_CATEGORY: PluginCategory = 'development-tools'

export interface ProjectModuleSummary {
  id: string
  name: string
  type: 'feature' | 'platform-page' | 'plugin' | 'doc'
  path: string
  fileCount?: number
  notes?: string
}

export interface ProjectModuleDetails {
  module: ProjectModuleSummary
  children: Array<{
    name: string
    path: string
    type: 'file' | 'directory'
  }>
  previews: Array<{
    path: string
    content: string
  }>
}

export interface ProjectDeveloperSnapshot {
  generatedAt: string
  endpoints: {
    mcp: string
    developerDocs: string
    pluginStarterDownload: string
    swagger: string
  }
  counts: {
    features: number
    platformPages: number
    plugins: number
    docs: number
  }
  scripts: Array<{ name: string; command: string }>
  modules: ProjectModuleSummary[]
  architecture: string[]
}

function humanizeSegment(segment: string) {
  return segment
    .replace(/^\(.*\)$/, '')
    .replace(/^\[(.*)\]$/, '$1')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function toSafeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'custom-plugin'
}

function toComponentName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

async function listDirectories(dirPath: string) {
  if (!existsSync(dirPath)) {
    return []
  }

  const entries = await readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function listFiles(dirPath: string) {
  if (!existsSync(dirPath)) {
    return []
  }

  const entries = await readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function countFiles(dirPath: string, depth = 2): Promise<number> {
  if (!existsSync(dirPath) || depth < 0) {
    return 0
  }

  const entries = await readdir(dirPath, { withFileTypes: true })
  let count = 0

  for (const entry of entries) {
    const entryPath = join(dirPath, entry.name)
    if (entry.isFile()) {
      count += 1
    } else if (entry.isDirectory()) {
      count += await countFiles(entryPath, depth - 1)
    }
  }

  return count
}

async function getFeatureModules(): Promise<ProjectModuleSummary[]> {
  const directories = await listDirectories(FEATURES_ROOT)

  return Promise.all(
    directories.map(async (directory) => ({
      id: `feature:${directory}`,
      name: humanizeSegment(directory),
      type: 'feature' as const,
      path: relative(PROJECT_ROOT, join(FEATURES_ROOT, directory)).replaceAll('\\', '/'),
      fileCount: await countFiles(join(FEATURES_ROOT, directory), 2),
    }))
  )
}

async function getPlatformPages(): Promise<ProjectModuleSummary[]> {
  const entries = await listDirectories(PLATFORM_APP_ROOT)
  const pageModules: ProjectModuleSummary[] = []

  if (existsSync(join(PLATFORM_APP_ROOT, 'page.tsx'))) {
    pageModules.push({
      id: 'platform:home',
      name: 'Platform Home',
      type: 'platform-page',
      path: 'src/app/(platform)/page.tsx',
      notes: '/',
    })
  }

  for (const directory of entries) {
    if (directory === 'api') {
      continue
    }

    const pagePath = join(PLATFORM_APP_ROOT, directory, 'page.tsx')
    const layoutPath = join(PLATFORM_APP_ROOT, directory, 'layout.tsx')
    const hasPage = existsSync(pagePath)
    const hasLayout = existsSync(layoutPath)

    if (!hasPage && !hasLayout) {
      continue
    }

    pageModules.push({
      id: `platform:${directory}`,
      name: humanizeSegment(directory),
      type: 'platform-page',
      path: relative(PROJECT_ROOT, hasPage ? pagePath : layoutPath).replaceAll('\\', '/'),
      notes: `/${directory}`,
    })
  }

  return pageModules.sort((a, b) => a.name.localeCompare(b.name))
}

async function getPluginModules(): Promise<ProjectModuleSummary[]> {
  const directories = (await listDirectories(PLUGIN_HUB_ROOT)).filter((directory) => !directory.startsWith('_'))

  return Promise.all(
    directories.map(async (directory) => ({
      id: `plugin:${directory}`,
      name: humanizeSegment(directory),
      type: 'plugin' as const,
      path: relative(PROJECT_ROOT, join(PLUGIN_HUB_ROOT, directory)).replaceAll('\\', '/'),
      fileCount: await countFiles(join(PLUGIN_HUB_ROOT, directory), 2),
    }))
  )
}

async function getDocModules(): Promise<ProjectModuleSummary[]> {
  const docs: ProjectModuleSummary[] = []

  for (const root of DOC_ROOTS) {
    if (!existsSync(root)) {
      continue
    }

    const files = await listFiles(root)
    for (const file of files) {
      if (!/\.(md|mdx|txt)$/i.test(file)) {
        continue
      }

      const filePath = join(root, file)
      docs.push({
        id: `doc:${relative(PROJECT_ROOT, filePath).replaceAll('\\', '/')}`,
        name: file.replace(/\.[^.]+$/, ''),
        type: 'doc',
        path: relative(PROJECT_ROOT, filePath).replaceAll('\\', '/'),
      })
    }
  }

  return docs.sort((a, b) => a.name.localeCompare(b.name))
}

async function getScripts() {
  const packageJsonPath = join(PROJECT_ROOT, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
  const scripts = packageJson.scripts || {}

  return Object.entries<string>(scripts)
    .map(([name, command]) => ({ name, command }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getProjectDeveloperSnapshot(): Promise<ProjectDeveloperSnapshot> {
  const [features, platformPages, plugins, docs, scripts] = await Promise.all([
    getFeatureModules(),
    getPlatformPages(),
    getPluginModules(),
    getDocModules(),
    getScripts(),
  ])

  return {
    generatedAt: new Date().toISOString(),
    endpoints: {
      mcp: PROJECT_MCP_ENDPOINT,
      developerDocs: PROJECT_DEVELOPER_DOCS_ROUTE,
      pluginStarterDownload: PROJECT_PLUGIN_TEMPLATE_ROUTE,
      swagger: '/api-docs',
    },
    counts: {
      features: features.length,
      platformPages: platformPages.length,
      plugins: plugins.length,
      docs: docs.length,
    },
    scripts,
    modules: [...features, ...platformPages, ...plugins, ...docs],
    architecture: [
      'Next.js 16 App Router with React 19 and TypeScript 5.',
      'Main platform code lives under src/app/(platform) and shared business modules under src/features.',
      'Marketplace runtime and installation state are stored in service_registry and service_installations.',
      'plugin-hub is a separate Next.js service that hosts plugin source folders and public hub pages.',
      'Project docs are split between docs/ and mdm-knowledge-base-graph/.',
    ],
  }
}

export async function readProjectModule(modulePath: string): Promise<ProjectModuleDetails> {
  const resolvedPath = resolve(PROJECT_ROOT, modulePath)
  const normalizedRoot = `${resolve(PROJECT_ROOT)}${sep}`

  if (!resolvedPath.startsWith(normalizedRoot) && resolvedPath !== resolve(PROJECT_ROOT)) {
    throw new Error('Module path must stay inside the project root')
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`Module path does not exist: ${modulePath}`)
  }

  const relativePath = relative(PROJECT_ROOT, resolvedPath).replaceAll('\\', '/')
  const childEntries = await readdir(resolvedPath, { withFileTypes: true })
  const children = childEntries
    .slice(0, 25)
    .map((entry) => ({
      name: entry.name,
      path: `${relativePath}/${entry.name}`.replace(/\/+/g, '/'),
      type: entry.isDirectory() ? 'directory' as const : 'file' as const,
    }))

  const previewFiles = childEntries
    .filter((entry) => entry.isFile() && /\.(ts|tsx|js|jsx|md|json)$/i.test(entry.name))
    .slice(0, 3)

  const previews = await Promise.all(
    previewFiles.map(async (entry) => {
      const content = await readFile(join(resolvedPath, entry.name), 'utf-8')
      return {
        path: `${relativePath}/${entry.name}`.replace(/\/+/g, '/'),
        content: content.split('\n').slice(0, 40).join('\n'),
      }
    })
  )

  return {
    module: {
      id: `module:${relativePath}`,
      name: humanizeSegment(relativePath.split('/').pop() || relativePath),
      type: 'feature',
      path: relativePath,
      fileCount: await countFiles(resolvedPath, 2),
    },
    children,
    previews,
  }
}

export function buildPluginStarterBundle(options?: {
  slug?: string
  name?: string
  provider?: string
  category?: PluginCategory
}) {
  const name = options?.name?.trim() || 'Custom Project Plugin'
  const slug = toSafeSlug(options?.slug || name)
  const provider = options?.provider?.trim() || 'Your Team'
  const category = options?.category || DEFAULT_TEMPLATE_CATEGORY
  const componentName = `${toComponentName(slug)}UI`

  const bundle = {
    generatedAt: new Date().toISOString(),
    name,
    slug,
    provider,
    category,
    downloadFileName: `mdm-plugin-starter-${slug}.json`,
    files: [
      {
        path: 'README.md',
        content: `# ${name}

This starter bundle targets the MDM marketplace and plugin-hub setup in this repository.

## Where it fits

- Register database metadata through \`POST /api/marketplace/plugins\`
- Generate code in-project with \`POST /api/marketplace/plugins/generate-files\`
- Expose project intelligence over MCP at \`${PROJECT_MCP_ENDPOINT}\`
- Review developer guidance at \`${PROJECT_DEVELOPER_DOCS_ROUTE}\`

## Suggested folder

\`\`\`
plugin-hub/plugins/${slug}/
\`\`\`

## Next steps

1. Copy \`plugin.ts\` into your plugin folder.
2. Copy the component under \`components/\`.
3. Adjust \`uiConfig\`, \`capabilities\`, and any install-time fields.
4. Register the plugin metadata in the marketplace.
5. Optionally connect the MCP endpoint for project-aware tooling.
`,
      },
      {
        path: 'plugin.ts',
        content: `import { PluginDefinition } from '@/features/marketplace/types'

export const ${toComponentName(slug)}Plugin: PluginDefinition = {
  id: '${slug}',
  name: '${name}',
  slug: '${slug}',
  description: 'Describe what this plugin adds to the platform.',
  version: '1.0.0',
  provider: '${provider}',
  category: '${category}',
  status: 'approved',
  verified: false,
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/${slug}/components/${componentName}',
    navigation: {
      group: 'tools',
      label: '${name}',
      icon: 'Puzzle',
      href: '/tools/${slug}',
      priority: 100,
    },
    configFields: {
      baseUrl: {
        label: 'Base URL',
        type: 'text',
        required: false,
        placeholder: 'https://service.example.com',
      },
    },
  },
  capabilities: {
    navigation: {
      group: 'tools',
      label: '${name}',
      icon: 'Puzzle',
      href: '/tools/${slug}',
      priority: 100,
    },
    mcp: {
      endpoint: '${PROJECT_MCP_ENDPOINT}',
      supportedTools: [
        'list_project_modules',
        'get_plugin_catalog',
        'get_plugin',
        'update_plugin',
        'delete_plugin',
        'list_installations',
        'get_installation',
        'update_installation',
        'delete_installation',
        'get_plugin_starter_bundle',
        'get_project_docs',
      ],
    },
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/${slug}.svg',
  screenshots: [],
  documentationUrl: '${PROJECT_DEVELOPER_DOCS_ROUTE}',
  supportUrl: '${PROJECT_DEVELOPER_DOCS_ROUTE}',
  pricingInfo: {
    type: 'free',
  },
  installationCount: 0,
  reviewCount: 0,
}
`,
      },
      {
        path: `components/${componentName}.tsx`,
        content: `'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PluginInstallation } from '@/features/marketplace/types'

interface ${componentName}Props {
  installation: PluginInstallation
  config?: Record<string, unknown>
}

export function ${componentName}({ installation, config }: ${componentName}Props) {
  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>${name}</CardTitle>
          <CardDescription>
            Replace this starter UI with the real plugin experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Installation ID: {installation.id}</p>
          <p>Status: {installation.status}</p>
          <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-xs">
            {JSON.stringify(config || {}, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
`,
      },
      {
        path: 'mcp-request-example.json',
        content: JSON.stringify(
          {
            jsonrpc: '2.0',
            id: 'starter-tools',
            method: 'tools/call',
            params: {
              name: 'get_project_docs',
              arguments: {
                includeScripts: true,
              },
            },
          },
          null,
          2
        ),
      },
    ],
  }

  return bundle
}
