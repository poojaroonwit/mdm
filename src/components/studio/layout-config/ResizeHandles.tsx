'use client'

import React from 'react'
import { PlacedWidget } from './widgets'

interface ResizeHandlesProps {
  widget: PlacedWidget
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>
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
}

export function ResizeHandles({ widget, setIsResizing, resizeStateRef }: ResizeHandlesProps) {
  const handleResizeStart = (handle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const widgetWidth = rect.width
    const widgetHeight = rect.height
    
    // Determine actual handle based on click position
    let actualHandle = handle
    if (handle === 'n') {
      if (clickX < 8) actualHandle = 'nw'
      else if (clickX > widgetWidth - 8) actualHandle = 'ne'
    } else if (handle === 's') {
      if (clickX < 8) actualHandle = 'sw'
      else if (clickX > widgetWidth - 8) actualHandle = 'se'
    } else if (handle === 'w') {
      if (clickY < 8) actualHandle = 'nw'
      else if (clickY > widgetHeight - 8) actualHandle = 'sw'
    } else if (handle === 'e') {
      if (clickY < 8) actualHandle = 'ne'
      else if (clickY > widgetHeight - 8) actualHandle = 'se'
    }
    
    resizeStateRef.current = {
      isResizing: true,
      widgetId: widget.id,
      handle: actualHandle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.width || 200,
      startHeight: widget.height || 150,
      startLeft: widget.x,
      startTop: widget.y,
    }
    
    setIsResizing(true)
    
    const cursorMap: Record<string, string> = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'sw': 'sw-resize',
      'se': 'se-resize',
      'n': 'n-resize',
      's': 's-resize',
      'w': 'w-resize',
      'e': 'e-resize',
    }
    
    document.body.style.cursor = cursorMap[actualHandle] || 'nw-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <>
      {/* Invisible edge zones for dragging from all borders */}
      {/* Top edge */}
      <div
        className="resize-handle absolute top-0 left-0 right-0 h-1 cursor-n-resize z-20"
        style={{ backgroundColor: 'transparent' }}
        onMouseDown={(e) => handleResizeStart('n', e)}
      />
      {/* Bottom edge */}
      <div
        className="resize-handle absolute bottom-0 left-0 right-0 h-1 cursor-s-resize z-20"
        style={{ backgroundColor: 'transparent' }}
        onMouseDown={(e) => handleResizeStart('s', e)}
      />
      {/* Left edge */}
      <div
        className="resize-handle absolute top-0 bottom-0 left-0 w-1 cursor-w-resize z-20"
        style={{ backgroundColor: 'transparent' }}
        onMouseDown={(e) => handleResizeStart('w', e)}
      />
      {/* Right edge */}
      <div
        className="resize-handle absolute top-0 bottom-0 right-0 w-1 cursor-e-resize z-20"
        style={{ backgroundColor: 'transparent' }}
        onMouseDown={(e) => handleResizeStart('e', e)}
      />
      
      {/* Corner square handles - positioned over the border */}
      <div
        className="resize-handle absolute top-0 left-0 w-2 h-2 cursor-nw-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(calc(-50% + 0.125rem), calc(-50% + 0.125rem))',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('nw', e)}
      />
      <div
        className="resize-handle absolute top-0 right-0 w-2 h-2 cursor-ne-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(calc(50% - 0.125rem), calc(-50% + 0.125rem))',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('ne', e)}
      />
      <div
        className="resize-handle absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(calc(-50% + 0.125rem), calc(50% - 0.125rem))',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('sw', e)}
      />
      <div
        className="resize-handle absolute bottom-0 right-0 w-2 h-2 cursor-se-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(calc(50% - 0.125rem), calc(50% - 0.125rem))',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('se', e)}
      />
      
      {/* Center edge handles - positioned over the border */}
      <div
        className="resize-handle absolute top-0 left-1/2 w-2 h-2 cursor-n-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(-50%, calc(-50% + 0.125rem))',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('n', e)}
      />
      <div
        className="resize-handle absolute bottom-0 left-1/2 w-2 h-2 cursor-s-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(-50%, calc(50% - 0.125rem))',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('s', e)}
      />
      <div
        className="resize-handle absolute top-1/2 left-0 w-2 h-2 cursor-w-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(calc(-50% + 0.125rem), -50%)',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('w', e)}
      />
      <div
        className="resize-handle absolute top-1/2 right-0 w-2 h-2 cursor-e-resize z-30 shadow-lg"
        style={{ 
          transform: 'translate(calc(50% - 0.125rem), -50%)',
          backgroundColor: '#1e40af'
        }}
        onMouseDown={(e) => handleResizeStart('e', e)}
      />
    </>
  )
}
