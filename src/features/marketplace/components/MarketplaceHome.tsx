'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useMarketplacePlugins } from '../hooks/useMarketplacePlugins'
import { usePluginInstallation } from '../hooks/usePluginInstallation'
import { PluginDefinition, PluginCategory } from '../types'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSpace } from '@/contexts/space-context'
import { PluginCard } from './PluginCard'
import { InstallationWizard } from './InstallationWizard'
import { InstallationManageDialog, PluginEditDialog, type InstallationEditorValue } from './PluginManagementDialogs'
import { PROJECT_DEVELOPER_DOCS_ROUTE, PROJECT_MCP_ENDPOINT, PROJECT_PLUGIN_TEMPLATE_ROUTE } from '@/lib/project-developer'

// Add Plugin functionality moved to Plugin Hub

export interface MarketplaceHomeProps {
  spaceId?: string | null
  showSpaceSelector?: boolean
}

/**
 * Single-source MarketplaceHome component
 * Can be used in both space-scoped and admin views
 */
export function MarketplaceHome({
  spaceId = null,
  showSpaceSelector = false,
}: MarketplaceHomeProps) {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const categoryFromUrl = searchParams?.get('category') as PluginCategory | null
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>(
    categoryFromUrl || 'all'
  )

  // Update category when URL changes
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }
  }, [categoryFromUrl])
  const [searchQuery, setSearchQuery] = useState('')
  const [complianceFilter, setComplianceFilter] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDefinition | null>(null)
  const [showInstallWizard, setShowInstallWizard] = useState(false)
  const [editPlugin, setEditPlugin] = useState<PluginDefinition | null>(null)
  const [managePlugin, setManagePlugin] = useState<PluginDefinition | null>(null)
  const [manageInstallationId, setManageInstallationId] = useState<string | null>(null)
  const [manageInstallationValue, setManageInstallationValue] = useState<InstallationEditorValue | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  // Add Plugin functionality moved to Plugin Hub

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { plugins, loading, error, refetch } = useMarketplacePlugins({
    // Fetch all plugins to allow client-side category filtering without hiding other badges
    category: undefined,
    spaceId: effectiveSpaceId,
  })

  const { install, uninstall, loading: installing } = usePluginInstallation()

  // Fetch installations to check which plugins are installed
  const [installations, setInstallations] = useState<Map<string, string>>(new Map()) // Map<serviceId, installationId>
  const [loadingInstallations, setLoadingInstallations] = useState(false)

  // Fetch installations when space changes
  // Fetch installations when space changes
  const fetchInstallations = async () => {
    if (status !== 'authenticated') {
      setInstallations(new Map())
      setLoadingInstallations(status === 'loading')
      return
    }

    const effectiveSpace = effectiveSpaceId || currentSpace?.id

    // If no space is selected and user is admin, we might want to show all installations or global ones.
    // The API returns all installations if spaceId is not provided.

    try {
      setLoadingInstallations(true)
      // If we have a space, filter by it. If not, fetch all (global context)
      const url = effectiveSpace
        ? `/api/marketplace/installations?spaceId=${effectiveSpace}`
        : `/api/marketplace/installations`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const installationMap = new Map<string, string>()
        data.installations?.forEach((inst: any) => {
          if (inst.status === 'active') {
            installationMap.set(inst.serviceId, inst.id)
          }
        })
        setInstallations(installationMap)
      }
    } catch (error) {
      console.error('Error fetching installations:', error)
    } finally {
      setLoadingInstallations(false)
    }
  }


  useEffect(() => {
    fetchInstallations()
  }, [effectiveSpaceId, currentSpace?.id, status])



  const filteredPlugins = plugins.filter((plugin) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!plugin.name?.toLowerCase().includes(query) &&
        !plugin.description?.toLowerCase().includes(query) &&
        !plugin.provider?.toLowerCase().includes(query)) {
        return false
      }
    }

    // Filter by category (client-side)
    if (selectedCategory !== 'all' && plugin.category !== selectedCategory) {
      return false
    }

    // Filter by compliance
    if (complianceFilter && !plugin.isCompliance && !plugin.securityAudit) {
      return false
    }

    return true
  })

  // Group plugins by category (from ALL available plugins, not just filtered ones)
  // This ensures badges show correct counts even when filtered
  const pluginsByCategory = plugins.reduce((acc, plugin) => {
    const category = plugin.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(plugin)
    return acc
  }, {} as Record<string, PluginDefinition[]>)

  // Separate grouping for DISPLAY (only shows filtered plugins)
  const displayPluginsByCategory = filteredPlugins.reduce((acc, plugin) => {
    const category = plugin.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(plugin)
    return acc
  }, {} as Record<string, PluginDefinition[]>)

  // Get category info for display
  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories.find(cat => cat.value === 'other')!
  }

  const handleInstall = async (plugin: PluginDefinition) => {
    // Space is now optional - plugins can be installed globally
    setSelectedPlugin(plugin)
    setShowInstallWizard(true)
  }

  const handleInstallationComplete = async (
    plugin: PluginDefinition,
    config: Record<string, any>,
    credentials?: Record<string, any>
  ) => {
    const effectiveSpace = effectiveSpaceId || currentSpace?.id || null

    try {
      await install(plugin.id, effectiveSpace, config)
      setShowInstallWizard(false)
      setSelectedPlugin(null)

      // Refresh installations to get the latest status
      await fetchInstallations()
      refetch()
    } catch (error) {
      // Re-throw to be handled by the wizard
      throw error
    }
  }

  const handleUninstall = async (plugin: PluginDefinition) => {
    const installationId = installations.get(plugin.id)
    if (!installationId) {
      return
    }

    if (!confirm(`Are you sure you want to uninstall "${plugin.name}"?`)) {
      return
    }

    const success = await uninstall(installationId)
    if (success) {
      // Refresh installations to get the latest status
      await fetchInstallations()
      refetch()
    }
  }

  const handleEditPlugin = (plugin: PluginDefinition) => {
    setDialogError(null)
    setEditPlugin(plugin)
  }

  const handleSavePlugin = async (patch: Record<string, any>) => {
    if (!editPlugin) return

    try {
      setDialogLoading(true)
      setDialogError(null)
      const response = await fetch(`/api/marketplace/plugins/${editPlugin.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to update plugin')
      }

      setEditPlugin(null)
      await refetch()
    } catch (saveError) {
      setDialogError(saveError instanceof Error ? saveError.message : 'Failed to update plugin')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleDeletePlugin = async (plugin: PluginDefinition) => {
    if (!confirm(`Delete marketplace plugin "${plugin.name}"?`)) {
      return
    }

    try {
      setDialogLoading(true)
      setDialogError(null)
      const response = await fetch(`/api/marketplace/plugins/${plugin.slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to delete plugin')
      }

      await refetch()
      await fetchInstallations()
    } catch (deleteError) {
      setDialogError(deleteError instanceof Error ? deleteError.message : 'Failed to delete plugin')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleManageInstallation = async (plugin: PluginDefinition) => {
    const installationId = installations.get(plugin.id)
    if (!installationId) {
      return
    }

    try {
      setDialogLoading(true)
      setDialogError(null)
      const response = await fetch(`/api/marketplace/installations/${installationId}`)
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to load installation')
      }

      const data = await response.json()
      setManagePlugin(plugin)
      setManageInstallationId(installationId)
      setManageInstallationValue({
        config: data.installation?.config || {},
        credentials: {},
        status: data.installation?.status || 'active',
        healthStatus: data.installation?.healthStatus || '',
      })
    } catch (manageError) {
      setDialogError(manageError instanceof Error ? manageError.message : 'Failed to load installation')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleSaveInstallation = async (payload: InstallationEditorValue) => {
    if (!manageInstallationId) return

    try {
      setDialogLoading(true)
      setDialogError(null)
      const response = await fetch(`/api/marketplace/installations/${manageInstallationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: payload.config,
          credentials: payload.credentials || {},
          status: payload.status,
          healthStatus: payload.healthStatus,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to update installation')
      }

      setManagePlugin(null)
      setManageInstallationId(null)
      setManageInstallationValue(null)
      await fetchInstallations()
      await refetch()
    } catch (saveError) {
      setDialogError(saveError instanceof Error ? saveError.message : 'Failed to update installation')
    } finally {
      setDialogLoading(false)
    }
  }

  const categories: Array<{ value: PluginCategory | 'all'; label: string; icon: any }> = [
    { value: 'all', label: 'All Categories', icon: null },
    { value: 'business-intelligence', label: 'Business Intelligence', icon: null },
    { value: 'monitoring-observability', label: 'Monitoring & Observability', icon: null },
    { value: 'database-management', label: 'Database Management', icon: null },
    { value: 'storage-management', label: 'Storage Management', icon: null },
    { value: 'api-gateway', label: 'API Gateway', icon: null },
    { value: 'service-management', label: 'Service Management', icon: null },
    { value: 'data-integration', label: 'Data Integration', icon: null },
    { value: 'automation', label: 'Automation', icon: null },
    { value: 'analytics', label: 'Analytics', icon: null },
    { value: 'security', label: 'Security', icon: null },
    { value: 'development-tools', label: 'Development Tools', icon: null },
    { value: 'other', label: 'Other', icon: null },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground">
            Discover and install plugins to extend functionality
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
            >
              Fetch Updates
            </Button>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}

          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Plugin developer toolkit</CardTitle>
            <CardDescription>
              Build marketplace plugins with the new HTTP MCP endpoint, live project docs, and a downloadable starter bundle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">HTTP MCP</p>
                <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">{PROJECT_MCP_ENDPOINT}</code>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">Developer docs</p>
                <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">{PROJECT_DEVELOPER_DOCS_ROUTE}</code>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">Starter bundle</p>
                <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">{PROJECT_PLUGIN_TEMPLATE_ROUTE}</code>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={PROJECT_PLUGIN_TEMPLATE_ROUTE}
                className={buttonVariants({ variant: 'default', size: 'default' })}
              >
                Download starter
              </Link>
              <Link
                href={PROJECT_DEVELOPER_DOCS_ROUTE}
                className={buttonVariants({ variant: 'outline', size: 'default' })}
              >
                Open developer docs
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MCP tools</CardTitle>
            <CardDescription>
              One endpoint now handles project-module reads plus marketplace read, update, and delete actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>`list_project_modules` and `read_project_module` map the repo.</p>
            <p>`get_plugin`, `update_plugin`, and `delete_plugin` manage plugin records.</p>
            <p>`get_installation`, `update_installation`, and `delete_installation` manage installs.</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Section */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          // Count plugins in this category
          const categoryCount = cat.value === 'all'
            ? plugins.length
            : plugins.filter(p => p.category === cat.value).length

          // Don't show categories with no plugins (except "All Categories")
          if (cat.value !== 'all' && categoryCount === 0) {
            return null
          }

          const isSelected = selectedCategory === cat.value
          return (
            <Badge
              key={cat.value}
              variant={isSelected ? 'default' : 'outline'}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.preventDefault()
                setSelectedCategory(cat.value as PluginCategory | 'all')
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedCategory(cat.value as PluginCategory | 'all')
                }
              }}
            >
              {cat.label}
              {categoryCount > 0 && (
                <Badge
                  variant={isSelected ? 'secondary' : 'default'}
                  className="ml-2 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    minWidth: categoryCount < 10 ? '20px' : '24px',
                    width: categoryCount < 10 ? '20px' : 'auto',
                    padding: categoryCount < 10 ? '0' : '0 6px'
                  }}
                >
                  {categoryCount}
                </Badge>
              )}
            </Badge>
          )
        })}
      </div>

      {/* Compliance Filter Tag */}
      <div className="flex items-center gap-2">
        <Badge
          variant={complianceFilter ? 'default' : 'outline'}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-all ${
            complianceFilter
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'text-emerald-700 border-emerald-400 hover:bg-emerald-50'
          }`}
          onClick={() => setComplianceFilter((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setComplianceFilter((v) => !v)
            }
          }}
        >
          Is Compliance
        </Badge>
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4 flex-wrap">
        {showSpaceSelector && (
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[200px]"
            showAllOption={true}
          />
        )}

        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Plugins Section - Grouped by Category */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">Loading marketplace plugins...</p>
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No plugins found.</p>
              <p className="text-sm">
                {error
                  ? 'There was an error loading plugins. Please check the error message above.'
                  : 'No approved plugins are available in the marketplace.'}
              </p>

            </div>
          </div>
        ) : (
          Object.entries(displayPluginsByCategory).map(([category, categoryPlugins]) => {
            const categoryInfo = getCategoryInfo(category)
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{categoryInfo.label}</h3>
                  </div>
                  <div className="flex-1 border-t"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPlugins.map((plugin) => {
                    const isInstalled = installations.has(plugin.id)
                    return (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        onInstall={() => handleInstall(plugin)}
                        onUninstall={isInstalled ? () => handleUninstall(plugin) : undefined}
                        onManageInstallation={isInstalled ? () => handleManageInstallation(plugin) : undefined}
                        onEditPlugin={isAdmin ? () => handleEditPlugin(plugin) : undefined}
                        onDeletePlugin={isAdmin ? () => handleDeletePlugin(plugin) : undefined}
                        installing={installing}
                        installed={isInstalled}
                        isAdmin={isAdmin}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Installation Wizard */}
      {showInstallWizard && selectedPlugin && (
        <InstallationWizard
          plugin={selectedPlugin}
          spaceId={(effectiveSpaceId || currentSpace?.id || null) as string | null}
          open={showInstallWizard}
          onOpenChange={setShowInstallWizard}
          onComplete={handleInstallationComplete}
        />
      )}

      <PluginEditDialog
        plugin={editPlugin}
        open={!!editPlugin}
        loading={dialogLoading}
        error={dialogError}
        onOpenChange={(open) => {
          if (!open) {
            setEditPlugin(null)
            setDialogError(null)
          }
        }}
        onSave={handleSavePlugin}
      />

      <InstallationManageDialog
        plugin={managePlugin}
        installationId={manageInstallationId}
        open={!!managePlugin && !!manageInstallationId}
        loading={dialogLoading}
        error={dialogError}
        initialValue={manageInstallationValue}
        onOpenChange={(open) => {
          if (!open) {
            setManagePlugin(null)
            setManageInstallationId(null)
            setManageInstallationValue(null)
            setDialogError(null)
          }
        }}
        onSave={handleSaveInstallation}
      />

      {/* Add Plugin functionality moved to Plugin Hub */}
      {/* Use the marketplace to add new plugins */}


    </div>
  )
}

