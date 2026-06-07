// @ts-nocheck
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function useLayoutKeyboardShortcuts(props: any) {
  const {
    selectedWidgetId, selectedWidgetIds, placedWidgets, clipboardWidget, clipboardWidgets,
    selectedPageId, allPages, canvasMode, gridSize, canUndo, canRedo, undoWidgets,
    redoWidgets, updatePlacedWidgets, setSelectedWidgetIds, setSelectedWidgetId,
    setClipboardWidgets, setClipboardWidget, setPlacedWidgets, setSelectedPageId,
    setSelectedComponent, isUndoRedoOperation,
  } = props

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

}
