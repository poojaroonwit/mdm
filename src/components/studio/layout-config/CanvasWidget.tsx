'use client'

import React, { RefObject, useState } from 'react'
import { Square, Lock, MoreVertical } from 'lucide-react'
import { StarIcon, HomeIcon, Cog6ToothIcon, UserIcon, BellIcon } from '@heroicons/react/24/outline'
import { widgetsPalette, PlacedWidget } from './widgets'
import { WidgetRenderer } from './WidgetRenderer'
import { ResizeHandles } from './ResizeHandles'
import { WidgetContextMenu } from './WidgetContextMenu'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Z_INDEX } from '@/lib/z-index'

interface CanvasWidgetProps {
  widget: PlacedWidget
  isMobile: boolean
  isSelected: boolean
  isMultiSelected?: boolean
  isDraggingWidget: boolean
  canvasRef: RefObject<HTMLDivElement>
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedWidgetIds?: React.Dispatch<React.SetStateAction<Set<string>>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setIsDraggingWidget: React.Dispatch<React.SetStateAction<boolean>>
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>
  dragStateRef: React.MutableRefObject<{
    isDragging: boolean
    widgetId: string | null
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    initialX: number
    initialY: number
  }>
  resizeStateRef: React.MutableRefObject<{
    isResizing: boolean
    widgetId: string | null
    handle: string | null
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startLeft: number
    startTop: number
  }>
  placedWidgets: PlacedWidget[]
  clipboardWidget?: PlacedWidget | null
  clipboardWidgets?: PlacedWidget[]
  onCopy?: () => void
  onCut?: () => void
  onPaste?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onLock?: () => void
  onUnlock?: () => void
  onHide?: () => void
  onShow?: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
  spaceId?: string
}

export function CanvasWidget({
  widget,
  isMobile,
  isSelected,
  isMultiSelected = false,
  isDraggingWidget,
  canvasRef,
  setPlacedWidgets,
  setSelectedWidgetId,
  setSelectedWidgetIds,
  setSelectedComponent,
  setIsDraggingWidget,
  setDragOffset,
  setIsResizing,
  dragStateRef,
  resizeStateRef,
  placedWidgets,
  clipboardWidget,
  clipboardWidgets,
  onCopy,
  onCut,
  onPaste,
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
  spaceId,
}: CanvasWidgetProps) {
  const widgetDef = widgetsPalette.find(wd => wd.type === widget.type)
  const Icon = widgetDef?.icon || Square
  const isFilter = widget.type.includes('filter')
  const isLocked = widget.properties?.locked === true
  const isHidden = widget.properties?.hidden === true
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [showMenuButton, setShowMenuButton] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }

    // Prevent drag if locked
    if (isLocked && e.button === 0) {
      return
    }

    if (e.button === 0 && canvasRef.current) {
      e.preventDefault()
      e.stopPropagation()
      
      setSelectedWidgetId(widget.id)
      setSelectedComponent(null)
      
      const rect = canvasRef.current.getBoundingClientRect()
      const widgetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      
      const offset = {
        x: e.clientX - widgetRect.left,
        y: e.clientY - widgetRect.top
      }
      
      dragStateRef.current = {
        isDragging: true,
        widgetId: widget.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
        initialX: widget.x,
        initialY: widget.y,
      }
      
      setIsDraggingWidget(true)
      setDragOffset(offset)
      
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.cursor = 'grabbing'
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id) {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.cursor = 'grab'
      }
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!dragStateRef.current.isDragging) {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.cursor = 'grab'
      }
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasDragging = dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id
    setTimeout(() => {
      if (!dragStateRef.current.isDragging && !wasDragging) {
        if (e.shiftKey && setSelectedWidgetIds) {
          // Shift+Click: Multi-select
          setSelectedWidgetIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(widget.id)) {
              newSet.delete(widget.id)
              // If removing primary selection, set new primary
              if (isSelected && newSet.size > 0) {
                setSelectedWidgetId(Array.from(newSet)[0])
              } else if (newSet.size === 0) {
                setSelectedWidgetId(null)
              }
            } else {
              newSet.add(widget.id)
              setSelectedWidgetId(widget.id)
            }
            return newSet
          })
        } else {
          // Regular click: Single select
          setSelectedWidgetId(widget.id)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set([widget.id]))
          }
        }
        setSelectedComponent(null)
      }
    }, 10)
  }

  return (
    <div
      className={`absolute select-none ${isDraggingWidget && isSelected ? 'opacity-80 shadow-2xl' : 'opacity-100'} ${isDraggingWidget && isSelected ? 'scale-105' : 'scale-100'}`}
      data-widget-id={widget.id}
      draggable={false}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        left: `${widget.x}px`,
        top: `${widget.y}px`,
        width: `${widget.width || 200}px`,
        height: `${widget.height || 150}px`,
        cursor: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 'grabbing' : 'grab',
        transition: 'none',
        willChange: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 'transform, opacity' : 'auto',
        transform: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 'scale(1.02)' : 'scale(1)',
        zIndex: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id 
          ? Z_INDEX.canvasElementDragging 
          : (isSelected ? Z_INDEX.canvasElementSelected : Z_INDEX.canvasElement),
        opacity: isHidden ? 0.3 : (isDraggingWidget && isSelected ? 0.8 : 1),
        pointerEvents: isHidden ? 'none' : 'auto',
      }}
      onClick={handleClick}
      onMouseEnter={() => setShowMenuButton(true)}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedWidgetId(widget.id)
        if (setSelectedWidgetIds) {
          setSelectedWidgetIds(new Set([widget.id]))
        }
        // Store mouse position for popover positioning
        setMenuPosition({ x: e.clientX, y: e.clientY })
        setContextMenuOpen(true)
      }}
      onDragStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-1 right-1 bg-warning/20 rounded-full p-1" style={{ zIndex: Z_INDEX.canvasLockIndicator }}>
          <Lock className="h-3 w-3 text-warning" />
        </div>
      )}

      {/* 3-dot menu button - top outside element */}
      {(isSelected || showMenuButton) && !isLocked && (
        <a
          href="#"
          data-icon-button
          className="absolute z-50 flex items-center justify-center w-6 h-6 rounded transition-colors shadow-lg"
          style={{ 
            pointerEvents: 'auto',
            zIndex: Z_INDEX.canvasElementSelected + 10,
            top: '-24px',
            right: '4px'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Store mouse position for popover positioning
            setMenuPosition({ x: e.clientX, y: e.clientY })
            setContextMenuOpen(true)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setShowMenuButton(true)}
          onMouseLeave={() => !isSelected && setShowMenuButton(false)}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Context menu (for both button click and right-click) */}
      <WidgetContextMenu
        widget={widget}
        isLocked={isLocked}
        isHidden={isHidden}
        open={contextMenuOpen}
        onOpenChange={(open) => {
          setContextMenuOpen(open)
          if (!open) {
            setMenuPosition(null)
          }
        }}
        menuPosition={menuPosition}
        onCopy={() => {
          setSelectedWidgetId(widget.id)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set([widget.id]))
          }
          onCopy?.()
        }}
        onCut={() => {
          setSelectedWidgetId(widget.id)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set([widget.id]))
          }
          onCut?.()
        }}
        onPaste={clipboardWidget || (clipboardWidgets && clipboardWidgets.length > 0) ? onPaste : undefined}
        onDelete={() => {
          onDelete?.()
        }}
        onDuplicate={() => {
          onDuplicate?.()
        }}
        onLock={() => {
          onLock?.()
        }}
        onUnlock={() => {
          onUnlock?.()
        }}
        onHide={() => {
          onHide?.()
        }}
        onShow={() => {
          onShow?.()
        }}
        onBringToFront={onBringToFront}
        onSendToBack={onSendToBack}
        onBringForward={onBringForward}
        onSendBackward={onSendBackward}
      >
        <DropdownMenuTrigger asChild onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}>
          <div className="absolute inset-0 pointer-events-none" />
        </DropdownMenuTrigger>
      </WidgetContextMenu>

      {/* Resize handles - positioned on outer container to overlay the chart */}
      {isSelected && !isLocked && (
        <ResizeHandles
          widget={widget}
          setIsResizing={setIsResizing}
          resizeStateRef={resizeStateRef}
        />
      )}

      {isFilter ? (
        <>
          {/* Selected border indicator - square on top of border */}
          {isSelected && (
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 z-30" style={{ backgroundColor: '#1e40af' }} />
          )}
          <div className="w-full h-full flex items-center">
            <WidgetRenderer widget={widget} isMobile={isMobile} spaceId={spaceId} />
          </div>
        </>
      ) : (
        <div className={`w-full h-full bg-card ${isSelected ? 'border-2 border-blue-500 ring-2 ring-blue-500/20' : ''} rounded-lg shadow-lg overflow-hidden flex flex-col relative`} style={{
          backgroundColor: widget.properties?.backgroundColor || undefined,
        }}>
          {/* Selected border indicator - square on top of border */}
          {isSelected && (
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 z-30" style={{ backgroundColor: '#1e40af' }} />
          )}
          {/* Removed legacy canvas header bar to avoid duplicate headers; element header is now configurable via properties and rendered by the widget itself */}
          <div className="flex-1 overflow-hidden" style={{
            borderRadius: widget.properties?.borderRadius ? `${widget.properties.borderRadius}px` : undefined,
          }}>
            {widget.type === 'text' ? (
              <div className="w-full h-full flex items-center p-2" onMouseDown={(e) => e.stopPropagation()}>
                {/* Optional text icon */}
                {widget.properties?.textIconEnabled && (() => {
                  const size = Number(widget.properties?.textFontSize ?? widget.properties?.fontSize ?? 14)
                  const color = String(widget.properties?.textIconColor || '#111827')
                  const iconName = String(widget.properties?.textIcon || 'star')
                  const map: Record<string, React.ReactNode> = {
                    star: <StarIcon style={{ width: size, height: size, color, strokeWidth: 2 }} />,
                    home: <HomeIcon style={{ width: size, height: size, color, strokeWidth: 2 }} />,
                    settings: <Cog6ToothIcon style={{ width: size, height: size, color, strokeWidth: 2 }} />,
                    user: <UserIcon style={{ width: size, height: size, color, strokeWidth: 2 }} />,
                    bell: <BellIcon style={{ width: size, height: size, color, strokeWidth: 2 }} />,
                  }
                  return <div className="mr-2 flex items-center" aria-hidden>{map[iconName] || map.star}</div>
                })()}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full outline-none"
                  style={{
                    fontFamily: String(widget.properties?.textFontFamily || widget.properties?.fontFamily || 'inherit'),
                    fontSize: widget.properties?.textFontSize
                      ? `${widget.properties.textFontSize}px`
                      : (widget.properties?.fontSize ? `${widget.properties.fontSize}px` : undefined),
                    fontWeight: String(widget.properties?.textFontWeight || widget.properties?.fontWeight || 'normal') as any,
                    fontStyle: String(widget.properties?.textFontStyle || widget.properties?.fontStyle || 'normal') as any,
                    color: String(widget.properties?.textColor || '#000000'),
                    textAlign: String(widget.properties?.textAlign || 'left') as any,
                    width: '100%'
                  }}
                  onInput={(e) => {
                    const value = (e.currentTarget.textContent || '').replace(/\u00A0/g, ' ').trim()
                    setPlacedWidgets(prev => prev.map(w => 
                      w.id === widget.id
                        ? { ...w, properties: { ...w.properties, text: value } }
                        : w
                    ))
                  }}
                  onKeyDown={(e) => {
                    // Prevent canvas shortcuts while editing
                    e.stopPropagation()
                  }}
                >
                  {String(widget.properties?.text || 'Text')}
                </div>
              </div>
            ) : (
              <WidgetRenderer widget={widget} isMobile={isMobile} spaceId={spaceId} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

