import { Dispatch, MutableRefObject, SetStateAction, useEffect } from 'react'
import toast from 'react-hot-toast'
import { SpacesEditorPage } from '@/lib/space-studio-manager'
import { PlacedWidget } from '@/components/studio/layout-config/widgets'

interface UsePageEditorKeyboardShortcutsArgs {
  canRedo: boolean
  canUndo: boolean
  clipboardWidget: PlacedWidget | null
  clipboardWidgets: PlacedWidget[]
  handleSave: () => void
  isUndoRedoOperation: MutableRefObject<boolean>
  lastWidgetStateRef: MutableRefObject<PlacedWidget[]>
  page: SpacesEditorPage | null
  placedWidgets: PlacedWidget[]
  redoWidgets: () => PlacedWidget[] | null | undefined
  selectedPageId: string | null
  selectedWidgetId: string | null
  selectedWidgetIds: Set<string>
  setClipboardWidget: Dispatch<SetStateAction<PlacedWidget | null>>
  setClipboardWidgets: Dispatch<SetStateAction<PlacedWidget[]>>
  setPlacedWidgets: Dispatch<SetStateAction<PlacedWidget[]>>
  setPlacedWidgetsState: Dispatch<SetStateAction<PlacedWidget[]>>
  setSelectedComponent: Dispatch<SetStateAction<string | null>>
  setSelectedPageId: Dispatch<SetStateAction<string | null>>
  setSelectedWidgetId: Dispatch<SetStateAction<string | null>>
  setSelectedWidgetIds: Dispatch<SetStateAction<Set<string>>>
  undoWidgets: () => PlacedWidget[] | null | undefined
}

export function usePageEditorKeyboardShortcuts({
  canRedo,
  canUndo,
  clipboardWidget,
  clipboardWidgets,
  handleSave,
  isUndoRedoOperation,
  lastWidgetStateRef,
  page,
  placedWidgets,
  redoWidgets,
  selectedPageId,
  selectedWidgetId,
  selectedWidgetIds,
  setClipboardWidget,
  setClipboardWidgets,
  setPlacedWidgets,
  setPlacedWidgetsState,
  setSelectedComponent,
  setSelectedPageId,
  setSelectedWidgetId,
  setSelectedWidgetIds,
  undoWidgets,
}: UsePageEditorKeyboardShortcutsArgs) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

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

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedWidgetId) {
        e.preventDefault()
        if (selectedWidgetIds && selectedWidgetIds.size > 1) {
          const widgetsToCopy = placedWidgets.filter(w => selectedWidgetIds.has(w.id))
          setClipboardWidgets(widgetsToCopy.map(w => ({ ...w })))
          setClipboardWidget(null)
          toast.success(`${widgetsToCopy.length} widgets copied`)
        } else {
          const widgetToCopy = placedWidgets.find(w => w.id === selectedWidgetId)
          if (widgetToCopy) {
            setClipboardWidget({ ...widgetToCopy })
            setClipboardWidgets([])
            toast.success('Widget copied')
          }
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedWidgetId) {
        e.preventDefault()
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

      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && (clipboardWidget || (clipboardWidgets && clipboardWidgets.length > 0))) {
        e.preventDefault()

        let targetPageId: string | null = null
        if (selectedPageId) {
          targetPageId = selectedPageId
        } else if (placedWidgets.length > 0) {
          targetPageId = placedWidgets[0].pageId
        } else if (page) {
          targetPageId = page.id
        } else {
          toast.error('No page available to paste widget')
          return
        }

        if (clipboardWidgets && clipboardWidgets.length > 0) {
          const offset = { x: 20, y: 20 }
          const minX = Math.min(...clipboardWidgets.map(w => w.x))
          const minY = Math.min(...clipboardWidgets.map(w => w.y))
          const newWidgets: PlacedWidget[] = clipboardWidgets.map((widget, index) => ({
            ...widget,
            id: `widget_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
            pageId: targetPageId || '',
            x: widget.x - minX + offset.x,
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

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWidgetId && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
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
  }, [handleSave, canUndo, canRedo, undoWidgets, redoWidgets, selectedWidgetId, selectedWidgetIds, setPlacedWidgets, setSelectedWidgetId, setSelectedWidgetIds, placedWidgets, clipboardWidget, clipboardWidgets, selectedPageId, page, setClipboardWidget, setClipboardWidgets, setSelectedComponent, setPlacedWidgetsState, isUndoRedoOperation, lastWidgetStateRef, setSelectedPageId])
}
