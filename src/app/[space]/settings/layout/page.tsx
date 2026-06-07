'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layout, Plus, Edit } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { SpaceSettingsSidebar } from '@/components/space-management/SpaceSettingsSidebar'
import { SpaceSettingsHeader } from '@/components/space-management/SpaceSettingsHeader'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SpacesEditorManager } from '@/lib/space-studio-manager'

const defaultLayouts = [
  {
    id: 'sidebar-right-footer',
    name: 'Sidebar Right + Footer',
    description: 'Content with right sidebar and bottom footer',
    icon: Layout
  },
  {
    id: 'sidebar-left-header-top',
    name: 'Sidebar Left + Header Top',
    description: 'Classic app layout with left sidebar and top header',
    icon: Layout
  }
] as const

type LayoutTemplate = {
  id: string
  name: string
  description?: string
  allowedSpaceIds?: string[]
}

function loadTemplates(): LayoutTemplate[] {
  try {
    return JSON.parse(localStorage.getItem('space_layout_templates') || '[]')
  } catch {
    return []
  }
}

export default function LayoutSelectionPage() {
  const params = useParams() as { space: string }
  const router = useRouter()
  const searchParams = useSearchParams()
  const spaceSlug = params.space
  const fromDataManagement = searchParams?.get('from') === 'data-management'
  const fromSpaceSidebar = searchParams?.get('from') === 'space-sidebar'
  const { currentSpace, spaces } = useSpace()
  const [adminTemplates, setAdminTemplates] = useState<LayoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [proposedName, setProposedName] = useState('Customer Layout 1')
  const [creating, setCreating] = useState(false)

  const selectedSpace = useMemo(() => {
    return spaces.find((s: any) => s.id === params.space || s.slug === params.space) || currentSpace
  }, [spaces, currentSpace, params.space])

  const [savedLayout, setSavedLayout] = useState<any>(null)

  // Get homepage for "Go to Space" button
  const homepage = useMemo(() => {
    // This would typically come from editor pages, but for now return null
    return null
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const templates = loadTemplates()
      setAdminTemplates(templates)
      
      // Load saved layout config for this space
      // Try both ID and slug since layouts might be saved with either
      const spaceId = selectedSpace?.id
      const spaceSlugValue = selectedSpace?.slug || params.space || spaceSlug
      let foundLayout = false
      
      // Try with space ID first, then slug
      const identifiersToTry = spaceId ? [spaceId, spaceSlugValue] : [spaceSlugValue]
      
      for (const identifier of identifiersToTry) {
        if (!identifier || foundLayout) break
        
        try {
          // Try to get from SpacesEditorManager
          const savedConfig = await SpacesEditorManager.getLayoutConfig(identifier)
          console.log(`Loaded layout config for ${identifier}:`, savedConfig)
          
          if (savedConfig && Object.keys(savedConfig).length > 0) {
            // Check if config has any meaningful data
            const hasName = savedConfig.name || savedConfig.title || savedConfig.meta?.name
            const hasConfig = savedConfig.sidebar || savedConfig.top || savedConfig.footer || 
                            savedConfig.pages || savedConfig.allPages || savedConfig.placedWidgets
            
            if (hasName || hasConfig) {
              const layoutName = savedConfig.name || savedConfig.title || savedConfig.meta?.name || 
                                (selectedSpace?.name ? `${selectedSpace.name} Layout` : 'Current Layout')
              setSavedLayout({
                id: encodeURIComponent(layoutName),
                name: layoutName,
                description: savedConfig.description || 'Saved layout configuration',
                config: savedConfig
              })
              foundLayout = true
              console.log('Set saved layout:', layoutName)
              break // Found layout, no need to try other identifiers
            }
          }
        } catch (error) {
          console.error(`Error loading saved layout for ${identifier}:`, error)
        }
      }
      
      // Also try to get from database versions API as fallback (only works with UUID)
      if (!foundLayout && spaceId) {
        try {
          const response = await fetch(`/api/spaces/${spaceId}/layout/versions`)
          if (response.ok) {
            const data = await response.json()
            const currentVersion = data.versions?.find((v: any) => v.is_current)
            if (currentVersion && currentVersion.layout_config) {
              const layoutConfig = typeof currentVersion.layout_config === 'string' 
                ? JSON.parse(currentVersion.layout_config)
                : currentVersion.layout_config
              
              if (layoutConfig && Object.keys(layoutConfig).length > 0) {
                const layoutName = layoutConfig.name || layoutConfig.title || 
                                 (selectedSpace?.name ? `${selectedSpace.name} Layout` : 'Current Layout')
                setSavedLayout({
                  id: encodeURIComponent(layoutName),
                  name: layoutName,
                  description: layoutConfig.description || 'Saved layout configuration',
                  config: layoutConfig
                })
                console.log('Set saved layout from versions API:', layoutName)
              }
            }
          }
        } catch (versionError) {
          console.warn('Error loading from versions API:', versionError)
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [selectedSpace, params.space, spaceSlug])

  // Get allowed layouts for this space
  const allowedLayouts = useMemo(() => {
    const spaceId = selectedSpace?.id || params.space
    
    // Get admin templates allowed for this space
    const allowedAdminTemplates = adminTemplates.filter(t => 
      !t.allowedSpaceIds || t.allowedSpaceIds.length === 0 || t.allowedSpaceIds.includes(spaceId)
    )

    // Map admin templates
    const adminLayouts = allowedAdminTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      icon: Layout,
      isDefault: false
    }))

    // Add saved layout if it exists
    const layouts = [...adminLayouts]
    if (savedLayout) {
      layouts.push({
        id: savedLayout.id,
        name: savedLayout.name,
        description: savedLayout.description,
        icon: Layout,
        isDefault: false
      })
    }

    return layouts
  }, [adminTemplates, selectedSpace, params.space, savedLayout])

  const handleCreateNewLayout = () => {
    // Open name dialog with a default proposal
    (async () => {
      const cfg = await SpacesEditorManager.getLayoutConfig(spaceSlug)
      let base = 'Customer Layout'
      let num = 1
      if (cfg?.name && typeof cfg.name === 'string') {
        const m = String(cfg.name).match(/^(.*?)(\s(\d+))?$/)
        if (m) {
          base = (m[1] || 'Customer Layout').trim() || 'Customer Layout'
          if (m[3]) {
            const n = parseInt(m[3])
            if (!Number.isNaN(n)) num = n + 1
          }
        }
      }
      setProposedName(`${base} ${num}`)
      setCreateOpen(true)
    })()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading layouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Only show header if NOT accessed from data management (where breadcrumbs show the info) */}
      {!fromDataManagement && !fromSpaceSidebar && (
        <SpaceSettingsHeader
          spaceName={selectedSpace?.name || 'Space Settings'}
          spaceDescription={selectedSpace?.description}
          isActive={selectedSpace?.is_active}
          homepage={homepage}
          spaceSlug={selectedSpace?.slug}
          spaceId={selectedSpace?.id}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Only show sidebar in body if NOT accessed from data management (where it's shown in secondary sidebar) */}
        {!fromDataManagement && !fromSpaceSidebar && (
          <SpaceSettingsSidebar
            activeTab="details"
            onTabChange={(value) => {
              const params = new URLSearchParams()
              params.set('tab', value)
              if (fromDataManagement) {
                params.set('from', 'data-management')
              } else if (fromSpaceSidebar) {
                params.set('from', 'space-sidebar')
              }
              router.push(`/${spaceSlug}/settings?${params.toString()}`)
            }}
            showAllTabs={false}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto space-y-6 p-6 m-0">
            {/* Layout Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Existing Layouts */}
              {allowedLayouts.map((layout) => {
                const Icon = layout.icon
                return (
                  <Card key={layout.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {layout.name}
                      </CardTitle>
                      <CardDescription>
                        {layout.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const params = new URLSearchParams()
                          if (fromDataManagement) {
                            params.set('from', 'data-management')
                          } else if (fromSpaceSidebar) {
                            params.set('from', 'space-sidebar')
                          }
                          const queryString = params.toString()
                          router.push(`/${spaceSlug}/settings/layout/${layout.id}${queryString ? `?${queryString}` : ''}`)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
              
              {/* Create New Layout Placeholder Card */}
              <Card 
                className="hover:shadow-lg transition-shadow border-dashed border-2 border-border bg-muted/50 cursor-pointer"
                onClick={handleCreateNewLayout}
              >
                <CardHeader className="flex items-center justify-center min-h-[120px]">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-muted p-3">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-foreground">
                      Create New Layout
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Start from scratch or use a template
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

          {/* Create Layout Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create layout</DialogTitle>
                <DialogDescription>Set a name for your new layout.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-xs font-medium">Layout name</label>
                <Input value={proposedName} onChange={(e) => setProposedName(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!proposedName.trim()) return
                    setCreating(true)
                    try {
                      // Create the record immediately
                      await SpacesEditorManager.saveLayoutConfig(spaceSlug, { name: proposedName.trim() })
                      setCreateOpen(false)
                      // Navigate to layout config page using the chosen name as the route param
                      const params = new URLSearchParams()
                      if (fromDataManagement) {
                        params.set('from', 'data-management')
                      } else if (fromSpaceSidebar) {
                        params.set('from', 'space-sidebar')
                      }
                      const queryString = params.toString()
                      router.push(`/${spaceSlug}/settings/layout/${encodeURIComponent(proposedName.trim())}${queryString ? `?${queryString}` : ''}`)
                    } finally {
                      setCreating(false)
                    }
                  }}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

