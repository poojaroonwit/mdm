'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { ComponentConfig, UnifiedPage } from './layout-config/types'
import { layoutPresets, builtInPagesMap } from './layout-config/constants'
import { widgetsPalette, PlacedWidget, WidgetType } from './layout-config/widgets'
import { LayoutTitle } from './layout-config/LayoutTitle'
import { PageType } from './layout-config/LayoutTitle'
// Sidebar visibility utilities removed - pages now use secondary platform sidebar
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { useMobileViewport } from './layout-config/useMobileViewport'
import { useLayoutKeyboardShortcuts } from './layout-config/useLayoutKeyboardShortcuts'
import { LayoutConfigView } from './layout-config/LayoutConfigView'

export default function LayoutConfig({ spaceId, layoutName: initialLayoutName }: { spaceId: string; layoutName?: string }) {
  const params = useParams() as { space?: string; layoutname?: string }
  const router = useRouter()
  const [previewScale, setPreviewScale] = useState<number>(1)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [pages, setPages] = useState<SpacesEditorPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [builtInPageOrder, setBuiltInPageOrder] = useState<string[]>([])
  const [pageOrder, setPageOrder] = useState<string[]>([]) // Stores the complete mixed order of all pages
  const pageOrderRef = useRef<string[]>([]) // Ref to track current order without causing re-renders
  
  // Keep ref in sync with state
  useEffect(() => {
    pageOrderRef.current = pageOrder
  }, [pageOrder])
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedPageForPermissions, setSelectedPageForPermissions] = useState<SpacesEditorPage | null>(null)
  const [spaceUsers, setSpaceUsers] = useState<Array<{ id: string; name: string; email: string; space_role: string }>>([])
  const [permissionsRoles, setPermissionsRoles] = useState<string[]>([])
  const [permissionsUserIds, setPermissionsUserIds] = useState<string[]>([])
  const [permissionsGroupIds, setPermissionsGroupIds] = useState<string[]>([])
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string }>>([])
  const isMobileViewport = useMobileViewport()
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  
  // Track if we're performing undo/redo to avoid adding to history
  const isUndoRedoOperation = useRef(false)
  const lastWidgetStateRef = useRef<PlacedWidget[]>([])
  
  // Undo/Redo hook for widget operations
  const {
    state: widgetHistoryState,
    setState: setWidgetHistory,
    undo: undoWidgets,
    redo: redoWidgets,
    canUndo,
    canRedo
  } = useUndoRedo<PlacedWidget[]>([])
  
  const [placedWidgets, setPlacedWidgetsState] = useState<PlacedWidget[]>([])
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<Set<string>>(new Set())
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [isDraggingWidget, setIsDraggingWidget] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [clipboardWidget, setClipboardWidget] = useState<PlacedWidget | null>(null)
  const [clipboardWidgets, setClipboardWidgets] = useState<PlacedWidget[]>([]) // For multi-copy
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false)
  const [mobileExportDialogOpen, setMobileExportDialogOpen] = useState(false)
  const [showDataModelPanel, setShowDataModelPanel] = useState(true)
  const [widgetPanelOpen, setWidgetPanelOpen] = useState(true) // Floating widget panel, open by default
  const searchParams = useSearchParams()
  const urlPageType = searchParams.get('pageType') as PageType | null
  const [pageType, setPageType] = useState<PageType>(urlPageType || 'general')
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Wrapper for setPlacedWidgets that tracks history
  const setPlacedWidgets = useCallback((updater: React.SetStateAction<PlacedWidget[]>) => {
    setPlacedWidgetsState(prev => {
      const newWidgets = typeof updater === 'function' ? updater(prev) : updater
      
      // Add to history if not an undo/redo operation and state actually changed
      if (!isUndoRedoOperation.current) {
        const stateChanged = JSON.stringify(lastWidgetStateRef.current) !== JSON.stringify(newWidgets)
        if (stateChanged) {
          // Use a debounce-like approach for rapid updates (like dragging)
          clearTimeout((setPlacedWidgets as any).historyTimeout)
          ;(setPlacedWidgets as any).historyTimeout = setTimeout(() => {
            if (!isUndoRedoOperation.current && JSON.stringify(lastWidgetStateRef.current) !== JSON.stringify(newWidgets)) {
              setWidgetHistory(newWidgets)
              lastWidgetStateRef.current = newWidgets
            }
          }, 300) // Wait 300ms after last change before adding to history
        }
      } else {
        lastWidgetStateRef.current = newWidgets
      }
      
      return newWidgets
    })
  }, [setWidgetHistory])
  
  // Initialize history with current widgets
  useEffect(() => {
    if (placedWidgets.length > 0 && widgetHistoryState.length === 0) {
      setWidgetHistory(placedWidgets)
      lastWidgetStateRef.current = placedWidgets
    }
  }, [placedWidgets, widgetHistoryState.length, setWidgetHistory])
  
  // Alias for backward compatibility
  const updatePlacedWidgets = setPlacedWidgets
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [layoutName, setLayoutName] = useState<string>('Layout')
  const [canvasMode, setCanvasMode] = useState<'freeform' | 'grid'>('freeform')
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20) // Grid size in pixels
  const [allPages, setAllPages] = useState<UnifiedPage[]>([]) // Unified pages list for display
  const [componentConfigs, setComponentConfigs] = useState<Record<string, ComponentConfig>>({
    // Sidebar, top, and footer removed - pages now use secondary platform sidebar
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset any drag state on unmount
      setIsDraggingWidget(false)
      setDragOffset({ x: 0, y: 0 })
    }
  }, [])

  // Load saved layout on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      // Determine if initialLayoutName corresponds to a preset
      const hasPreset = !!(initialLayoutName && layoutPresets[initialLayoutName])

      // First, apply preset if initialLayoutName matches a preset
      if (hasPreset) {
        const preset = layoutPresets[initialLayoutName]
        if (mounted) {
          setComponentConfigs((prev) => {
            const next = { ...prev }
            // Sidebar, top, and footer removed - pages now use secondary platform sidebar
            return next
          })
          const displayName = initialLayoutName === 'blank' ? 'Start from Scratch' : 
                       initialLayoutName === 'sidebar-left-header-top' ? 'Sidebar Left + Header Top' :
                       initialLayoutName === 'header-top-of-sidebar' ? 'Header Top of Sidebar' :
                       initialLayoutName === 'sidebar-right-footer' ? 'Sidebar Right + Footer' : initialLayoutName
          setLayoutName(displayName)
        }
      }
      
      try {
        const saved = await SpacesEditorManager.getLayoutConfig(spaceId)
        // Load saved config when no preset is being applied
        if (saved && mounted && !hasPreset) {
          setComponentConfigs((prev) => ({ ...prev, ...saved }))
          const name = (saved && (saved.name || saved.title || saved.meta?.name)) || null
          if (name) setLayoutName(name as string)
        }
      } catch {}
      try {
        const spacePages = await SpacesEditorManager.getPages(spaceId)
        if (mounted) setPages(spacePages || [])
      } catch {}
      try {
        const res = await fetch(`/api/spaces/${spaceId}/users`)
        if (res.ok) {
          const data = await res.json()
          if (mounted) setSpaceUsers(data.users || [])
        }
      } catch {}
      try {
        const res = await fetch('/api/user-groups')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setUserGroups(data.groups || [])
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [spaceId, initialLayoutName])

  const handleSave = useCallback(async () => {
    try {
      const layoutConfig = { 
        ...componentConfigs, 
        name: layoutName,
        placedWidgets,
        allPages,
        selectedPageId,
      }
      
      // Save layout config
      await SpacesEditorManager.saveLayoutConfig(spaceId, layoutConfig)
      
      // Create version automatically
      try {
        const res = await fetch(`/api/spaces/${spaceId}/layout/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layoutConfig,
            changeDescription: 'Auto-saved layout',
          }),
        })
        if (!res.ok) {
          console.warn('Failed to create version, but layout saved')
        }
      } catch (versionError) {
        console.warn('Version creation failed:', versionError)
      }
      
      toast.success('Layout saved')
    } catch (e) {
      toast.error('Failed to save layout')
    }
  }, [componentConfigs, layoutName, spaceId, placedWidgets, allPages, selectedPageId])

  const handleComponentConfigUpdate = useCallback((type: string, updates: Partial<ComponentConfig>) => {
    setComponentConfigs((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }))
  }, []);

  // Sidebar visibility functions removed - pages now use secondary platform sidebar

  // Update unified pages list when built-in order or custom pages change
  useEffect(() => {
    // Load custom pages with icon resolution
    const loadCustomPageIcons = async () => {
      const builtInPagesList: UnifiedPage[] = builtInPageOrder.map(id => ({
        id,
        name: builtInPagesMap[id]?.name || id,
        type: 'built-in' as const,
        icon: builtInPagesMap[id]?.icon,
      }))
      
      const customPagesWithIcons: UnifiedPage[] = await Promise.all(pages.map(async p => {
        let IconComponent: React.ComponentType<{ className?: string }> | undefined
        
        if (p.icon) {
          // Handle different icon formats
          if (p.icon.startsWith('lucide-')) {
            const iconName = p.icon.replace('lucide-', '')
            try {
              const icons = await import('lucide-react')
              IconComponent = (icons as any)[iconName]
            } catch (error) {
              console.warn(`Icon "${iconName}" not found in lucide-react`, error)
            }
          } else if (p.icon.includes('-') && !p.icon.startsWith('letter-') && !p.icon.startsWith('number-') && !p.icon.startsWith('roman-') && !p.icon.startsWith('color-')) {
            // React icon - try to load dynamically (only if react-icons is available)
            const [prefix, ...rest] = p.icon.split('-')
            const iconName = rest.join('-')
            try {
              // Use Function constructor to prevent Next.js build-time analysis
              const createDynamicImport = (path: string) => {
                // Use eval-style dynamic import that Next.js can't analyze
                return new Function('return import("' + path + '")')()
              }
              // @ts-ignore - react-icons may not be installed
              const iconModule = await createDynamicImport(`react-icons/${prefix}`)
              IconComponent = (iconModule as any)?.[iconName]
            } catch (error) {
              // Silently ignore - react-icons may not be installed
            }
          } else if (!p.icon.startsWith('letter-') && !p.icon.startsWith('number-') && !p.icon.startsWith('roman-') && !p.icon.startsWith('color-')) {
            // Legacy format - try lucide-react
            try {
              const icons = await import('lucide-react')
              IconComponent = (icons as any)[p.icon!]
            } catch (error) {
              console.warn(`Icon "${p.icon}" not found in lucide-react`, error)
            }
          }
          // Note: letter-, number-, roman-, color- icons are handled as text/color, not icon components
        }
        
        return {
          id: p.id,
          name: p.displayName || p.name || '',
          type: 'custom' as const,
          page: p,
          icon: IconComponent,
        }
      }))
      
      // Include special items (separator/label/text/header/image/badge) from current allPages
      const specialItems = allPages.filter(p => !['built-in','custom'].includes(p.type))
      
      // Create a map for quick lookup (built-in + custom + specials)
      const allPagesMap = new Map<string, UnifiedPage>()
      builtInPagesList.forEach(p => allPagesMap.set(p.id, p))
      customPagesWithIcons.forEach(p => allPagesMap.set(p.id, p))
      specialItems.forEach(p => allPagesMap.set(p.id, p))
      
      // If we have a stored page order, use it; otherwise, use default order
      const currentOrder = pageOrderRef.current
      if (currentOrder.length > 0) {
        // Rebuild based on stored order
        const orderedPages: UnifiedPage[] = []
        const seenIds = new Set<string>()
        
        // First, add pages in stored order
        currentOrder.forEach(id => {
          const page = allPagesMap.get(id)
          if (page) {
            orderedPages.push(page)
            seenIds.add(id)
          }
        })
        
        // Then, add any new items not in the order (including specials)
        const allExistingPages = builtInPagesList.concat(customPagesWithIcons, specialItems)
        allExistingPages.forEach((page: UnifiedPage) => {
          if (!seenIds.has(page.id)) {
            orderedPages.push(page)
          }
        })
        
        setAllPages(orderedPages)
      } else {
        // Initial load: use default order (include specials if already present) and store it
        const defaultOrder = builtInPagesList.concat(customPagesWithIcons, specialItems)
        setAllPages(defaultOrder)
        const defaultOrderIds = defaultOrder.map(p => p.id)
        setPageOrder(defaultOrderIds)
        pageOrderRef.current = defaultOrderIds
      }
    }
    
    loadCustomPageIcons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtInPageOrder, pages])

  // Handle page reordering
  const handlePageReorder = useCallback(async (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => {
    if (fromIndex === toIndex) return
    
    const prevAllPages = [...currentPages]
    const [moved] = prevAllPages.splice(fromIndex, 1)
    prevAllPages.splice(toIndex, 0, moved)
    
    // Store the new mixed order
    const newPageOrder = prevAllPages.map(p => p.id)
    setPageOrder(newPageOrder)
    pageOrderRef.current = newPageOrder
    
    // Update allPages state immediately for UI feedback
    setAllPages(prevAllPages)
    
    // Separate built-in and custom pages for persistence
    const newBuiltInOrder: string[] = []
    const newCustomPages: SpacesEditorPage[] = []
    
    prevAllPages.forEach(page => {
      if (page.type === 'built-in') {
        newBuiltInOrder.push(page.id)
      } else if (page.page) {
        newCustomPages.push(page.page)
      }
    })
    
    // Update built-in order
    setBuiltInPageOrder(newBuiltInOrder)
    
    // Update custom pages order (but preserve their position in the mixed list)
    if (newCustomPages.length > 0) {
      // Calculate order based on position in the mixed list
      const customPageOrderMap = new Map<string, number>()
      prevAllPages.forEach((page, index) => {
        if (page.type === 'custom' && page.page) {
          customPageOrderMap.set(page.page.id, index)
        }
      })
      
      const updatedPages = newCustomPages.map(p => ({
        ...p,
        order: customPageOrderMap.get(p.id) ?? 0
      }))
      setPages(updatedPages)
      
      // Save custom pages order
      try {
        await Promise.all(updatedPages.map(p => 
          SpacesEditorManager.updatePage(spaceId, p.id, { order: customPageOrderMap.get(p.id) ?? 0 })
        ))
        toast.success('Pages reordered')
      } catch (err) {
        toast.error('Failed to save page order')
        setPages(currentCustomPages)
        // Revert allPages to previous state
        setAllPages(currentPages)
        const previousOrder = currentPages.map(p => p.id)
        setPageOrder(previousOrder)
        pageOrderRef.current = previousOrder
        console.error(err)
      }
    } else {
      // Still update built-in order even if no custom pages
      setBuiltInPageOrder(newBuiltInOrder)
      toast.success('Pages reordered')
    }
  }, [spaceId, setAllPages])

  useLayoutKeyboardShortcuts({
    selectedWidgetId,
    selectedWidgetIds,
    placedWidgets,
    clipboardWidget,
    clipboardWidgets,
    selectedPageId,
    allPages,
    canvasMode,
    gridSize,
    canUndo,
    canRedo,
    undoWidgets,
    redoWidgets,
    updatePlacedWidgets,
    setSelectedWidgetIds,
    setSelectedWidgetId,
    setClipboardWidgets,
    setClipboardWidget,
    setPlacedWidgets,
    setSelectedPageId,
    setSelectedComponent,
    isUndoRedoOperation,
  })

  return (
    <LayoutConfigView
      isMobileViewport={isMobileViewport}
      deviceMode={deviceMode}
      componentConfigs={componentConfigs}
      setDeviceMode={setDeviceMode}
      setPreviewScale={setPreviewScale}
      handleComponentConfigUpdate={handleComponentConfigUpdate}
      setSelectedComponent={setSelectedComponent}
      handleSave={handleSave}
      layoutName={layoutName}
      setLayoutName={setLayoutName}
      canvasMode={canvasMode}
      setCanvasMode={setCanvasMode}
      showGrid={showGrid}
      setShowGrid={setShowGrid}
      gridSize={gridSize}
      setGridSize={setGridSize}
      spaceId={spaceId}
      setVersionsDialogOpen={setVersionsDialogOpen}
      showDataModelPanel={showDataModelPanel}
      setShowDataModelPanel={setShowDataModelPanel}
      setMobileExportDialogOpen={setMobileExportDialogOpen}
      pageType={pageType}
      setPageType={setPageType}
      versionsDialogOpen={versionsDialogOpen}
      placedWidgets={placedWidgets}
      allPages={allPages}
      selectedPageId={selectedPageId}
      setComponentConfigs={setComponentConfigs}
      setPlacedWidgetsState={setPlacedWidgetsState}
      setAllPages={setAllPages}
      setSelectedPageId={setSelectedPageId}
      previewScale={previewScale}
      selectedComponent={selectedComponent}
      canvasRef={canvasRef}
      isDraggingWidget={isDraggingWidget}
      selectedWidgetId={selectedWidgetId}
      selectedWidgetIds={selectedWidgetIds}
      dragOffset={dragOffset}
      setPlacedWidgets={setPlacedWidgets}
      setSelectedWidgetId={setSelectedWidgetId}
      setSelectedWidgetIds={setSelectedWidgetIds}
      setIsDraggingWidget={setIsDraggingWidget}
      setDragOffset={setDragOffset}
      clipboardWidget={clipboardWidget}
      clipboardWidgets={clipboardWidgets}
      widgetPanelOpen={widgetPanelOpen}
      setWidgetPanelOpen={setWidgetPanelOpen}
      pages={pages}
      expandedComponent={expandedComponent}
      setPages={setPages}
      setExpandedComponent={setExpandedComponent}
      setSelectedPageForPermissions={setSelectedPageForPermissions}
      setPermissionsRoles={setPermissionsRoles}
      setPermissionsUserIds={setPermissionsUserIds}
      setPermissionsGroupIds={setPermissionsGroupIds}
      setPermissionsDialogOpen={setPermissionsDialogOpen}
      handlePageReorder={handlePageReorder}
      mobileSettingsOpen={mobileSettingsOpen}
      setMobileSettingsOpen={setMobileSettingsOpen}
      permissionsDialogOpen={permissionsDialogOpen}
      selectedPageForPermissions={selectedPageForPermissions}
      spaceUsers={spaceUsers}
      permissionsRoles={permissionsRoles}
      permissionsUserIds={permissionsUserIds}
      permissionsGroupIds={permissionsGroupIds}
      userGroups={userGroups}
      mobileExportDialogOpen={mobileExportDialogOpen}
    />
  )

}