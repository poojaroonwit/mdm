import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { query } from '@/lib/db'

/**
 * Generate plugin files from form data
 * This unlocks the ability to create code-based plugins via UI
 */
async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Only admins can generate plugin files
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      slug,
      name,
      description,
      version,
      provider,
      providerUrl,
      category,
      apiBaseUrl,
      apiAuthType,
      generateCodeFiles,
      generateUIComponent,
      uiComponentType,
    } = body

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'Slug and name are required' },
        { status: 400 }
      )
    }

    const results: { created: string[]; errors: string[] } = {
      created: [],
      errors: [],
    }

    // Get project root (assuming we're in src/app/api, go up 4 levels)
    const projectRoot = process.cwd()
    const pluginsDir = join(projectRoot, 'plugin-hub', 'plugins', slug)

    if (generateCodeFiles) {
      // Create plugin directory
      await fs.mkdir(pluginsDir, { recursive: true })

      const pluginFilePath = join(pluginsDir, 'plugin.ts')
      
      // Check if plugin.ts already exists
      let pluginFileExists = false
      try {
        await fs.access(pluginFilePath)
        pluginFileExists = true
        results.created.push(`Plugin file already exists: ${pluginFilePath} (skipped generation)`)
      } catch {
        // File doesn't exist, we'll create it
        pluginFileExists = false
      }

      // Only generate if file doesn't exist
      if (!pluginFileExists) {
        // Generate plugin.ts file
        const pluginContent = generatePluginFile({
          slug,
          name,
          description,
          version,
          provider,
          providerUrl,
          category,
          apiBaseUrl,
          apiAuthType,
          generateUIComponent,
        })

        await fs.writeFile(pluginFilePath, pluginContent, 'utf-8')
        results.created.push(`Created: ${pluginFilePath}`)
      }

      // Generate UI component if requested
      if (generateUIComponent) {
        const componentsDir = join(pluginsDir, 'components')
        await fs.mkdir(componentsDir, { recursive: true })

        const componentName = slug
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('')

        const componentFilePath = join(componentsDir, `${componentName}UI.tsx`)
        
        // Check if component already exists
        let componentExists = false
        try {
          await fs.access(componentFilePath)
          componentExists = true
          results.created.push(`UI component already exists: ${componentFilePath} (skipped generation)`)
        } catch {
          // Component doesn't exist, we'll create it
          componentExists = false
        }

        // Only generate if component doesn't exist
        if (!componentExists) {
          const componentContent = generateUIComponentFile({
            componentName,
            pluginName: name,
            uiComponentType: uiComponentType || 'basic',
          })

          await fs.writeFile(componentFilePath, componentContent, 'utf-8')
          results.created.push(`Created: ${componentFilePath}`)
        }
      }

      // Update index.ts to include the plugin (only if not already there)
      const indexUpdated = await updatePluginIndex(slug, name)
      if (indexUpdated) {
        results.created.push('Updated plugin-hub/plugins/index.ts')
      } else {
        results.created.push('Plugin already in plugin-hub/plugins/index.ts')
      }

      // Automatically register the plugin in the database
      // This works whether files were generated or already existed
      try {
        await registerPluginFromCode(slug)
        results.created.push('Plugin automatically registered in database')
      } catch (regError: any) {
        results.errors.push(`Auto-registration failed: ${regError.message}`)
        // Don't fail the whole operation if registration fails
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      created: results.created,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Error in generate-files route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generatePluginFile(options: {
  slug: string
  name: string
  description?: string
  version: string
  provider: string
  providerUrl?: string
  category: string
  apiBaseUrl?: string
  apiAuthType?: string
  generateUIComponent?: boolean
}): string {
  const {
    slug,
    name,
    description,
    version,
    provider,
    providerUrl,
    category,
    apiBaseUrl,
    apiAuthType,
    generateUIComponent,
  } = options

  const componentName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  const uiConfig = generateUIComponent
    ? `  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/${slug}/components/${componentName}UI',
  },`
    : `  uiType: 'iframe',
  uiConfig: {
    iframeUrl: '${apiBaseUrl || 'https://example.com'}',
  },`

  return `import { PluginDefinition } from '../../types'

export const ${slug.replace(/-/g, '')}Plugin: PluginDefinition = {
  id: '${slug}',
  name: '${name}',
  slug: '${slug}',
  description: ${description ? `'${description.replace(/'/g, "\\'")}'` : 'undefined'},
  version: '${version}',
  provider: '${provider}',
  ${providerUrl ? `providerUrl: '${providerUrl}',` : ''}
  category: '${category}',
  status: 'approved',
  verified: false,
  ${apiBaseUrl ? `apiBaseUrl: '${apiBaseUrl}',` : ''}
  ${apiAuthType && apiAuthType !== 'none' ? `apiAuthType: '${apiAuthType}',` : ''}
  ${apiAuthType && apiAuthType !== 'none' ? `apiAuthConfig: {},` : ''}
${uiConfig}
  capabilities: {},
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/${slug}.svg',
  screenshots: [],
  ${description ? `documentationUrl: '${providerUrl || 'https://example.com/docs'}',` : ''}
  installationCount: 0,
  reviewCount: 0,
}
`
}

function generateUIComponentFile(options: {
  componentName: string
  pluginName: string
  uiComponentType: string
}): string {
  const { componentName, pluginName, uiComponentType } = options

  if (uiComponentType === 'management') {
    return `'use client'

import { PluginInstallation } from '@/features/marketplace/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ${componentName}UIProps {
  installation: PluginInstallation
  config?: Record<string, any>
}

export function ${componentName}UI({ installation, config }: ${componentName}UIProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>${pluginName}</CardTitle>
          <CardDescription>
            Manage your ${pluginName} instance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Installation ID: {installation.id}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {installation.status}
              </p>
            </div>
            <Button>Configure</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`
  }

  // Basic/default template
  return `'use client'

import { PluginInstallation } from '@/features/marketplace/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ${componentName}UIProps {
  installation: PluginInstallation
  config?: Record<string, any>
}

export function ${componentName}UI({ installation, config }: ${componentName}UIProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>${pluginName}</CardTitle>
          <CardDescription>
            ${pluginName} integration interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Customize this component to add your plugin functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
`
}

/**
 * Register a plugin in the database by dynamically loading it from code
 */
async function registerPluginFromCode(slug: string): Promise<void> {
  try {
    // Dynamically import the plugin from the generated file
    const projectRoot = process.cwd()
    const pluginPath = join(
      projectRoot,
      'plugin-hub',
      'plugins',
      slug,
      'plugin.ts'
    )

    // Read the plugin file to get the export name
    const pluginContent = await fs.readFile(pluginPath, 'utf-8')
    
    // Extract the export name (e.g., "export const myPlugin")
    const exportMatch = pluginContent.match(/export const (\w+): PluginDefinition/)
    if (!exportMatch) {
      throw new Error('Could not find plugin export in generated file')
    }

    // Since we just updated index.ts, we can use registerAllPlugins
    // which will automatically pick up the new plugin from the updated array.
    // This is simpler and more reliable than trying to dynamically import TypeScript.
    // registerAllPlugins is idempotent - it won't create duplicates if plugin already exists.
    const { registerAllPlugins } = await import('@/features/marketplace/lib/register-plugins')
    await registerAllPlugins()
    
    // registerAllPlugins handles registration for all plugins including the new one
    return
  } catch (error) {
    console.error('Error registering plugin from code:', error)
    throw error
  }
}

async function updatePluginIndex(slug: string, name: string): Promise<boolean> {
  const projectRoot = process.cwd()
  const indexPath = join(
    projectRoot,
    'plugin-hub',
    'plugins',
    'index.ts'
  )

  try {
    let indexContent = await fs.readFile(indexPath, 'utf-8')
    
    // Generate import name
    const importName = `${slug.replace(/-/g, '')}Plugin`
    const importPath = `./${slug}/plugin`
    
    // Check if already imported
    if (indexContent.includes(`from '${importPath}'`)) {
      return false // Already added
    }

    // Add import after the last import statement
    const importLine = `import { ${importName} } from '${importPath}'`
    const lines = indexContent.split('\n')
    
    // Find the last import line (before PluginDefinition import)
    let lastImportIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && !lines[i].includes('PluginDefinition')) {
        lastImportIndex = i
      }
    }

    // Insert new import after last import
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine)
    } else {
      // Find line with PluginDefinition import and insert before it
      const pluginDefIndex = lines.findIndex(line => line.includes('PluginDefinition'))
      if (pluginDefIndex >= 0) {
        lines.splice(pluginDefIndex, 0, importLine)
      } else {
        lines.unshift(importLine)
      }
    }

    indexContent = lines.join('\n')

    // Add to marketplacePlugins array
    // Find the array and add the plugin
    const arrayRegex = /export const marketplacePlugins: PluginDefinition\[\] = \[([\s\S]*?)\]/m
    const match = indexContent.match(arrayRegex)
    
    if (match) {
      const arrayContent = match[1].trim()
      const plugins = arrayContent
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      // Add new plugin if not already there
      if (!plugins.includes(importName)) {
        plugins.push(importName)
      }
      
      const newArrayContent = plugins.map(p => `  ${p}`).join(',\n')
      const newIndexContent = indexContent.replace(
        arrayRegex,
        `export const marketplacePlugins: PluginDefinition[] = [\n${newArrayContent},\n]`
      )
      await fs.writeFile(indexPath, newIndexContent, 'utf-8')
      return true // Index was updated
    } else {
      throw new Error('Could not find marketplacePlugins array in index.ts')
    }
  } catch (error) {
    console.error('Error updating index.ts:', error)
    throw error
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/marketplace/plugins/generate-files')
