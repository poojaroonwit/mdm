'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMarketplacePlugins } from '../hooks/useMarketplacePlugins'
import { usePluginInstallation } from '../hooks/usePluginInstallation'
import { PluginDefinition, PluginCategory } from '../types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSpace } from '@/contexts/space-context'
import { PluginCard } from './PluginCard'
import { InstallationWizard } from './InstallationWizard'
import { InstallationManageDialog, PluginEditDialog, type InstallationEditorValue } from './PluginManagementDialogs'
import { MarketplaceDeveloperToolkit, MarketplaceFilters } from './MarketplaceHomeSections'

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

      <MarketplaceDeveloperToolkit isAdmin={isAdmin} onRefresh={() => refetch()} />

      <MarketplaceFilters
        categories={categories}
        complianceFilter={complianceFilter}
        plugins={plugins}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedSpaceId={selectedSpaceId}
        setComplianceFilter={setComplianceFilter}
        setSearchQuery={setSearchQuery}
        setSelectedCategory={setSelectedCategory}
        setSelectedSpaceId={setSelectedSpaceId}
        showSpaceSelector={showSpaceSelector}
      />      {/* Plugins Section - Grouped by Category */}
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

