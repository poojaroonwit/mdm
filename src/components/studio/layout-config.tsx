'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { ComponentConfig, UnifiedPage } from './layout-config/types'
import { layoutPresets, builtInPagesMap } from './layout-config/constants'
import { widgetsPalette, PlacedWidget, WidgetType } from './layout-config/widgets'
import { SettingsPanelContent } from './layout-config/SettingsPanelContent'
import { LayoutTitle } from './layout-config/LayoutTitle'
import { LayoutToolbar } from './layout-config/LayoutToolbar'
import { PageType } from './layout-config/LayoutTitle'
import { Preview } from './layout-config/Preview'
import { PermissionsDialog } from './layout-config/PermissionsDialog'
import { LayoutVersionControlDialog } from './layout-config/LayoutVersionControlDialog'
import { DataModelExplorer } from './layout-config/DataModelExplorer'
import { MobileExportDialog } from './mobile-export-dialog'
// Sidebar visibility utilities removed - pages now use secondary platform sidebar
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { useMobileViewport } from './layout-config/useMobileViewport'

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

  // Handle keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not in an input/textarea/contenteditable
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Undo (Ctrl+Z or Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          isUndoRedoOperation.current = true
          const previousWidgets = undoWidgets()
          if (previousWidgets) {
            setPlacedWidgets(previousWidgets)
            toast.success('Undo')
          }
          setTimeout(() => {
            isUndoRedoOperation.current = false
          }, 0)
        }
        return
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z or Cmd+Y)
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        if (canRedo) {
          isUndoRedoOperation.current = true
          const nextWidgets = redoWidgets()
          if (nextWidgets) {
            setPlacedWidgets(nextWidgets)
            toast.success('Redo')
          }
          setTimeout(() => {
            isUndoRedoOperation.current = false
          }, 0)
        }
        return
      }

      // Select All (Ctrl+A or Cmd+A)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const currentPageWidgets = placedWidgets.filter(w => 
          w.pageId === selectedPageId || (!selectedPageId && placedWidgets.length > 0 && w.pageId === placedWidgets[0].pageId)
        )
        if (currentPageWidgets.length > 0) {
          setSelectedWidgetIds(new Set(currentPageWidgets.map(w => w.id)))
          setSelectedWidgetId(currentPageWidgets[0].id) // Select first one as primary
          toast.success(`${currentPageWidgets.length} widget${currentPageWidgets.length > 1 ? 's' : ''} selected`)
        }
        return
      }

      // Copy (Ctrl+C or Cmd+C) - supports multi-copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedWidgetId) {
        e.preventDefault()
        // If multiple widgets selected, copy all; otherwise copy single
        if (selectedWidgetIds.size > 1) {
          const widgetsToCopy = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
          setClipboardWidgets(widgetsToCopy.map(w => ({ ...w })))
          setClipboardWidget(null) // Clear single clipboard
          toast.success(`${widgetsToCopy.length} widgets copied`)
        } else {
          const widgetToCopy = placedWidgets.find(w => w.id === selectedWidgetId)
          if (widgetToCopy) {
            setClipboardWidget({ ...widgetToCopy })
            setClipboardWidgets([]) // Clear multi clipboard
            toast.success('Widget copied')
          }
        }
        return
      }

      // Cut (Ctrl+X or Cmd+X) - supports multi-cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedWidgetId) {
        e.preventDefault()
        // If multiple widgets selected, cut all; otherwise cut single
        if (selectedWidgetIds.size > 1) {
          const widgetsToCut = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
          setClipboardWidgets(widgetsToCut.map(w => ({ ...w })))
          setClipboardWidget(null)
          updatePlacedWidgets(prev => prev.filter(w => !selectedWidgetIds.has(w.id)))
          setSelectedWidgetId(null)
          setSelectedWidgetIds(new Set())
          toast.success(`${widgetsToCut.length} widgets cut`)
        } else {
          const widgetToCut = placedWidgets.find(w => w.id === selectedWidgetId)
          if (widgetToCut) {
            setClipboardWidget({ ...widgetToCut })
            setClipboardWidgets([])
            updatePlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
            setSelectedWidgetId(null)
            setSelectedWidgetIds(new Set())
            toast.success('Widget cut')
          }
        }
        return
      }

      // Paste (Ctrl+V or Cmd+V) - supports multi-paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && (clipboardWidget || clipboardWidgets.length > 0)) {
        e.preventDefault()
        
        // Determine which page to paste to
        let targetPageId: string | null = null
        
        if (selectedPageId) {
          targetPageId = selectedPageId
        } else if (placedWidgets.length > 0) {
          // Use the page of the first existing widget
          targetPageId = placedWidgets[0].pageId
        } else if (allPages.length > 0) {
          // Use the first available page
          targetPageId = allPages[0].id
          setSelectedPageId(targetPageId)
        } else {
          toast.error('No page available to paste widget')
          return
        }
        
        // Paste multiple widgets if available, otherwise single
        if (clipboardWidgets.length > 0) {
          const offset = { x: 20, y: 20 }
          // Calculate bounds of copied widgets to maintain relative positions
          const minX = Math.min(...clipboardWidgets.map(w => w.x))
          const minY = Math.min(...clipboardWidgets.map(w => w.y))
          
          const newWidgets: PlacedWidget[] = clipboardWidgets.map((widget, index) => ({
            ...widget,
            id: `widget_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
            pageId: targetPageId,
            x: widget.x - minX + offset.x, // Maintain relative positions
            y: widget.y - minY + offset.y,
          }))

          updatePlacedWidgets(prev => [...prev, ...newWidgets])
          setSelectedWidgetIds(new Set(newWidgets.map(w => w.id)))
          setSelectedWidgetId(newWidgets[0]?.id || null)
          setSelectedComponent(null)
          if (!selectedPageId && targetPageId) {
            setSelectedPageId(targetPageId)
          }
          toast.success(`${newWidgets.length} widget${newWidgets.length > 1 ? 's' : ''} pasted`)
        } else if (clipboardWidget) {
          // Single widget paste
          const offset = { x: 20, y: 20 }
          const newWidget: PlacedWidget = {
            ...clipboardWidget,
            id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            pageId: targetPageId,
            x: clipboardWidget.x + offset.x,
            y: clipboardWidget.y + offset.y,
          }

          updatePlacedWidgets(prev => [...prev, newWidget])
          setSelectedWidgetId(newWidget.id)
          setSelectedWidgetIds(new Set([newWidget.id]))
          setSelectedComponent(null)
          if (!selectedPageId && targetPageId) {
            setSelectedPageId(targetPageId)
          }
          toast.success('Widget pasted')
        }
        return
      }

      // Delete (Delete or Backspace key)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWidgetId && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        // Delete all selected widgets if multiple are selected
        if (selectedWidgetIds.size > 1) {
          updatePlacedWidgets(prev => prev.filter(w => !selectedWidgetIds.has(w.id)))
          toast.success(`${selectedWidgetIds.size} widgets deleted`)
        } else {
          updatePlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
          toast.success('Widget deleted')
        }
        setSelectedWidgetId(null)
        setSelectedWidgetIds(new Set())
        return
      }

      // Arrow key movement (nudge widget) - supports multi-move
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selectedWidgetId && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        
        // In grid mode, move by gridSize; otherwise, move by 1px
        const step = canvasMode === 'grid' ? gridSize : 1
        
        // If multiple widgets selected, move all; otherwise move single
        if (selectedWidgetIds.size > 1) {
          updatePlacedWidgets(prev => prev.map(w => {
            if (selectedWidgetIds.has(w.id)) {
              let newX = w.x
              let newY = w.y
              
              switch (e.key) {
                case 'ArrowUp':
                  newY = Math.max(0, w.y - step)
                  break
                case 'ArrowDown':
                  newY = w.y + step
                  break
                case 'ArrowLeft':
                  newX = Math.max(0, w.x - step)
                  break
                case 'ArrowRight':
                  newX = w.x + step
                  break
              }
              
              return { ...w, x: newX, y: newY }
            }
            return w
          }))
        } else {
          // Single widget movement
          const selectedWidget = placedWidgets.find(w => w.id === selectedWidgetId)
          if (selectedWidget) {
            let newX = selectedWidget.x
            let newY = selectedWidget.y
            
            switch (e.key) {
              case 'ArrowUp':
                newY = Math.max(0, selectedWidget.y - step)
                break
              case 'ArrowDown':
                newY = selectedWidget.y + step
                break
              case 'ArrowLeft':
                newX = Math.max(0, selectedWidget.x - step)
                break
              case 'ArrowRight':
                newX = selectedWidget.x + step
                break
            }
            
            updatePlacedWidgets(prev => prev.map(w => 
              w.id === selectedWidgetId 
                ? { ...w, x: newX, y: newY }
                : w
            ))
          }
        }
        return
      }

      // Duplicate (Ctrl+D or Cmd+D) - supports multi-duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedWidgetId) {
        e.preventDefault()
        // If multiple widgets selected, duplicate all; otherwise duplicate single
        if (selectedWidgetIds.size > 1) {
          const widgetsToDuplicate = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
          const offset = { x: 20, y: 20 }
          // Calculate bounds to maintain relative positions
          const minX = Math.min(...widgetsToDuplicate.map(w => w.x))
          const minY = Math.min(...widgetsToDuplicate.map(w => w.y))
          
          const newWidgets: PlacedWidget[] = widgetsToDuplicate.map((widget, index) => ({
            ...widget,
            id: `widget_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
            x: widget.x - minX + offset.x, // Maintain relative positions
            y: widget.y - minY + offset.y,
          }))
          
          updatePlacedWidgets(prev => [...prev, ...newWidgets])
          setSelectedWidgetIds(new Set(newWidgets.map(w => w.id)))
          setSelectedWidgetId(newWidgets[0]?.id || null)
          toast.success(`${newWidgets.length} widget${newWidgets.length > 1 ? 's' : ''} duplicated`)
        } else {
          const widgetToDuplicate = placedWidgets.find(w => w.id === selectedWidgetId)
          if (widgetToDuplicate) {
            const offset = { x: 20, y: 20 }
            const newWidget: PlacedWidget = {
              ...widgetToDuplicate,
              id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              x: widgetToDuplicate.x + offset.x,
              y: widgetToDuplicate.y + offset.y,
            }
            updatePlacedWidgets(prev => [...prev, newWidget])
            setSelectedWidgetId(newWidget.id)
            setSelectedWidgetIds(new Set([newWidget.id]))
            toast.success('Widget duplicated')
          }
        }
        return
      }

      // Alignment shortcuts (Ctrl+Shift+L/R/C/T/B/M)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && selectedWidgetIds.size > 1) {
        e.preventDefault()
        const selectedWidgets = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
        if (selectedWidgets.length < 2) return

        // Calculate bounds
        const bounds = {
          minX: Math.min(...selectedWidgets.map(w => w.x)),
          maxX: Math.max(...selectedWidgets.map(w => w.x + (w.width || 200))),
          minY: Math.min(...selectedWidgets.map(w => w.y)),
          maxY: Math.max(...selectedWidgets.map(w => w.y + (w.height || 150))),
          centerX: 0,
          centerY: 0,
          leftX: 0,
          rightX: 0,
          topY: 0,
          bottomY: 0,
        }
        bounds.centerX = (bounds.minX + bounds.maxX) / 2
        bounds.centerY = (bounds.minY + bounds.maxY) / 2
        bounds.leftX = bounds.minX
        bounds.rightX = bounds.maxX
        bounds.topY = bounds.minY
        bounds.bottomY = bounds.maxY

        let updated = false
        switch (e.key.toLowerCase()) {
          case 'l': // Align Left
            updatePlacedWidgets(prev => prev.map(w => {
              if (selectedWidgetIds.has(w.id)) {
                updated = true
                return { ...w, x: bounds.leftX }
              }
              return w
            }))
            if (updated) toast.success('Aligned left')
            return

          case 'r': // Align Right
            updatePlacedWidgets(prev => prev.map(w => {
              if (selectedWidgetIds.has(w.id)) {
                updated = true
                return { ...w, x: bounds.rightX - (w.width || 200) }
              }
              return w
            }))
            if (updated) toast.success('Aligned right')
            return

          case 'c': // Align Center (horizontal)
            updatePlacedWidgets(prev => prev.map(w => {
              if (selectedWidgetIds.has(w.id)) {
                updated = true
                return { ...w, x: bounds.centerX - ((w.width || 200) / 2) }
              }
              return w
            }))
            if (updated) toast.success('Aligned center')
            return

          case 't': // Align Top
            updatePlacedWidgets(prev => prev.map(w => {
              if (selectedWidgetIds.has(w.id)) {
                updated = true
                return { ...w, y: bounds.topY }
              }
              return w
            }))
            if (updated) toast.success('Aligned top')
            return

          case 'b': // Align Bottom
            updatePlacedWidgets(prev => prev.map(w => {
              if (selectedWidgetIds.has(w.id)) {
                updated = true
                return { ...w, y: bounds.bottomY - (w.height || 150) }
              }
              return w
            }))
            if (updated) toast.success('Aligned bottom')
            return

          case 'm': // Align Middle (vertical center)
            updatePlacedWidgets(prev => prev.map(w => {
              if (selectedWidgetIds.has(w.id)) {
                updated = true
                return { ...w, y: bounds.centerY - ((w.height || 150) / 2) }
              }
              return w
            }))
            if (updated) toast.success('Aligned middle')
            return

          case 'h': // Distribute Horizontally (space evenly)
            if (selectedWidgets.length >= 3) {
              // Sort by X position
              const sorted = [...selectedWidgets].sort((a, b) => a.x - b.x)
              const totalWidth = bounds.maxX - bounds.minX
              const totalWidgetWidth = sorted.reduce((sum, w) => sum + (w.width || 200), 0)
              const availableSpace = totalWidth - totalWidgetWidth
              const gap = availableSpace / (sorted.length - 1)

              let currentX = bounds.minX
              updatePlacedWidgets(prev => prev.map(w => {
                const index = sorted.findIndex(sw => sw.id === w.id)
                if (index >= 0 && selectedWidgetIds.has(w.id)) {
                  updated = true
                  const newX = currentX
                  currentX += (w.width || 200) + gap
                  return { ...w, x: newX }
                }
                return w
              }))
              if (updated) toast.success('Distributed horizontally')
            }
            return

          case 'v': // Distribute Vertically (space evenly)
            if (selectedWidgets.length >= 3) {
              // Sort by Y position
              const sorted = [...selectedWidgets].sort((a, b) => a.y - b.y)
              const totalHeight = bounds.maxY - bounds.minY
              const totalWidgetHeight = sorted.reduce((sum, w) => sum + (w.height || 150), 0)
              const availableSpace = totalHeight - totalWidgetHeight
              const gap = availableSpace / (sorted.length - 1)

              let currentY = bounds.minY
              updatePlacedWidgets(prev => prev.map(w => {
                const index = sorted.findIndex(sw => sw.id === w.id)
                if (index >= 0 && selectedWidgetIds.has(w.id)) {
                  updated = true
                  const newY = currentY
                  currentY += (w.height || 150) + gap
                  return { ...w, y: newY }
                }
                return w
              }))
              if (updated) toast.success('Distributed vertically')
            }
            return
        }
      }

      // Layer management (Bring to Front / Send to Back)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && selectedWidgetId) {
        const selectedWidget = placedWidgets.find(w => w.id === selectedWidgetId)
        if (selectedWidget) {
          const currentPageWidgets = placedWidgets.filter(w => 
            w.pageId === selectedWidget.pageId
          )
          
          if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            // Bring to Front
            e.preventDefault()
            const maxZ = Math.max(...currentPageWidgets.map(w => w.properties?.zIndex || 0), 0)
            updatePlacedWidgets(prev => prev.map(w => 
              w.id === selectedWidgetId
                ? { ...w, properties: { ...w.properties, zIndex: maxZ + 1 } }
                : w
            ))
            toast.success('Brought to front')
            return
          }
          
          if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            // Send to Back
            e.preventDefault()
            const minZ = Math.min(...currentPageWidgets.map(w => w.properties?.zIndex || 0), 0)
            updatePlacedWidgets(prev => prev.map(w => 
              w.id === selectedWidgetId
                ? { ...w, properties: { ...w.properties, zIndex: minZ - 1 } }
                : w
            ))
            toast.success('Sent to back')
            return
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWidgetId, selectedWidgetIds, placedWidgets, clipboardWidget, clipboardWidgets, selectedPageId, allPages, canvasMode, gridSize, canUndo, canRedo, undoWidgets, redoWidgets, updatePlacedWidgets])

  return (
    <div className="flex flex-col h-full min-h-0">
      <LayoutToolbar
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
        onSaveLayoutName={async (newName: string) => {
              await SpacesEditorManager.saveLayoutConfig(spaceId, { ...componentConfigs, name: newName })
              toast.success('Layout name saved')
            }}
        onOpenVersions={() => setVersionsDialogOpen(true)}
        showDataModelPanel={showDataModelPanel}
        onToggleDataModelPanel={() => setShowDataModelPanel(!showDataModelPanel)}
        spaceId={spaceId}
        onExportMobile={() => setMobileExportDialogOpen(true)}
        pageType={pageType}
        onPageTypeChange={setPageType}
          />
          
      {/* Version Control Dialog */}
      <LayoutVersionControlDialog
        open={versionsDialogOpen}
        onOpenChange={setVersionsDialogOpen}
        spaceId={spaceId}
        currentLayoutConfig={{
          ...componentConfigs,
          name: layoutName,
          placedWidgets,
          allPages,
          selectedPageId,
        }}
        onVersionRestore={async (version) => {
          // Restore the version - handle both string (from DB) and object
          let restoredConfig = version.layout_config
          if (typeof restoredConfig === 'string') {
            try {
              restoredConfig = JSON.parse(restoredConfig)
            } catch {
              console.error('Failed to parse layout config')
              return
            }
          }
          
          if (restoredConfig) {
            // Update component configs
            setComponentConfigs(restoredConfig.componentConfigs || restoredConfig)
            
            // Update layout name if present
            if (restoredConfig.name) {
              setLayoutName(restoredConfig.name)
            }
            
            // Update widgets if present
            if (restoredConfig.placedWidgets) {
              setPlacedWidgetsState(restoredConfig.placedWidgets)
            }
            
            // Update pages if present
            if (restoredConfig.allPages) {
              setAllPages(restoredConfig.allPages)
            }
            
            if (restoredConfig.selectedPageId) {
              setSelectedPageId(restoredConfig.selectedPageId)
            }
            
            // Save the restored layout
            await SpacesEditorManager.saveLayoutConfig(spaceId, restoredConfig)
            toast.success(`Version ${version.version_number} restored`)
          }
        }}
      />

        {/* Layout: Preview area | Data model panel (optional) - Responsive */}
        <div className={`flex-1 ${isMobileViewport ? 'flex flex-col' : 'flex'} border overflow-hidden min-h-0 relative`}>
          {/* Body/Preview area - full width (minus data model if shown) */}
          <div 
            className={`${isMobileViewport ? 'w-full' : ''} overflow-hidden h-full flex flex-col min-h-0 border-r relative`}
            style={!isMobileViewport ? {
              width: showDataModelPanel 
                ? 'calc(100% - 20%)' 
                : '100%'
            } : {}}
          >
        <Preview
          isMobileViewport={isMobileViewport}
          deviceMode={deviceMode}
          previewScale={previewScale}
          componentConfigs={componentConfigs}
          selectedComponent={selectedComponent}
          allPages={allPages}
          selectedPageId={selectedPageId}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
          isDraggingWidget={isDraggingWidget}
          selectedWidgetId={selectedWidgetId}
          selectedWidgetIds={selectedWidgetIds}
          placedWidgets={placedWidgets}
          dragOffset={dragOffset}
          canvasMode={canvasMode}
          showGrid={showGrid}
          gridSize={gridSize}
          setSelectedComponent={setSelectedComponent}
          setSelectedPageId={setSelectedPageId}
          setPlacedWidgets={setPlacedWidgets}
          setSelectedWidgetId={setSelectedWidgetId}
          setSelectedWidgetIds={setSelectedWidgetIds}
          setIsDraggingWidget={setIsDraggingWidget}
          setDragOffset={setDragOffset}
          clipboardWidget={clipboardWidget}
          clipboardWidgets={clipboardWidgets}
          spaceId={spaceId}
        />
            </div>

          {/* Floating Widget Panel - Popover on right side */}
          {!isMobileViewport && widgetPanelOpen && (
            <div 
              className="absolute w-80 bg-background border rounded-lg shadow-lg overflow-auto z-40"
              style={{ top: '16px', right: '16px', bottom: '16px', maxHeight: 'calc(100% - 32px)' }}
            >
              <div className="sticky top-0 bg-background border-b px-3 py-2 flex justify-between items-center">
                <span className="font-semibold text-sm">Widget Properties</span>
                <button 
                  onClick={() => setWidgetPanelOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <SettingsPanelContent
                spaceId={spaceId}
                isMobileViewport={isMobileViewport}
                allPages={allPages}
                pages={pages}
                selectedPageId={selectedPageId}
                selectedWidgetId={selectedWidgetId}
                selectedComponent={selectedComponent}
                placedWidgets={placedWidgets}
                componentConfigs={componentConfigs}
                expandedComponent={expandedComponent}
                setPages={setPages}
                setSelectedComponent={setSelectedComponent}
                setSelectedPageId={setSelectedPageId}
                setPlacedWidgets={setPlacedWidgets}
                setSelectedWidgetId={setSelectedWidgetId}
                setExpandedComponent={setExpandedComponent}
                setSelectedPageForPermissions={setSelectedPageForPermissions}
                setPermissionsRoles={setPermissionsRoles}
                setPermissionsUserIds={setPermissionsUserIds}
                setPermissionsGroupIds={setPermissionsGroupIds}
                setPermissionsDialogOpen={setPermissionsDialogOpen}
                handlePageReorder={handlePageReorder}
                handleComponentConfigUpdate={handleComponentConfigUpdate}
                setAllPages={setAllPages}
              />
            </div>
          )}

          {/* Toggle button to show widget panel when closed */}
          {!isMobileViewport && !widgetPanelOpen && (
            <button
              onClick={() => setWidgetPanelOpen(true)}
              className="absolute top-4 right-4 bg-background border rounded-lg shadow-lg px-3 py-2 text-sm font-medium hover:bg-muted z-40"
            >
              Widget Panel
            </button>
          )}


        


        {/* Data Model Panel - 20% */}
        {!isMobileViewport && showDataModelPanel && (
          <div className="w-[20%] overflow-auto min-h-0 bg-muted/50">
            {selectedWidgetId ? (
              <DataModelExplorer
                spaceId={spaceId}
                selectedDataModelId={placedWidgets.find(w => w.id === selectedWidgetId)?.properties?.dataModelId}
                onDataModelSelect={(modelId) => {
                  setPlacedWidgets(prev => prev.map(w => 
                    w.id === selectedWidgetId 
                      ? { ...w, properties: { ...w.properties, dataModelId: modelId || undefined } }
                      : w
                  ))
                }}
              />
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Select a widget to configure data model
              </div>
            )}
          </div>
        )}

      </div>

      {/* Mobile Settings Drawer */}
      {isMobileViewport && (
        <Drawer open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>Configure pages and components</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <SettingsPanelContent
                spaceId={spaceId}
                isMobileViewport={isMobileViewport}
                allPages={allPages}
                pages={pages}
                selectedPageId={selectedPageId}
                selectedWidgetId={selectedWidgetId}
                selectedComponent={selectedComponent}
                placedWidgets={placedWidgets}
                componentConfigs={componentConfigs}
                expandedComponent={expandedComponent}
                setPages={setPages}
                setSelectedComponent={setSelectedComponent}
                setSelectedPageId={setSelectedPageId}
                setPlacedWidgets={setPlacedWidgets}
                setSelectedWidgetId={setSelectedWidgetId}
                setExpandedComponent={setExpandedComponent}
                setSelectedPageForPermissions={setSelectedPageForPermissions}
                setPermissionsRoles={setPermissionsRoles}
                setPermissionsUserIds={setPermissionsUserIds}
                setPermissionsGroupIds={setPermissionsGroupIds}
                setPermissionsDialogOpen={setPermissionsDialogOpen}
                handlePageReorder={handlePageReorder}
                handleComponentConfigUpdate={handleComponentConfigUpdate}
                setAllPages={setAllPages}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        spaceId={spaceId}
        selectedPageForPermissions={selectedPageForPermissions}
        spaceUsers={spaceUsers}
        permissionsRoles={permissionsRoles}
        permissionsUserIds={permissionsUserIds}
        permissionsGroupIds={permissionsGroupIds}
        userGroups={userGroups}
        setPermissionsRoles={setPermissionsRoles}
        setPermissionsUserIds={setPermissionsUserIds}
        setPermissionsGroupIds={setPermissionsGroupIds}
        setSelectedPageForPermissions={setSelectedPageForPermissions}
        setPages={setPages}
      />

      {/* Mobile Export Dialog */}
      <MobileExportDialog
        open={mobileExportDialogOpen}
        onOpenChange={setMobileExportDialogOpen}
        spaceId={spaceId}
        config={{
          id: `config_${spaceId}`,
          spaceId,
          pages: pages.map(page => ({
            ...page,
            components: page.id === selectedPageId ? placedWidgets : page.components,
          })),
          layoutConfig: componentConfigs,
          sidebarConfig: {
            items: [],
            background: '#ffffff',
            textColor: '#374151',
            fontSize: '14px',
          },
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
      />
    </div>
  )
}



