import { PluginDefinition, PluginStatus } from '../types'
import { marketplacePlugins } from '@/features/plugin-adapters/marketplace-plugins'

/**
 * Plugin Registry - Manages plugin registration and discovery
 */
export class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map()

  constructor() {
    // Auto-register all marketplace plugins
    marketplacePlugins.forEach((plugin) => {
      this.register(plugin)
    })
  }

  /**
   * Register a plugin
   */
  register(plugin: PluginDefinition): void {
    if (!plugin.id || !plugin.slug) {
      throw new Error('Plugin must have id and slug')
    }

    // Validate plugin structure
    this.validatePlugin(plugin)

    this.plugins.set(plugin.id, plugin)
  }

  /**
   * Get plugin by ID
   */
  get(id: string): PluginDefinition | undefined {
    return this.plugins.get(id)
  }

  /**
   * Get plugin by slug
   */
  getBySlug(slug: string): PluginDefinition | undefined {
    return Array.from(this.plugins.values()).find(p => p.slug === slug)
  }

  /**
   * List all plugins
   */
  list(filters?: {
    category?: string
    status?: PluginStatus
    verified?: boolean
  }): PluginDefinition[] {
    let plugins = Array.from(this.plugins.values())

    if (filters?.category) {
      plugins = plugins.filter(p => p.category === filters.category)
    }

    if (filters?.status) {
      plugins = plugins.filter(p => p.status === filters.status)
    }

    if (filters?.verified !== undefined) {
      plugins = plugins.filter(p => p.verified === filters.verified)
    }

    return plugins
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: PluginDefinition): void {
    const required = ['id', 'name', 'slug', 'version', 'provider', 'category', 'status']
    
    for (const field of required) {
      if (!plugin[field as keyof PluginDefinition]) {
        throw new Error(`Plugin missing required field: ${field}`)
      }
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(plugin.slug)) {
      throw new Error('Plugin slug must be lowercase alphanumeric with hyphens')
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(id: string): boolean {
    return this.plugins.delete(id)
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear()
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry()

