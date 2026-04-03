'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { PlacedWidget, WidgetType } from '@/components/studio/layout-config/widgets'
import { Preview } from '@/components/studio/layout-config/Preview'
import { LayoutToolbar } from '@/components/studio/layout-config/LayoutToolbar'
import { SettingsPanelContent } from '@/components/studio/layout-config/SettingsPanelContent'
import { WidgetSelectionDrawer } from '@/components/studio/layout-config/WidgetSelectionDrawer'
import { LayoutVersionControlDialog } from '@/components/studio/layout-config/LayoutVersionControlDialog'
import { DataModelExplorer } from '@/components/studio/layout-config/DataModelExplorer'
import { ComponentConfig, UnifiedPage } from '@/components/studio/layout-config/types'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { Button } from '@/components/ui/button'
import { Box, X } from 'lucide-react'
import { Z_INDEX } from '@/lib/z-index'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WidgetSelectionContent } from '@/components/studio/layout-config/WidgetSelectionDrawer'

interface PageEditorProps {
  spaceSlug: string
  pageId: string
  editMode?: boolean
}

export function PageEditor({ spaceSlug, pageId, editMode: editModeProp = false }: PageEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Get editMode from prop or URL query parameter
  const editModeFromUrl = searchParams?.get('editMode') === 'true'
  const editMode = editModeProp || editModeFromUrl
  const [spaceId, setSpaceId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Debug: Log editMode to verify it's being received
  useEffect(() => {
    console.log('[PageEditor] editMode:', editMode, 'editModeProp:', editModeProp, 'editModeFromUrl:', editModeFromUrl)
  }, [editMode, editModeProp, editModeFromUrl])
  const [page, setPage] = useState<SpacesEditorPage | null>(null)
  const [previewScale, setPreviewScale] = useState<number>(1)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [showDataModelPanel, setShowDataModelPanel] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

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
  const [clipboardWidgets, setClipboardWidgets] = useState<PlacedWidget[]>([])
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false)
  const [widgetPopoverOpen, setWidgetPopoverOpen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [canvasMode, setCanvasMode] = useState<'freeform' | 'grid'>('freeform')
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [componentConfigs, setComponentConfigs] = useState<Record<string, ComponentConfig>>({})
  const [allPages, setAllPages] = useState<UnifiedPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pageId)
  const [pages, setPages] = useState<SpacesEditorPage[]>([])

  // Wrapper for setPlacedWidgets that tracks history
  const setPlacedWidgets = useCallback((updater: React.SetStateAction<PlacedWidget[]>) => {
    setPlacedWidgetsState(prev => {
      const newWidgets = typeof updater === 'function' ? updater(prev) : updater
      
      // Add to history if not an undo/redo operation and state actually changed
      if (!isUndoRedoOperation.current) {
        const stateChanged = JSON.stringify(lastWidgetStateRef.current) !== JSON.stringify(newWidgets)
        if (stateChanged) {
          clearTimeout((setPlacedWidgets as any).historyTimeout)
          ;(setPlacedWidgets as any).historyTimeout = setTimeout(() => {
            if (!isUndoRedoOperation.current && JSON.stringify(lastWidgetStateRef.current) !== JSON.stringify(newWidgets)) {
              setWidgetHistory(newWidgets)
              lastWidgetStateRef.current = newWidgets
            }
          }, 300)
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

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileViewport(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load space ID and page data
  useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        // Get space ID from slug
        const spaces = await SpacesEditorManager.getSpaces()
        const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug)
        if (space && mounted) {
          setSpaceId(space.id)
        }

        // Load page data - use space.id if found, otherwise fallback to spaceSlug
        if (pageId && mounted) {
          const effectiveSpaceId = space?.id || spaceSlug
          const spacePages = await SpacesEditorManager.getPages(effectiveSpaceId)
          const foundPage = spacePages.find(p => p.id === pageId)
          if (foundPage && mounted) {
            setPage(foundPage)
            // Load widgets from page data
            const pageData = foundPage as any
            if (pageData.placedWidgets) {
              setPlacedWidgetsState(pageData.placedWidgets)
              setWidgetHistory(pageData.placedWidgets)
              lastWidgetStateRef.current = pageData.placedWidgets
            }
            
            // Load layout config and component configs from template
            if (pageData.layoutConfig) {
              // Apply component configs from layout template
              if (pageData.layoutConfig.componentConfigs) {
                setComponentConfigs(pageData.layoutConfig.componentConfigs)
              }
              
              // If layoutConfig has placedWidgets, use those (they might be from template)
              if (pageData.layoutConfig.placedWidgets && !pageData.placedWidgets) {
                setPlacedWidgetsState(pageData.layoutConfig.placedWidgets)
                setWidgetHistory(pageData.layoutConfig.placedWidgets)
                lastWidgetStateRef.current = pageData.layoutConfig.placedWidgets
              }
            }
          } else if (mounted) {
            console.warn('Page not found:', pageId)
            toast.error('Page not found')
          }
        }
      } catch (error) {
        console.error('Error loading page:', error)
        toast.error('Failed to load page')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [spaceSlug, pageId])

  const handleSave = useCallback(async () => {
    if (!page || !spaceId) return
    
    try {
      const pageData = {
        ...page,
        placedWidgets,
      }
      
      await SpacesEditorManager.updatePage(spaceId, pageId, pageData as any)
      toast.success('Page saved')
    } catch (error) {
      console.error('Error saving page:', error)
      toast.error('Failed to save page')
    }
  }, [page, spaceId, pageId, placedWidgets])

  const handleComponentConfigUpdate = useCallback((type: string, updates: Partial<ComponentConfig>) => {
    setComponentConfigs((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not in an input/textarea/contenteditable
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          isUndoRedoOperation.current = true
          const prevState = undoWidgets()
          if (prevState) {
            setPlacedWidgetsState(prevState)
            lastWidgetStateRef.current = prevState
          }
          setTimeout(() => {
            isUndoRedoOperation.current = false
          }, 0)
        }
      }
      // Ctrl/Cmd + Shift + Z to redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (canRedo) {
          isUndoRedoOperation.current = true
          const nextState = redoWidgets()
          if (nextState) {
            setPlacedWidgetsState(nextState)
            lastWidgetStateRef.current = nextState
          }
          setTimeout(() => {
            isUndoRedoOperation.current = false
          }, 0)
        }
      }
      // Copy (Ctrl+C or Cmd+C) - supports multi-copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedWidgetId) {
        e.preventDefault()
        // If multiple widgets selected, copy all; otherwise copy single
        if (selectedWidgetIds && selectedWidgetIds.size > 1) {
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
        if (selectedWidgetIds && selectedWidgetIds.size > 1) {
          const widgetsToCut = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
          setClipboardWidgets(widgetsToCut.map(w => ({ ...w })))
          setClipboardWidget(null)
          setPlacedWidgets(prev => prev.filter(w => !selectedWidgetIds.has(w.id)))
          setSelectedWidgetId(null)
          setSelectedWidgetIds(new Set())
          toast.success(`${widgetsToCut.length} widgets cut`)
        } else {
          const widgetToCut = placedWidgets.find(w => w.id === selectedWidgetId)
          if (widgetToCut) {
            setClipboardWidget({ ...widgetToCut })
            setClipboardWidgets([])
            setPlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
            setSelectedWidgetId(null)
            setSelectedWidgetIds(new Set())
            toast.success('Widget cut')
          }
        }
        return
      }
      // Paste (Ctrl+V or Cmd+V) - supports multi-paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && (clipboardWidget || (clipboardWidgets && clipboardWidgets.length > 0))) {
        e.preventDefault()
        
        // Determine which page to paste to
        let targetPageId: string | null = null
        
        if (selectedPageId) {
          targetPageId = selectedPageId
        } else if (placedWidgets.length > 0) {
          // Use the page of the first existing widget
          targetPageId = placedWidgets[0].pageId
        } else if (page) {
          // Use the current page
          targetPageId = page.id
        } else {
          toast.error('No page available to paste widget')
          return
        }
        
        // Paste multiple widgets if available, otherwise single
        if (clipboardWidgets && clipboardWidgets.length > 0) {
          const offset = { x: 20, y: 20 }
          // Calculate bounds of copied widgets to maintain relative positions
          const minX = Math.min(...clipboardWidgets.map(w => w.x))
          const minY = Math.min(...clipboardWidgets.map(w => w.y))
          
          const newWidgets: PlacedWidget[] = clipboardWidgets.map((widget, index) => ({
            ...widget,
            id: `widget_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
            pageId: targetPageId || '',
            x: widget.x - minX + offset.x, // Maintain relative positions
            y: widget.y - minY + offset.y,
          }))

          setPlacedWidgets(prev => [...prev, ...newWidgets])
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
            pageId: targetPageId || '',
            x: clipboardWidget.x + offset.x,
            y: clipboardWidget.y + offset.y,
          }

          setPlacedWidgets(prev => [...prev, newWidget])
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
        if (selectedWidgetIds && selectedWidgetIds.size > 1) {
          setPlacedWidgets(prev => prev.filter(w => !selectedWidgetIds.has(w.id)))
          toast.success(`${selectedWidgetIds.size} widgets deleted`)
        } else {
          setPlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
          toast.success('Widget deleted')
        }
        setSelectedWidgetId(null)
        setSelectedWidgetIds(new Set())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave, canUndo, canRedo, undoWidgets, redoWidgets, selectedWidgetId, selectedWidgetIds, setPlacedWidgets, setSelectedWidgetId, setSelectedWidgetIds, placedWidgets, clipboardWidget, clipboardWidgets, selectedPageId, page, setClipboardWidget, setClipboardWidgets, setSelectedComponent])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    )
  }

  // If in edit mode and page has no layout, redirect to layout selection
  if (editMode && !(page as any).placedWidgets && !(page as any).layoutConfig) {
    // This will be handled by the parent component's redirect logic
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">No layout configured. Redirecting to layout selection...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <LayoutToolbar
        isMobileViewport={isMobileViewport}
        deviceMode={deviceMode}
        componentConfigs={componentConfigs}
        setDeviceMode={setDeviceMode}
        setPreviewScale={setPreviewScale}
        handleComponentConfigUpdate={handleComponentConfigUpdate}
        setSelectedComponent={setSelectedComponent}
        handleSave={handleSave}
        layoutName={page.displayName || page.name}
        setLayoutName={(name) => setPage(prev => prev ? { ...prev, displayName: name } : null)}
        onSaveLayoutName={async (name) => {
          if (spaceId && page) {
            await SpacesEditorManager.updatePage(spaceId, pageId, { ...page, displayName: name } as any)
          }
        }}
        canvasMode={canvasMode}
        setCanvasMode={setCanvasMode}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        gridSize={gridSize}
        setGridSize={setGridSize}
        onOpenVersions={() => setVersionsDialogOpen(true)}
        showDataModelPanel={showDataModelPanel}
        onToggleDataModelPanel={() => setShowDataModelPanel(prev => !prev)}
        spaceId={spaceId}
      />

      {/* Main Content */}
      <div className="flex-1 flex border min-h-0 relative overflow-hidden">
        {/* Canvas/Preview area */}
        <div className={`flex-1 flex flex-col min-h-0 border-r relative overflow-hidden`}>
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

        {/* Settings Panel */}
        {/* Floating Settings Panel - Only show when a widget is selected */}
        {!isMobileViewport && selectedWidgetId && (
          <div 
            className="absolute right-4 top-4 w-80 max-h-[calc(100vh-100px)] overflow-auto bg-popover/50 border shadow-lg rounded-lg z-20 flex flex-col backdrop-blur-xl"
            style={{ zIndex: Z_INDEX.configurationPanel }}
          >
            <div className="p-2 border-b flex justify-between items-center bg-muted/60">
              <span className="text-xs font-semibold px-2">Configuration</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedWidgetId(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="overflow-auto max-h-[600px]">
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
                setSelectedPageForPermissions={() => {}}
                setPermissionsRoles={() => {}}
                setPermissionsUserIds={() => {}}
                setPermissionsGroupIds={() => {}}
                setPermissionsDialogOpen={() => {}}
                handlePageReorder={async () => {}}
                handleComponentConfigUpdate={handleComponentConfigUpdate}
                setAllPages={setAllPages}
              />
            </div>
          </div>
        )}

        {/* Data Model Panel */}
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

        {/* Floating Action Button - Widget - Only show when editMode is enabled */}
        {!!editMode && (
          <div 
            className="absolute left-6 bottom-6 flex flex-col items-start gap-2"
            style={{ zIndex: Z_INDEX.overlay - 100 }}
          >
            <Popover open={widgetPopoverOpen} onOpenChange={setWidgetPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="lg"
                  className="h-auto px-4 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 text-sm font-medium overflow-hidden !rounded-full"
                  style={{ borderRadius: '9999px' }}
                  aria-label="Widget"
                >
                  <Box className="h-5 w-5" />
                  Widget
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0 h-[500px] bg-popover" align="start">
                <WidgetSelectionContent onClose={() => setWidgetPopoverOpen(false)} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Widget Selection Drawer Removed - replaced by Popover */}

      {/* Version Control Dialog */}
      <LayoutVersionControlDialog
        open={versionsDialogOpen}
        onOpenChange={setVersionsDialogOpen}
        spaceId={spaceId}
        currentLayoutConfig={{
          ...componentConfigs,
          name: page.displayName || page.name,
          placedWidgets,
          allPages,
          selectedPageId,
        }}
        onVersionRestore={async (version) => {
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
            if (restoredConfig.placedWidgets) {
              setPlacedWidgetsState(restoredConfig.placedWidgets)
            }
            await handleSave()
            toast.success(`Version ${version.version_number} restored`)
          }
        }}
      />
    </div>
  )
}

