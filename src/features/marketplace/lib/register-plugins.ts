/**
 * Plugin Registration Script
 * 
 * This script registers all marketplace plugins in the database.
 * Run this during application startup or as a migration script.
 * 
 * NOTE: If using plugin hub (USE_PLUGIN_HUB=true), plugins are registered
 * from the hub instead of built-in plugins.
 */

import { query } from '@/lib/db'
import { marketplacePlugins } from '@/features/plugin-adapters/marketplace-plugins'
import { PluginDefinition } from '../types'

const USE_PLUGIN_HUB = process.env.USE_PLUGIN_HUB === 'true'

/**
 * Register a plugin in the database
 */
async function registerPlugin(plugin: PluginDefinition): Promise<void> {
  try {
    // Check if plugin already exists
    const existing = await query(
      'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [plugin.slug]
    )

    if (existing.rows.length > 0) {
      console.log(`Plugin ${plugin.slug} already exists, skipping...`)
      return
    }

    // Insert plugin
    await query(
      `INSERT INTO service_registry (
        id, name, slug, description, version, provider, provider_url, category,
        status, capabilities, api_base_url, api_auth_type, api_auth_config,
        ui_type, ui_config, webhook_supported, webhook_events, icon_url,
        screenshots, documentation_url, support_url, pricing_info, verified,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12::jsonb,
        $13, $14::jsonb, $15, $16, $17, $18, $19, $20, $21::jsonb, $22, NOW(), NOW()
      )`,
      [
        plugin.name,
        plugin.slug,
        plugin.description || null,
        plugin.version,
        plugin.provider,
        plugin.providerUrl || null,
        plugin.category || null,
        plugin.status || 'pending',
        JSON.stringify(plugin.capabilities || {}),
        plugin.apiBaseUrl || null,
        plugin.apiAuthType || null,
        plugin.apiAuthConfig ? JSON.stringify(plugin.apiAuthConfig) : '{}',
        plugin.uiType || null,
        plugin.uiConfig ? JSON.stringify(plugin.uiConfig) : '{}',
        plugin.webhookSupported || false,
        plugin.webhookEvents || [],
        plugin.iconUrl || null,
        plugin.screenshots || [],
        plugin.documentationUrl || null,
        plugin.supportUrl || null,
        plugin.pricingInfo ? JSON.stringify(plugin.pricingInfo) : null,
        plugin.verified || false,
      ]
    )

    console.log(`✅ Registered plugin: ${plugin.name} (${plugin.slug})`)
  } catch (error) {
    console.error(`❌ Failed to register plugin ${plugin.slug}:`, error)
    throw error
  }
}

/**
 * Register all marketplace plugins
 */
export async function registerAllPlugins(): Promise<void> {
  // Skip if using plugin hub (plugins are registered from hub)
  if (USE_PLUGIN_HUB) {
    console.log('Plugin hub mode enabled - skipping built-in plugin registration')
    console.log('Plugins should be registered from the hub via /api/plugin-hub/plugins/[slug]/install')
    return
  }

  // Skip if no built-in plugins
  if (marketplacePlugins.length === 0) {
    console.log('No built-in plugins to register (using hub mode or empty registry)')
    return
  }

  console.log(`Registering ${marketplacePlugins.length} marketplace plugins...`)

  for (const plugin of marketplacePlugins) {
    await registerPlugin(plugin)
  }

  console.log('✅ All plugins registered successfully')
}

/**
 * Initialize plugins (can be called on app startup)
 */
export async function initializePlugins(): Promise<void> {
  try {
    await registerAllPlugins()
  } catch (error) {
    console.error('Error initializing plugins:', error)
    // Don't throw - allow app to continue even if plugin registration fails
  }
}

