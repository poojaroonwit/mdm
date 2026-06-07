'use client'

import React, { useMemo } from 'react'
import { 
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Layers,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  SlidersHorizontal,
  Square,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { PlacedWidget } from './widgets'
import { Z_INDEX } from '@/lib/z-index'
import { EffectsMenu, PaddingMenu, StyleMenu, TypographyMenu } from './FloatingToolbarStyleMenus'

interface FloatingToolbarProps {
  selectedWidget: PlacedWidget | null
  selectedWidgets: PlacedWidget[]
  placedWidgets: PlacedWidget[]
  onUpdateWidget: (widgetId: string, updates: Partial<PlacedWidget>) => void
  onBulkUpdate: (updates: Partial<PlacedWidget>) => void
  onDelete: () => void
  onDuplicate: () => void
  onLock?: () => void
  onUnlock?: () => void
  onHide?: () => void
  onShow?: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
  selectedRect?: { x: number; y: number; width: number; height: number }
  zoom?: number
  onOpenProperties?: () => void
}

export function FloatingToolbar({
  selectedWidget,
  selectedWidgets,
  placedWidgets,
  onUpdateWidget,
  onBulkUpdate,
  onDelete,
  onDuplicate,
  onLock,
  onUnlock,
  onHide,
  onShow,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  selectedRect,
  zoom = 100,
  onOpenProperties,
}: FloatingToolbarProps) {
  const isMultiSelect = selectedWidgets.length > 1
  const widgets = isMultiSelect ? selectedWidgets : (selectedWidget ? [selectedWidget] : [])

  if (widgets.length === 0 || !selectedRect) return null

  const widget = widgets[0]

  const handleUpdateProperty = (path: string[], value: any) => {
    if (isMultiSelect) {
      const updates: Partial<PlacedWidget> = {}
      let current: any = updates
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = {}
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      
      // Apply to all selected widgets
      onBulkUpdate(updates)
    } else if (selectedWidget) {
      const updates: Partial<PlacedWidget> = {}
      let current: any = updates
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = {}
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      
      onUpdateWidget(selectedWidget.id, updates)
    }
  }

  const handleRotate = (direction: 'cw' | 'ccw') => {
    const currentRotation = (widget.properties?.rotation as number) || 0
    const newRotation = direction === 'cw' ? currentRotation + 90 : currentRotation - 90
    
    handleUpdateProperty(['properties', 'rotation'], newRotation)
  }

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    const key = direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical'
    const current = (widget.properties?.[key] as boolean) || false
    handleUpdateProperty(['properties', key], !current)
  }

  const toolbarStyle = useMemo(() => {
    if (!selectedRect) return {}
    
    // Fixed at top center of canvas (relative to canvas container)
    return {
      position: 'absolute' as const,
      left: '50%',
      top: '12px',
      transform: `translateX(-50%) scale(${zoom / 100})`,
      transformOrigin: 'top center',
      zIndex: Z_INDEX.floatingToolbar,
    }
  }, [zoom])

  return (
    <div 
      className="bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-1 pointer-events-auto"
      style={toolbarStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Properties Button - Opens right panel */}
      {onOpenProperties && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onOpenProperties}
          title="Properties"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="ml-1 text-xs">Properties</span>
        </Button>
      )}

      {/* Typography Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <TypographyMenu widget={widget} onUpdateProperty={handleUpdateProperty} />
      </div>

      {/* Style Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <StyleMenu widget={widget} onUpdateProperty={handleUpdateProperty} />
      </div>

      {/* Padding Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <PaddingMenu widget={widget} onUpdateProperty={handleUpdateProperty} />
      </div>

      {/* Effects Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <EffectsMenu widget={widget} onUpdateProperty={handleUpdateProperty} />
      </div>
      {/* Transform Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <RotateCw className="w-4 h-4" />
              <span className="ml-1 text-xs">Transform</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Transform</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleRotate('cw')}>
              <RotateCw className="w-4 h-4 mr-2" />
              Rotate 90° Clockwise
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRotate('ccw')}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rotate 90° Counter-clockwise
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleFlip('horizontal')}>
              <FlipHorizontal className="w-4 h-4 mr-2" />
              Flip Horizontal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFlip('vertical')}>
              <FlipVertical className="w-4 h-4 mr-2" />
              Flip Vertical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Layer Group */}
      {(onBringToFront || onSendToBack || onBringForward || onSendBackward) && (
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" title="Layer">
                <Layers className="w-4 h-4" />
                <span className="ml-1 text-xs">Layer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Layer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onBringToFront && (
                <DropdownMenuItem onClick={onBringToFront}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Bring to Front
                </DropdownMenuItem>
              )}
              {onBringForward && (
                <DropdownMenuItem onClick={onBringForward}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Bring Forward
                </DropdownMenuItem>
              )}
              {onSendBackward && (
                <DropdownMenuItem onClick={onSendBackward}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Send Backward
                </DropdownMenuItem>
              )}
              {onSendToBack && (
                <DropdownMenuItem onClick={onSendToBack}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Send to Back
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Actions Group */}
      <div className="flex items-center gap-1">
        {onDuplicate && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={onDuplicate}
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
        
        {widget.properties?.locked ? (
          onUnlock && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onUnlock}
              title="Unlock"
            >
              <Unlock className="w-4 h-4" />
            </Button>
          )
        ) : (
          onLock && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onLock}
              title="Lock"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )
        )}

        {widget.properties?.hidden ? (
          onShow && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onShow}
              title="Show"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )
        ) : (
          onHide && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onHide}
              title="Hide"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          )
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Element Type Indicator */}
      {widgets.length === 1 && (
        <div className="flex items-center border-l border-border pl-2 ml-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Square className="w-4 h-4" />
            <span className="capitalize">{widget.type.replace('-', ' ')}</span>
          </div>
        </div>
      )}

      {/* Multi-select indicator */}
      {isMultiSelect && (
        <div className="flex items-center border-l border-border pl-2 ml-2">
          <div className="text-xs text-muted-foreground font-medium">
            {selectedWidgets.length} selected
          </div>
        </div>
      )}
    </div>
  )
}


