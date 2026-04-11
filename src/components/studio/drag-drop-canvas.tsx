'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical,
  Move,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Layers,
  Grid3X3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'

interface DragDropComponent {
  id: string
  type: string
  name: string
  props: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
  locked?: boolean
  hidden?: boolean
  zIndex?: number
  children?: DragDropComponent[]
}

interface DragState {
  isDragging: boolean
  dragType: 'component' | 'resize' | 'move'
  dragComponent: DragDropComponent | null
  dragOffset: { x: number; y: number }
  resizeHandle: string | null
  snapGrid: boolean
}

interface CanvasProps {
  components: DragDropComponent[]
  onUpdateComponent: (id: string, updates: Partial<DragDropComponent>) => void
  onDeleteComponent: (id: string) => void
  onDuplicateComponent: (id: string) => void
  selectedComponent: DragDropComponent | null
  onSelectComponent: (component: DragDropComponent | null) => void
  snapToGrid?: boolean
  gridSize?: number
}

export function DragDropCanvas({
  components,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent,
  selectedComponent,
  onSelectComponent,
  snapToGrid = true,
  gridSize = 20
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'move',
    dragComponent: null,
    dragOffset: { x: 0, y: 0 },
    resizeHandle: null,
    snapGrid: snapToGrid
  })

  const [history, setHistory] = useState<DragDropComponent[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Save state to history
  const saveToHistory = useCallback((newComponents: DragDropComponent[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newComponents])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      // Apply the previous state
      const prevComponents = history[historyIndex - 1]
      prevComponents.forEach(comp => {
        onUpdateComponent(comp.id, comp)
      })
    }
  }, [historyIndex, history, onUpdateComponent])

  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      // Apply the next state
      const nextComponents = history[historyIndex + 1]
      nextComponents.forEach(comp => {
        onUpdateComponent(comp.id, comp)
      })
    }
  }, [historyIndex, history, onUpdateComponent])

  // Snap to grid
  const snapToGridPosition = useCallback((x: number, y: number) => {
    if (!dragState.snapGrid) return { x, y }
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }, [dragState.snapGrid, gridSize])

  // Handle mouse down on component
  const handleMouseDown = useCallback((e: React.MouseEvent, component: DragDropComponent, handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const offsetX = e.clientX - rect.left - component.position.x
    const offsetY = e.clientY - rect.top - component.position.y

    setDragState({
      isDragging: true,
      dragType: handle ? 'resize' : 'move',
      dragComponent: component,
      dragOffset: { x: offsetX, y: offsetY },
      resizeHandle: handle || null,
      snapGrid: snapToGrid
    })

    onSelectComponent(component)
  }, [snapToGrid, onSelectComponent])

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.dragComponent || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    if (dragState.dragType === 'move') {
      const newX = canvasX - dragState.dragOffset.x
      const newY = canvasY - dragState.dragOffset.y
      const snapped = snapToGridPosition(newX, newY)
      
      onUpdateComponent(dragState.dragComponent.id, {
        position: snapped
      })
    } else if (dragState.dragType === 'resize' && dragState.resizeHandle) {
      const component = dragState.dragComponent
      let newWidth = component.size.width
      let newHeight = component.size.height
      let newX = component.position.x
      let newY = component.position.y

      switch (dragState.resizeHandle) {
        case 'se': // Southeast
          newWidth = Math.max(50, canvasX - component.position.x)
          newHeight = Math.max(50, canvasY - component.position.y)
          break
        case 'sw': // Southwest
          newWidth = Math.max(50, component.position.x + component.size.width - canvasX)
          newHeight = Math.max(50, canvasY - component.position.y)
          newX = canvasX
          break
        case 'ne': // Northeast
          newWidth = Math.max(50, canvasX - component.position.x)
          newHeight = Math.max(50, component.position.y + component.size.height - canvasY)
          newY = canvasY
          break
        case 'nw': // Northwest
          newWidth = Math.max(50, component.position.x + component.size.width - canvasX)
          newHeight = Math.max(50, component.position.y + component.size.height - canvasY)
          newX = canvasX
          newY = canvasY
          break
      }

      onUpdateComponent(component.id, {
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight }
      })
    }
  }, [dragState, onUpdateComponent, snapToGridPosition])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      saveToHistory(components)
      setDragState({
        isDragging: false,
        dragType: 'move',
        dragComponent: null,
        dragOffset: { x: 0, y: 0 },
        resizeHandle: null,
        snapGrid: snapToGrid
      })
    }
  }, [dragState.isDragging, components, saveToHistory, snapToGrid])

  // Event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'c':
            if (selectedComponent) {
              e.preventDefault()
              onDuplicateComponent(selectedComponent.id)
            }
            break
          case 'd':
            if (selectedComponent) {
              e.preventDefault()
              onDeleteComponent(selectedComponent.id)
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedComponent, onDuplicateComponent, onDeleteComponent])

  // Alignment functions
  const alignComponents = useCallback((alignment: string) => {
    if (!selectedComponent) return

    const selectedComponents = components.filter(comp => comp.id === selectedComponent.id)
    if (selectedComponents.length === 0) return

    const canvasWidth = canvasRef.current?.clientWidth || 800
    const canvasHeight = canvasRef.current?.clientHeight || 600

    selectedComponents.forEach(comp => {
      let newPosition = { ...comp.position }

      switch (alignment) {
        case 'left':
          newPosition.x = 0
          break
        case 'center':
          newPosition.x = (canvasWidth - comp.size.width) / 2
          break
        case 'right':
          newPosition.x = canvasWidth - comp.size.width
          break
        case 'top':
          newPosition.y = 0
          break
        case 'middle':
          newPosition.y = (canvasHeight - comp.size.height) / 2
          break
        case 'bottom':
          newPosition.y = canvasHeight - comp.size.height
          break
      }

      onUpdateComponent(comp.id, { position: newPosition })
    })
  }, [selectedComponent, components, onUpdateComponent])

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alignComponents('left')}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alignComponents('center')}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alignComponents('right')}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alignComponents('top')}
            title="Align Top"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alignComponents('middle')}
            title="Align Middle"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alignComponents('bottom')}
            title="Align Bottom"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        <div className="flex items-center gap-1">
          <Button
            variant={dragState.snapGrid ? "default" : "ghost"}
            size="sm"
            onClick={() => setDragState(prev => ({ ...prev, snapGrid: !prev.snapGrid }))}
            title="Snap to Grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full h-full bg-background rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden"
        onClick={() => onSelectComponent(null)}
      >
        {/* Grid */}
        {dragState.snapGrid && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`
            }}
          />
        )}

        {/* Components */}
        {components.map(component => (
          <div
            key={component.id}
            className={`absolute border-2 rounded cursor-move transition-all ${
              selectedComponent?.id === component.id
                ? 'border-primary shadow-lg'
                : 'border-transparent hover:border-primary/50'
            } ${component.hidden ? 'opacity-50' : ''}`}
            style={{
              left: component.position.x,
              top: component.position.y,
              width: component.size.width,
              height: component.size.height,
              zIndex: component.zIndex || 1
            }}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            {/* Component Content */}
            <div className="w-full h-full bg-background border border-border rounded p-2">
              <div className="text-sm font-medium mb-1">{component.name}</div>
              <div className="text-xs text-muted-foreground">
                {component.type} - {component.size.width}×{component.size.height}
              </div>
            </div>

            {/* Resize Handles */}
            {selectedComponent?.id === component.id && (
              <>
                {/* Corner handles */}
                <div
                  className="absolute w-3 h-3 bg-primary border border-white rounded-sm cursor-nw-resize"
                  style={{ top: -6, left: -6 }}
                  onMouseDown={(e) => handleMouseDown(e, component, 'nw')}
                />
                <div
                  className="absolute w-3 h-3 bg-primary border border-white rounded-sm cursor-ne-resize"
                  style={{ top: -6, right: -6 }}
                  onMouseDown={(e) => handleMouseDown(e, component, 'ne')}
                />
                <div
                  className="absolute w-3 h-3 bg-primary border border-white rounded-sm cursor-sw-resize"
                  style={{ bottom: -6, left: -6 }}
                  onMouseDown={(e) => handleMouseDown(e, component, 'sw')}
                />
                <div
                  className="absolute w-3 h-3 bg-primary border border-white rounded-sm cursor-se-resize"
                  style={{ bottom: -6, right: -6 }}
                  onMouseDown={(e) => handleMouseDown(e, component, 'se')}
                />

                {/* Component Actions */}
                <div className="absolute -top-8 left-0 flex items-center gap-1 bg-background rounded shadow-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateComponent(component.id, { locked: !component.locked })}
                    title={component.locked ? "Unlock" : "Lock"}
                  >
                    {component.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateComponent(component.id, { hidden: !component.hidden })}
                    title={component.hidden ? "Show" : "Hide"}
                  >
                    {component.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicateComponent(component.id)}
                    title="Duplicate (Ctrl+C)"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteComponent(component.id)}
                    title="Delete (Ctrl+D)"
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Drop Zone Indicator */}
        {dragState.isDragging && (
          <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none" />
        )}
      </div>
    </div>
  )
}
