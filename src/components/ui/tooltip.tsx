"use client"

import * as React from "react"
import { useState, useRef, useEffect, ReactNode } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

// --- AppKit Style Tooltip (New) ---
interface AppKitTooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  delay = 300,
  className = ''
}: AppKitTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const spacing = 8

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
        break
      case 'bottom':
        top = triggerRect.bottom + spacing
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
        left = triggerRect.left - tooltipRect.width - spacing
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
        left = triggerRect.right + spacing
        break
    }

    // Keep tooltip within viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0

    if (left < 0) left = 8
    if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8
    if (top < 0) top = 8
    if (top + tooltipRect.height > viewportHeight) top = viewportHeight - tooltipRect.height - 8

    setTooltipPosition({ top, left })
  }

  useEffect(() => {
    if (!isVisible) return

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible])

  const contentElement = isVisible && (
    <div
      ref={tooltipRef}
      className="bg-zinc-900/90 dark:bg-white/95 text-white dark:text-zinc-900 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-zinc-800/50 dark:border-zinc-200/50 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        position: 'fixed',
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        zIndex: 9999
      }}
      role="tooltip"
    >
      {content}
    </div>
  )

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {typeof document !== 'undefined' ? createPortal(contentElement, document.body) : null}
    </div>
  )
}

// --- Legacy Tooltip Components (Backward Compatibility) ---

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined)

const TooltipProvider = ({ children, delayDuration = 300 }: { children: React.ReactNode; delayDuration?: number }) => {
  return <>{children}</>
}

const TooltipClassic = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(TooltipContext)

  const handleMouseEnter = () => {
    context?.setOpen(true)
  }

  const handleMouseLeave = () => {
    context?.setOpen(false)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        handleMouseEnter()
        if (typeof (children as any).props?.onMouseEnter === 'function') {
          (children as any).props.onMouseEnter(e)
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        handleMouseLeave()
        if (typeof (children as any).props?.onMouseLeave === 'function') {
          (children as any).props.onMouseLeave(e)
        }
      },
      ref: (node: HTMLElement) => {
        if (typeof ref === 'function') {
          ref(node as any)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node as any
        }
        if ((children as any).ref) {
          if (typeof (children as any).ref === 'function') {
            (children as any).ref(node)
          } else {
            ((children as any).ref as React.MutableRefObject<HTMLElement | null>).current = node
          }
        }
      },
    })
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number
  }
>(({ className, sideOffset = 4, children, ...props }, ref) => {
  const context = React.useContext(TooltipContext)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  React.useEffect(() => {
    if (context?.open) {
      // Find the trigger element by traversing up from the content
      const findTrigger = () => {
        let element = contentRef.current?.previousElementSibling as HTMLElement
        while (element) {
          if (element.onmouseenter) {
            return element
          }
          element = element.previousElementSibling as HTMLElement
        }
        return null
      }
      
      const trigger = findTrigger()
      if (trigger) {
        triggerRef.current = trigger
        const rect = trigger.getBoundingClientRect()
        const contentRect = contentRef.current?.getBoundingClientRect()
        setPosition({
          top: rect.bottom + sideOffset,
          left: rect.left + (rect.width / 2),
        })
      }
    } else {
      setPosition(null)
    }
  }, [context?.open, sideOffset])

  if (!context?.open || !position) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "z-50 overflow-hidden rounded-lg bg-zinc-900/90 dark:bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white dark:text-zinc-900 border border-zinc-800/50 dark:border-zinc-200/50 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-300",
        className
      )}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
      {...props}
    >
      {children}
    </div>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
TooltipContent.displayName = "TooltipContent"

export { TooltipClassic as TooltipLegacy, TooltipTrigger, TooltipContent, TooltipProvider }
