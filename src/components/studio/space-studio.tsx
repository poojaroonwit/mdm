'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSpacesEditor } from '@/hooks/use-space-studio'
import { PagesManagement } from '@/components/studio/pages-management'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import {
  Layout,
  PanelLeft,
  PanelTop,
  Square,
  PanelBottom,
  ChevronDown,
  ChevronUp,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react'

type ComponentType =
  | 'sidebar'
  | 'top'
  | 'footer'

type ComponentConfig = {
  type: ComponentType
  visible: boolean
  position?: 'left' | 'right' | 'top' | 'bottom' | 'topOfSidebar'
  width?: number
  height?: number
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  fontSize?: number
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
  opacity?: number
  zIndex?: number
  shadow?: boolean
  sticky?: boolean
}

export interface SpaceStudioProps {
  spaceId: string
  onComponentConfigChange?: (config: ComponentConfig) => void
}

export function SpaceStudio({
  spaceId,
  onComponentConfigChange
}: SpaceStudioProps) {
  const router = useRouter()
  const { 
    pages,
    templates,
    createPage,
    updatePage,
    deletePage,
    assignTemplateToPage
  } = useSpacesEditor(spaceId)
  const [activeTab, setActiveTab] = useState<'layout' | 'pages'>('layout')
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [componentConfigs, setComponentConfigs] = useState<Record<string, ComponentConfig>>({
    sidebar: { 
      type: 'sidebar', 
      visible: true, 
      position: 'left', 
      width: 250, 
      backgroundColor: '#ffffff', 
      textColor: '#374151',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 0,
      padding: 16,
      margin: 0,
      fontSize: 14,
      fontWeight: 'normal',
      opacity: 100,
      zIndex: 1,
      shadow: false,
      sticky: false
    },
    top: { 
      type: 'top', 
      visible: true, 
      position: 'top', 
      height: 64, 
      width: 220, 
      backgroundColor: '#ffffff', 
      textColor: '#374151',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 0,
      padding: 16,
      margin: 0,
      fontSize: 14,
      fontWeight: 'normal',
      opacity: 100,
      zIndex: 2,
      shadow: false,
      sticky: true
    },
    footer: { 
      type: 'footer', 
      visible: false, 
      position: 'bottom', 
      height: 60, 
      backgroundColor: '#f9fafb', 
      textColor: '#6b7280',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 0,
      padding: 16,
      margin: 0,
      fontSize: 14,
      fontWeight: 'normal',
      opacity: 100,
      zIndex: 1,
      shadow: false,
      sticky: false
    }
  })

  const handleComponentConfigUpdate = useCallback((type: string, updates: Partial<ComponentConfig>) => {
    const newConfigs = {
      ...componentConfigs,
      [type]: {
        ...componentConfigs[type],
        ...updates
      }
    }
    setComponentConfigs(newConfigs)
    if (newConfigs[type]) {
      onComponentConfigChange?.(newConfigs[type])
    }
  }, [componentConfigs, onComponentConfigChange])

  const availableComponents = [
    { type: 'sidebar', label: 'Sidebar', icon: PanelLeft },
    { type: 'top', label: 'Header', icon: PanelTop },
    { type: 'footer', label: 'Footer', icon: PanelBottom }
  ]

  const handleSaveLayout = useCallback(() => {
    try {
      // Save via API/manager (with localStorage fallback inside manager)
      SpacesEditorManager.saveLayoutConfig(spaceId, componentConfigs)
      toast.success('Layout saved')
    } catch (error) {
      console.error('Failed to save layout', error)
      toast.error('Failed to save layout')
    }
  }, [componentConfigs, spaceId])

  const defaultConfigs: Record<string, ComponentConfig> = {
    sidebar: { 
      type: 'sidebar', visible: true, position: 'left', width: 250,
      backgroundColor: '#ffffff', textColor: '#374151', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0,
      padding: 16, margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 100, zIndex: 1, shadow: false, sticky: false
    },
    top: { 
      type: 'top', visible: true, position: 'top', height: 64, width: 220,
      backgroundColor: '#ffffff', textColor: '#374151', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0,
      padding: 16, margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 100, zIndex: 2, shadow: false, sticky: true
    },
    footer: {
      type: 'footer', visible: false, position: 'bottom', height: 60,
      backgroundColor: '#f9fafb', textColor: '#6b7280', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0,
      padding: 16, margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 100, zIndex: 1, shadow: false, sticky: false
    }
  }

  const handleResetLayout = useCallback(() => {
    setComponentConfigs(defaultConfigs)
    SpacesEditorManager.saveLayoutConfig(spaceId, defaultConfigs).catch((error) => {
      console.error('Failed to persist reset layout', error)
    })
    toast.success('Layout reset to defaults')
  }, [defaultConfigs, spaceId])

  const handleSaveLayoutAsNewPage = useCallback(async () => {
    try {
      await SpacesEditorManager.saveLayoutConfig(spaceId, componentConfigs)

      // Create a new page using the current layout name/preset
      const newPage = await createPage({
        name: `layout_${Date.now()}`,
        displayName: 'New Page from Layout',
      })

      // Navigate to page studio in the same tab
      router.push(`/${spaceId}/studio/page/${newPage.id}`)
      toast.success('Page created from layout')
    } catch (error) {
      console.error('Failed to save layout as new page', error)
      toast.error('Failed to create page')
    }
  }, [componentConfigs, createPage, router, spaceId])

  // Seeded layouts
  const layoutSeeds = [
    {
      id: 'layout_sidebar_left_header_top',
      name: 'Sidebar Left + Header Top',
      description: 'Classic app layout with left sidebar and top header',
      preset: {
        sidebar: { visible: true, position: 'left', width: 250 },
        top: { visible: true, position: 'top', height: 64 },
        footer: { visible: false, height: 60 }
      }
    },
    {
      id: 'layout_header_top_of_sidebar',
      name: 'Header Top of Sidebar',
      description: 'Header stacked above the sidebar column',
      preset: {
        sidebar: { visible: true, position: 'left', width: 260 },
        top: { visible: true, position: 'topOfSidebar', height: 56 },
        footer: { visible: false, height: 60 }
      }
    },
    {
      id: 'layout_sidebar_right_footer',
      name: 'Sidebar Right + Footer',
      description: 'Content with right sidebar and bottom footer',
      preset: {
        sidebar: { visible: true, position: 'right', width: 260 },
        top: { visible: false, height: 64 },
        footer: { visible: true, height: 56 }
      }
    },
    {
      id: 'layout_blank',
      name: 'Blank',
      description: 'Start from scratch and configure later',
      preset: {
        sidebar: { visible: false, position: 'left', width: 250 },
        top: { visible: false, position: 'top', height: 64 },
        footer: { visible: false, height: 60 }
      }
    }
  ] as const

  const selectionKey = `spaces_editor_selected_layout_${spaceId}`
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)

  const applyPreset = useCallback((preset: Partial<Record<keyof typeof componentConfigs, Partial<ComponentConfig>>>) => {
    const next = { ...componentConfigs }
    if (preset.sidebar) next.sidebar = { ...next.sidebar, ...preset.sidebar }
    if (preset.top) next.top = { ...next.top, ...preset.top }
    if (preset.footer) next.footer = { ...next.footer, ...preset.footer }
    setComponentConfigs(next)
  }, [componentConfigs])

  const configRef = useRef<HTMLDivElement>(null)

  const handleSelectLayout = useCallback((layoutId: string, preset: any) => {
    setSelectedLayoutId(layoutId)
    try { localStorage.setItem(selectionKey, layoutId) } catch {}
    applyPreset(preset)
    toast.success('Layout selected')
  }, [applyPreset, selectionKey])

  const handleEditLayout = useCallback(() => {
    // Navigate to dedicated layout configuration screen
    router.push(`/${spaceId}/studio/layout`)
  }, [router, spaceId])

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(selectionKey)
      if (saved) setSelectedLayoutId(saved)
    } catch {}
  }, [selectionKey])

  // Load saved layout config on mount
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const saved = await SpacesEditorManager.getLayoutConfig(spaceId)
        if (saved && mounted) {
          setComponentConfigs((prev) => ({ ...prev, ...saved }))
        }
      } catch (e) {
        // ignore, preview continues with defaults
      }
    })()
    return () => { mounted = false }
  }, [spaceId])

  // helper: templates allowed for this space from admin
  const adminTemplates = (() => {
    try { return JSON.parse(localStorage.getItem('space_layout_templates') || '[]') } catch { return [] }
  })() as Array<{ id: string; name: string; description?: string; allowedSpaceIds?: string[] }>
  const allowedTemplates = adminTemplates.filter(t => (t.allowedSpaceIds || []).includes(spaceId))
  const [layoutQuery, setLayoutQuery] = useState('')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'layout' | 'pages')}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Space Layout
          </TabsTrigger>
          <TabsTrigger value="pages">
            <Square className="h-4 w-4 mr-2" />
            Space Pages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          {/* Allowed layout templates from Admin; fallback to seeds if none configured */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(allowedTemplates.length > 0 ? allowedTemplates : layoutSeeds).map((seed: any) => {
              const isCurrent = selectedLayoutId === seed.id
              return (
                <Card key={seed.id} className={`${isCurrent ? 'border-blue-500' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        {seed.name}
                      </CardTitle>
                      {isCurrent && (
                        <Badge variant="secondary" className="border border-primary text-primary bg-primary/10">Current</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{seed.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" onClick={() => handleSelectLayout(seed.id, seed.preset || {})}>Use</Button>
                      {isCurrent && (
                        <Button onClick={handleEditLayout}>Edit</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {/* Create New Layout */}
            {allowedTemplates.length === 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Create New Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Start from an empty layout and configure components.</p>
                <Button
                  onClick={() => {
                    const customId = `custom_${Date.now()}`
                    setSelectedLayoutId(customId)
                    try { localStorage.setItem(selectionKey, customId) } catch {}
                    applyPreset({
                      sidebar: { visible: false },
                      top: { visible: false },
                      footer: { visible: false }
                    })
                    toast.success('New layout created')
                  }}
                >
                  Create
                </Button>
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        {/* Space Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <PagesManagement
            spaceId={spaceId}
            pages={pages}
            templates={templates}
            onCreatePage={(p) => createPage(p)}
            onUpdatePage={updatePage}
            onDeletePage={deletePage}
            onAssignTemplate={assignTemplateToPage}
            onEditPage={(page) => router.push(`/${spaceId}/studio/page/${page.id}`)}
            onViewPage={(page) => router.push(`/${spaceId}/studio/template/${page.templateId || 'new'}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SpaceStudio


