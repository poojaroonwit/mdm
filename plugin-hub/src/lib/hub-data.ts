import { existsSync } from 'fs'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { getPluginBySlug, marketplacePlugins } from '../../plugins'

const PLUGIN_ROOT = join(process.cwd(), 'plugins')
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000'

export function listHubPlugins(filters?: {
  category?: string | null
  status?: string | null
  verified?: string | null
}) {
  let plugins = [...marketplacePlugins]

  if (filters?.category) {
    plugins = plugins.filter((plugin) => plugin.category === filters.category)
  }

  if (filters?.status) {
    plugins = plugins.filter((plugin) => plugin.status === filters.status)
  }

  if (filters?.verified !== null && filters?.verified !== undefined) {
    const verified = filters.verified === 'true'
    plugins = plugins.filter((plugin) => !!plugin.verified === verified)
  }

  return plugins
}

export async function getHubPluginDetail(slug: string) {
  const plugin = getPluginBySlug(slug)

  if (!plugin) {
    return null
  }

  const files = await buildFileTree(join(PLUGIN_ROOT, slug))
  return {
    ...plugin,
    files,
  }
}

async function buildFileTree(directory: string): Promise<any[]> {
  if (!existsSync(directory)) {
    return []
  }

  const entries = await readdir(directory, { withFileTypes: true })
  const visibleEntries = entries
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

  return Promise.all(
    visibleEntries.map(async (entry) => {
      const entryPath = join(directory, entry.name)
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: 'directory',
          children: await buildFileTree(entryPath),
        }
      }

      const previewable = /\.(ts|tsx|js|jsx|json|md)$/i.test(entry.name)
      const content = previewable
        ? (await readFile(entryPath, 'utf-8')).split('\n').slice(0, 80).join('\n')
        : undefined

      return {
        name: entry.name,
        type: 'file',
        content,
      }
    })
  )
}

export async function proxyMainApp(path: string, init?: RequestInit & { cookie?: string | null }) {
  const headers = new Headers(init?.headers || {})
  if (init?.cookie) {
    headers.set('cookie', init.cookie)
  }

  const response = await fetch(`${MAIN_APP_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })

  return response
}
