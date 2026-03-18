export type PluginSource = 'built-in' | 'external' | 'local-folder' | 'npm' | 'cdn' | 'git' | 'hub'

export interface PluginDefinition {
  id: string
  name: string
  slug: string
  description?: string
  version: string
  provider: string
  providerUrl?: string
  category: PluginCategory
  status: PluginStatus
  capabilities?: Record<string, any>
  apiBaseUrl?: string
  apiAuthType?: 'oauth2' | 'api_key' | 'bearer' | 'none'
  apiAuthConfig?: Record<string, any>
  uiType?: 'iframe' | 'react_component' | 'web_component'
  uiConfig?: Record<string, any>
  webhookSupported?: boolean
  webhookEvents?: string[]
  iconUrl?: string
  screenshots?: string[]
  documentationUrl?: string
  supportUrl?: string
  pricingInfo?: Record<string, any>
  installationCount?: number
  rating?: number
  reviewCount?: number
  verified?: boolean
  isCompliance?: boolean
  securityAudit?: Record<string, any>

  // External plugin support
  source?: PluginSource
  sourcePath?: string  // Path to plugin folder (relative or absolute)
  sourceUrl?: string   // URL for remote plugins (CDN, Git, etc.)
  projectFolder?: string  // Different project folder name
  downloadUrl?: string    // URL to download plugin package
  checksum?: string        // SHA256 checksum for verification
  installedPath?: string   // Where plugin is installed locally

  // Navigation configuration
  navigation?: {
    group: 'overview' | 'tools' | 'system' | 'infrastructure' | 'data-management'
    label: string
    icon: string // Lucide icon name
    href?: string
    priority?: number
  }

  // Installation status (dynamically populated)
  isInstalled?: boolean
  installationId?: string
  installationStatus?: string
}

export type PluginCategory =
  | 'business-intelligence'      // BI tools (Power BI, Looker Studio, etc.)
  | 'monitoring-observability'   // Monitoring tools (Grafana, Prometheus, etc.)
  | 'service-management'         // Infrastructure service management
  | 'database-management'        // Database tools (PostgreSQL, Redis, etc.)
  | 'api-gateway'                // API gateway tools (Kong, etc.)
  | 'storage-management'         // Storage tools (MinIO, S3, etc.)
  | 'data-integration'           // Data connectors and ETL
  | 'automation'                 // Workflow automation
  | 'analytics'                  // Analytics platforms
  | 'security'                   // Security tools
  | 'development-tools'          // Developer tools
  | 'report-templates'           // Report templates
  | 'other'                      // Other plugins

export type PluginStatus = 'pending' | 'approved' | 'rejected' | 'deprecated'

export interface PluginInstallation {
  id: string
  serviceId: string
  spaceId?: string
  installedBy?: string
  config?: Record<string, any>
  credentials?: Record<string, any>
  status: 'active' | 'inactive' | 'error'
  lastHealthCheck?: Date
  healthStatus?: string
  permissions?: Record<string, any>
  installedAt: Date
  updatedAt: Date
}

export interface UseMarketplacePluginsOptions {
  category?: PluginCategory
  spaceId?: string | null
  filters?: {
    status?: PluginStatus
    verified?: boolean
    serviceType?: string
    installedOnly?: boolean // Only show plugins installed in the space
  }
}
