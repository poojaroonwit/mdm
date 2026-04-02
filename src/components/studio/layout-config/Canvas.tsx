'use client'

import React, { useMemo } from 'react'
import { DefaultCanvasContent } from './DefaultCanvasContent'
import { CanvasWidget } from './CanvasWidget'
import { FloatingToolbar } from './FloatingToolbar'
import { useCanvasDrag } from './useCanvasDrag'
import { useCanvasResize } from './useCanvasResize'
import { PlacedWidget, WidgetType, getDefaultWidgetProperties, widgetsPalette } from './widgets'
import toast from 'react-hot-toast'
import { Z_INDEX } from '@/lib/z-index'

export interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>
  isMobile: boolean
  isDraggingWidget: boolean
  selectedComponent: string | null
  selectedWidgetId: string | null
  selectedWidgetIds?: Set<string>
  selectedPageId: string | null
  placedWidgets: PlacedWidget[]
  dragOffset: { x: number; y: number }
  canvasMode: 'freeform' | 'grid'
  showGrid: boolean
  gridSize: number
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedWidgetIds?: React.Dispatch<React.SetStateAction<Set<string>>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setIsDraggingWidget: React.Dispatch<React.SetStateAction<boolean>>
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  clipboardWidget?: PlacedWidget | null
  clipboardWidgets?: PlacedWidget[]
  spaceId?: string
}

export function Canvas({
  canvasRef,
  isMobile,
  isDraggingWidget,
  selectedComponent,
  selectedWidgetId,
  selectedWidgetIds,
  selectedPageId,
  placedWidgets,
  dragOffset,
  canvasMode,
  showGrid,
  gridSize,
  setPlacedWidgets,
  setSelectedWidgetId,
  setSelectedWidgetIds,
  setSelectedComponent,
  setIsDraggingWidget,
  setDragOffset,
  clipboardWidget,
  clipboardWidgets,
  spaceId,
}: CanvasProps) {
  const { handleMouseMove: handleDragMove, handleMouseUp: handleDragUp, dragStateRef } = useCanvasDrag({
    canvasRef,
    placedWidgets,
    canvasMode,
    gridSize,
    setPlacedWidgets,
    setIsDraggingWidget,
    setDragOffset,
  })

  const { handleMouseMove: handleResizeMove, handleMouseUp: handleResizeUp, isResizing, setIsResizing, resizeStateRef } = useCanvasResize({
    canvasRef,
    placedWidgets,
    canvasMode,
    gridSize,
    setPlacedWidgets,
  })

  // Combined mouse handlers
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    handleResizeMove(e)
    handleDragMove(e)
  }, [handleResizeMove, handleDragMove])

  const handleMouseUp = React.useCallback(() => {
    handleResizeUp()
    handleDragUp()
  }, [handleResizeUp, handleDragUp])

  // Add global mouse event listeners when dragging or resizing starts
  React.useEffect(() => {
    if (isDraggingWidget || isResizing) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingWidget, isResizing, handleMouseMove, handleMouseUp])

  // Calculate selected rectangle for floating toolbar
  const selectedRect = useMemo(() => {
    const selected = selectedWidgetId ? placedWidgets.find(w => w.id === selectedWidgetId) : null
    const multiSelected = selectedWidgetIds ? Array.from(selectedWidgetIds).map(id => placedWidgets.find(w => w.id === id)).filter(Boolean) as PlacedWidget[] : []
    const widgetsToShow = multiSelected.length > 1 ? multiSelected : (selected ? [selected] : [])
    
    if (widgetsToShow.length === 0 || !canvasRef.current) return undefined
    
    if (widgetsToShow.length === 1) {
      const w = widgetsToShow[0]
      return {
        x: w.x,
        y: w.y,
        width: w.width || 200,
        height: w.height || 150,
      }
    } else {
      // Calculate bounding box for multi-select
      const minX = Math.min(...widgetsToShow.map(w => w.x))
      const minY = Math.min(...widgetsToShow.map(w => w.y))
      const maxX = Math.max(...widgetsToShow.map(w => w.x + (w.width || 200)))
      const maxY = Math.max(...widgetsToShow.map(w => w.y + (w.height || 150)))
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    }
  }, [selectedWidgetId, selectedWidgetIds, placedWidgets, canvasRef])

  // Get selected widgets for toolbar
  const selectedWidgets = useMemo(() => {
    if (selectedWidgetIds && selectedWidgetIds.size > 1) {
      return Array.from(selectedWidgetIds)
        .map(id => placedWidgets.find(w => w.id === id))
        .filter(Boolean) as PlacedWidget[]
    }
    return selectedWidgetId ? [placedWidgets.find(w => w.id === selectedWidgetId)].filter(Boolean) as PlacedWidget[] : []
  }, [selectedWidgetId, selectedWidgetIds, placedWidgets])

  // Get selected widget for floating toolbar (non-null check)
  const selectedWidgetNonNull = selectedWidgets.length > 0 ? selectedWidgets[0] : null

  const handleUpdateWidget = React.useCallback((widgetId: string, updates: Partial<PlacedWidget>) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ))
  }, [setPlacedWidgets])

  const handleBulkUpdate = React.useCallback((updates: Partial<PlacedWidget>) => {
    if (!selectedWidgetIds || selectedWidgetIds.size === 0) return
    setPlacedWidgets(prev => prev.map(w => 
      selectedWidgetIds.has(w.id) ? { ...w, ...updates } : w
    ))
  }, [selectedWidgetIds, setPlacedWidgets])

  const handleDelete = React.useCallback(() => {
    if (selectedWidgetIds && selectedWidgetIds.size > 1) {
      setPlacedWidgets(prev => prev.filter(w => !selectedWidgetIds.has(w.id)))
    } else if (selectedWidgetId) {
      setPlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
    }
    setSelectedWidgetId(null)
    if (setSelectedWidgetIds) {
      setSelectedWidgetIds(new Set())
    }
  }, [selectedWidgetId, selectedWidgetIds, setPlacedWidgets, setSelectedWidgetId, setSelectedWidgetIds])

  const handleDuplicate = React.useCallback(() => {
    if (selectedWidgetIds && selectedWidgetIds.size > 1) {
      const widgetsToDuplicate = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
      const offset = { x: 20, y: 20 }
      const minX = Math.min(...widgetsToDuplicate.map(w => w.x))
      const minY = Math.min(...widgetsToDuplicate.map(w => w.y))
      
      const newWidgets: PlacedWidget[] = widgetsToDuplicate.map((widget, index) => ({
        ...widget,
        id: `widget_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
        x: widget.x - minX + offset.x,
        y: widget.y - minY + offset.y,
      }))
      
      setPlacedWidgets(prev => [...prev, ...newWidgets])
      setSelectedWidgetIds?.(new Set(newWidgets.map(w => w.id)))
      setSelectedWidgetId(newWidgets[0]?.id || null)
    } else if (selectedWidgetId) {
      const widgetToDuplicate = placedWidgets.find(w => w.id === selectedWidgetId)
      if (widgetToDuplicate) {
        const offset = { x: 20, y: 20 }
        const newWidget: PlacedWidget = {
          ...widgetToDuplicate,
          id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          x: widgetToDuplicate.x + offset.x,
          y: widgetToDuplicate.y + offset.y,
        }
        setPlacedWidgets(prev => [...prev, newWidget])
        setSelectedWidgetId(newWidget.id)
      }
    }
  }, [selectedWidgetId, selectedWidgetIds, placedWidgets, setPlacedWidgets, setSelectedWidgetId, setSelectedWidgetIds])

  const handleOpenProperties = React.useCallback(() => {
    // Scroll to properties panel and ensure it's visible
    const propsPanel = document.querySelector('[data-properties-panel]')
    if (propsPanel) {
      propsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Focus the properties section
      const selectionTab = document.querySelector('[data-selection-tab]')
      if (selectionTab) {
        ;(selectionTab as HTMLElement).focus()
      }
    }
  }, [])

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 ${selectedComponent === 'canvas' ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isDraggingWidget ? 'cursor-move' : 'cursor-default'}`}
      style={{
        position: 'absolute',
        zIndex: Z_INDEX.canvasElementSelected, // Ensure canvas is above background but below overlays during drag
        backgroundImage: showGrid
          ? 'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)'
          : 'none',
        backgroundSize: `${gridSize}px ${gridSize}px`
      }}
      onDragOver={(e) => {
        // Always prevent default to allow drop
        e.preventDefault()
        e.stopPropagation()
        
        // Check for widget type in multiple ways to ensure compatibility
        const types = Array.from(e.dataTransfer.types)
        const hasWidgetType = (
          types.includes('text/plain') ||
          types.includes('widgetType') ||
          types.includes('application/x-widget-type')
        ) && (
          e.dataTransfer.effectAllowed === 'copy' ||
          e.dataTransfer.effectAllowed === 'all' ||
          e.dataTransfer.effectAllowed === 'move'
        )
        
        if (hasWidgetType) {
          e.dataTransfer.dropEffect = 'copy'
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'
          // Ensure canvas is on top during drag
          e.currentTarget.style.zIndex = String(Z_INDEX.sortableDragging)
        } else {
          e.dataTransfer.dropEffect = 'none'
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.zIndex = String(Z_INDEX.canvasElementSelected)
        }
      }}
      onClick={(e) => {
        if (!isDraggingWidget && (e.target === e.currentTarget || !(e.target as HTMLElement).closest('[data-widget-id]'))) {
          setSelectedComponent('canvas')
          setSelectedWidgetId(null)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set())
          }
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.zIndex = String(Z_INDEX.canvasElementSelected)
        
        if (!canvasRef.current) return
        
        const rect = canvasRef.current.getBoundingClientRect()
        // Try multiple ways to get widget type
        let widgetTypeStr = e.dataTransfer.getData('widgetType')
        if (!widgetTypeStr) {
          widgetTypeStr = e.dataTransfer.getData('text/plain')
        }
        if (!widgetTypeStr) {
          widgetTypeStr = e.dataTransfer.getData('application/x-widget-type')
        }
        
        const widgetType = widgetTypeStr as WidgetType
        
        // Debug: log if we have the data
        if (!widgetTypeStr) {
          console.log('Drop event - types:', Array.from(e.dataTransfer.types))
          console.log('Drop event - effectAllowed:', e.dataTransfer.effectAllowed)
        }
        
        if (widgetTypeStr && widgetType) {
          let x = Math.max(0, e.clientX - rect.left - 50)
          let y = Math.max(0, e.clientY - rect.top - 50)
          
          if (canvasMode === 'grid') {
            x = Math.round(x / gridSize) * gridSize
            y = Math.round(y / gridSize) * gridSize
          }
          
          const widgetDef = widgetsPalette.find((w: any) => w.type === widgetType)
          
          const getDefaultSize = (type: string): { width: number; height: number } => {
            const t = type.toLowerCase()
            // Charts
            if (t.includes('bar-chart') || t.includes('line-chart') || t.includes('area-chart') || t.includes('scatter-chart') || t.includes('radar-chart') || t.includes('gauge-chart') || t.includes('funnel-chart') || t.includes('waterfall-chart') || t.includes('treemap-chart') || t.includes('heatmap-chart') || t.includes('bubble-chart') || t.includes('combo-chart')) {
              return { width: 560, height: 360 }
            }
            if (t.includes('pie-chart') || t.includes('donut-chart')) {
              return { width: 420, height: 360 }
            }
            if (t === 'time-series') {
              return { width: 640, height: 360 }
            }
            // Tables
            if (t === 'table' || t === 'pivot-table') {
              return { width: 720, height: 420 }
            }
            // Media
            if (t === 'image') return { width: 320, height: 240 }
            if (t === 'video') return { width: 480, height: 270 } // 16:9
            if (t === 'html' || t === 'iframe' || t === 'embed') return { width: 480, height: 360 }
            // Map/Calendar
            if (t === 'map') return { width: 640, height: 400 }
            if (t === 'calendar') return { width: 400, height: 320 }
            // Simple elements
            if (t === 'text') return { width: 320, height: 80 }
            if (t === 'button') return { width: 160, height: 48 }
            if (t === 'link') return { width: 200, height: 40 }
            if (t === 'divider') return { width: 600, height: 2 }
            if (t === 'spacer') return { width: 200, height: 100 }
            // Shapes
            if (t === 'rectangle' || t === 'shape') return { width: 200, height: 150 }
            if (t === 'circle') return { width: 150, height: 150 }
            if (t === 'triangle' || t === 'hexagon' || t === 'star') return { width: 180, height: 160 }
            // Filters
            if (t.includes('-filter')) {
              if (t.startsWith('text-') || t.startsWith('search-')) return { width: 240, height: 40 }
              if (t.startsWith('number-')) return { width: 200, height: 40 }
              if (t.startsWith('date-')) return { width: 240, height: 40 }
              if (t.startsWith('dropdown-') || t.startsWith('select-')) return { width: 220, height: 40 }
              if (t.startsWith('checkbox-')) return { width: 200, height: 32 }
              if (t.startsWith('slider-') || t.startsWith('range-')) return { width: 300, height: 48 }
            }
            // Fallbacks
            if (widgetDef?.type?.includes('chart')) return { width: 560, height: 360 }
            if (widgetDef?.type?.includes('table')) return { width: 720, height: 420 }
            return { width: 300, height: 200 }
          }
          
          const defaultSize = getDefaultSize(widgetType)
          
          let finalWidth = defaultSize.width
          let finalHeight = defaultSize.height
          if (canvasMode === 'grid') {
            finalWidth = Math.max(gridSize, Math.round(defaultSize.width / gridSize) * gridSize)
            finalHeight = Math.max(gridSize, Math.round(defaultSize.height / gridSize) * gridSize)
          }
          
          const boundedX = Math.min(x, rect.width - finalWidth)
          const boundedY = Math.min(y, rect.height - finalHeight)
          
          const newWidget: PlacedWidget = {
            id: `widget_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            pageId: selectedPageId || '',
            type: widgetType,
            x: Math.max(0, boundedX),
            y: Math.max(0, boundedY),
            width: finalWidth,
            height: finalHeight,
            properties: getDefaultWidgetProperties(widgetType)
          }
          
          setPlacedWidgets((prev) => [...prev, newWidget])
          setSelectedWidgetId(newWidget.id)
          setSelectedComponent(null)
          toast.success(`${widgetDef?.label || 'Widget'} added to canvas`)
        }
      }}
    >
      {placedWidgets.length === 0 && (
        <DefaultCanvasContent isMobile={isMobile} />
      )}
      
      {placedWidgets.map(w => {
        const isLocked = w.properties?.locked === true
        const isHidden = w.properties?.hidden === true
        
        return (
        <CanvasWidget
          key={w.id}
          widget={w}
          isMobile={isMobile}
          isSelected={selectedWidgetId === w.id}
            isMultiSelected={selectedWidgetIds?.has(w.id) || false}
          isDraggingWidget={isDraggingWidget}
          canvasRef={canvasRef}
          setPlacedWidgets={setPlacedWidgets}
          setSelectedWidgetId={setSelectedWidgetId}
            setSelectedWidgetIds={setSelectedWidgetIds}
          setSelectedComponent={setSelectedComponent}
          setIsDraggingWidget={setIsDraggingWidget}
          setDragOffset={setDragOffset}
          setIsResizing={setIsResizing}
          dragStateRef={dragStateRef}
          resizeStateRef={resizeStateRef}
            placedWidgets={placedWidgets}
            clipboardWidget={clipboardWidget}
            clipboardWidgets={clipboardWidgets}
            onCopy={() => {
              // Trigger copy via keyboard event simulation
              const event = new KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            onCut={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'x',
                ctrlKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            onDelete={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'Delete',
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            onDuplicate={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'd',
                ctrlKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            onLock={() => {
              setPlacedWidgets(prev => prev.map(wid => 
                wid.id === w.id
                  ? { ...wid, properties: { ...wid.properties, locked: true } }
                  : wid
              ))
            }}
            onUnlock={() => {
              setPlacedWidgets(prev => prev.map(wid => 
                wid.id === w.id
                  ? { ...wid, properties: { ...wid.properties, locked: false } }
                  : wid
              ))
            }}
            onHide={() => {
              setPlacedWidgets(prev => prev.map(wid => 
                wid.id === w.id
                  ? { ...wid, properties: { ...wid.properties, hidden: true } }
                  : wid
              ))
            }}
            onShow={() => {
              setPlacedWidgets(prev => prev.map(wid => 
                wid.id === w.id
                  ? { ...wid, properties: { ...wid.properties, hidden: false } }
                  : wid
              ))
            }}
            onBringToFront={() => {
              const currentPageWidgets = placedWidgets.filter(wid => wid.pageId === w.pageId)
              const maxZ = Math.max(...currentPageWidgets.map(wid => wid.properties?.zIndex || 0), 0)
              setPlacedWidgets(prev => prev.map(wid => 
                wid.id === w.id
                  ? { ...wid, properties: { ...wid.properties, zIndex: maxZ + 1 } }
                  : wid
              ))
            }}
            onSendToBack={() => {
              const currentPageWidgets = placedWidgets.filter(wid => wid.pageId === w.pageId)
              const minZ = Math.min(...currentPageWidgets.map(wid => wid.properties?.zIndex || 0), 0)
              setPlacedWidgets(prev => prev.map(wid => 
                wid.id === w.id
                  ? { ...wid, properties: { ...wid.properties, zIndex: minZ - 1 } }
                  : wid
              ))
            }}
            onBringForward={() => {
              const currentWidget = placedWidgets.find(wid => wid.id === w.id)
              if (!currentWidget) return
              const currentZ = currentWidget.properties?.zIndex || 0
              // Find next widget with higher z-index
              const currentPageWidgets = placedWidgets.filter(wid => wid.pageId === w.pageId)
              const nextZ = Math.min(...currentPageWidgets
                .filter(wid => (wid.properties?.zIndex || 0) > currentZ)
                .map(wid => wid.properties?.zIndex || 0))
              if (nextZ !== Infinity) {
                // Swap z-indexes
                setPlacedWidgets(prev => prev.map(wid => {
                  if (wid.id === w.id) {
                    return { ...wid, properties: { ...wid.properties, zIndex: nextZ } }
                  } else if ((wid.properties?.zIndex || 0) === nextZ) {
                    return { ...wid, properties: { ...wid.properties, zIndex: currentZ } }
                  }
                  return wid
                }))
              }
            }}
            onSendBackward={() => {
              const currentWidget = placedWidgets.find(wid => wid.id === w.id)
              if (!currentWidget) return
              const currentZ = currentWidget.properties?.zIndex || 0
              // Find next widget with lower z-index
              const currentPageWidgets = placedWidgets.filter(wid => wid.pageId === w.pageId)
              const prevZ = Math.max(...currentPageWidgets
                .filter(wid => (wid.properties?.zIndex || 0) < currentZ)
                .map(wid => wid.properties?.zIndex || 0))
              if (prevZ !== -Infinity) {
                // Swap z-indexes
                setPlacedWidgets(prev => prev.map(wid => {
                  if (wid.id === w.id) {
                    return { ...wid, properties: { ...wid.properties, zIndex: prevZ } }
                  } else if ((wid.properties?.zIndex || 0) === prevZ) {
                    return { ...wid, properties: { ...wid.properties, zIndex: currentZ } }
                  }
                  return wid
                }))
              }
            }}
            spaceId={spaceId}
          />
        )
      })}

      {/* Floating Toolbar removed per request */}
    </div>
  )
}
