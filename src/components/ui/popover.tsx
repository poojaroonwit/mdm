"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { useControlledDialogState } from "@/lib/dialog-utils"
import { Z_INDEX } from "@/lib/z-index"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined)

// Global flag to prevent immediate re-toggling
const openingRef = { current: false }

const Popover = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}) => {
  const { open, setOpen } = useControlledDialogState({
    open: controlledOpen,
    onOpenChange,
    defaultOpen
  })
  const triggerRef = React.useRef<HTMLElement>(null)

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(PopoverContext)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (context) {
      // If we're currently opening, ignore this click
      if (openingRef.current) {
        return
      }
      const newOpen = !context.open
      if (newOpen) {
        // Set flag before opening to prevent immediate close
        openingRef.current = true
        context.setOpen(true)
        // Clear flag after a short delay
        setTimeout(() => {
          openingRef.current = false
        }, 300)
      } else {
        context.setOpen(false)
      }
    }
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        e.preventDefault()
        if (context) {
          // If we're currently opening, ignore this click
          if (openingRef.current) {
            return
          }
          const newOpen = !context.open
          if (newOpen) {
            // Set flag before opening to prevent immediate close
            openingRef.current = true
            context.setOpen(true)
            // Clear flag after a short delay
            setTimeout(() => {
              openingRef.current = false
            }, 300)
          } else {
            context.setOpen(false)
          }
        }
        props.onClick?.(e)
        if (typeof (children as any).props?.onClick === 'function') {
          (children as any).props.onClick(e)
        }
      },
      ref: (node: HTMLButtonElement) => {
        triggerRef.current = node
        if (context && node) {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
        // React 19: access ref from props instead of element.ref
        const childProps = (children as any).props
        if (childProps?.ref) {
          if (typeof childProps.ref === 'function') {
            childProps.ref(node)
          } else {
            (childProps.ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
        }
      },

    })
  }

  return (
    <button
      ref={(node) => {
        triggerRef.current = node
        if (context && node) {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      }}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end"
    sideOffset?: number
  }
>(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
  const context = React.useContext(PopoverContext)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  const calculatePosition = React.useCallback(() => {
    if (!context?.open) {
      setPosition(null)
      return
    }

    if (!context.triggerRef.current) {
      // If triggerRef not set yet, don't calculate position
      // It will be recalculated when ref is available
      return
    }

    try {
      const rect = context.triggerRef.current.getBoundingClientRect()
      const contentRect = contentRef.current?.getBoundingClientRect()

      // If content isn't rendered yet, use default dimensions
      if (!contentRect) {
        // Set initial position, will be recalculated once content is rendered
        const defaultWidth = 256
        let left = rect.left
        if (align === "center") {
          left = rect.left + (rect.width / 2) - (defaultWidth / 2)
        } else if (align === "end") {
          left = rect.right - defaultWidth
        }
        setPosition({
          top: rect.bottom + sideOffset,
          left,
        })
        return
      }

      const width = contentRect.width
      const height = contentRect.height

      // Calculate initial position
      let left = rect.left
      if (align === "center") {
        left = rect.left + (rect.width / 2) - (width / 2)
      } else if (align === "end") {
        left = rect.right - width
      }

      // Calculate top position (below trigger by default)
      let top = rect.bottom + sideOffset

      // Keep popover within viewport bounds
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 8 // Padding from viewport edges

      // Adjust horizontal position if it goes off-screen
      if (left < padding) {
        left = padding
      } else if (left + width > viewportWidth - padding) {
        left = viewportWidth - width - padding
      }

      // If popover would go off bottom, show it above the trigger instead
      if (top + height > viewportHeight - padding) {
        top = rect.top - height - sideOffset
        // If it still doesn't fit above, position it at the top of viewport
        if (top < padding) {
          top = padding
        }
      }

      // Ensure top is within bounds
      if (top < padding) {
        top = padding
      } else if (top + height > viewportHeight - padding) {
        top = viewportHeight - height - padding
      }

      setPosition({
        top,
        left,
      })
    } catch (error) {
      // If getBoundingClientRect fails, set a default position
      console.warn('Failed to calculate popover position:', error)
      setPosition({
        top: 100,
        left: 100,
      })
    }
  }, [context?.open, align, sideOffset])

  React.useEffect(() => {
    if (context?.open) {
      // Try to calculate position immediately
      if (context.triggerRef.current) {
        calculatePosition()
      }

      // Also use requestAnimationFrame as backup
      const frame = requestAnimationFrame(() => {
        if (context.triggerRef.current) {
          calculatePosition()
        }
      })

      return () => cancelAnimationFrame(frame)
    } else {
      setPosition(null)
    }
  }, [context?.open, calculatePosition])


  // Recalculate position once content is rendered (in case we used fallback position)
  React.useEffect(() => {
    if (context?.open && contentRef.current && context.triggerRef.current) {
      const frame = requestAnimationFrame(() => {
        calculatePosition()
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [context?.open, calculatePosition])

  // Recalculate position on window resize
  React.useEffect(() => {
    if (!context?.open) return

    const handleResize = () => {
      calculatePosition()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [context?.open, calculatePosition])

  const justOpenedRef = React.useRef(false)

  React.useEffect(() => {
    if (context?.open) {
      // Set flag when popover opens, clear it after a short delay
      justOpenedRef.current = true
      const timeoutId = setTimeout(() => {
        justOpenedRef.current = false
      }, 200)
      return () => clearTimeout(timeoutId)
    } else {
      justOpenedRef.current = false
    }
  }, [context?.open])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Ignore clicks immediately after opening
      if (justOpenedRef.current) return

      const target = e.target as HTMLElement

      // Check if click is inside a dropdown menu (which is portaled to body)
      // Dropdown menus are portaled and have higher z-index, check by traversing up the DOM
      let isInsideDropdown = false
      let element: HTMLElement | null = target
      while (element && element !== document.body) {
        // Check if element is a dropdown menu content or contains dropdown menu items
        const role = element.getAttribute('role')
        const zIndex = element.style.zIndex ? parseInt(element.style.zIndex) : 0
        if (
          role === 'menuitemradio' ||
          role === 'menuitem' ||
          role === 'radiogroup' ||
          (element.classList.contains('rounded-md') && zIndex > Z_INDEX.popover + 100)
        ) {
          isInsideDropdown = true
          break
        }
        element = element.parentElement
      }

      if (
        context?.open &&
        contentRef.current &&
        context.triggerRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !context.triggerRef.current.contains(e.target as Node) &&
        !isInsideDropdown
      ) {
        context.setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && context?.open) {
        context.setOpen(false)
      }
    }

    if (context?.open) {
      // Use click instead of mousedown to avoid catching the opening click
      document.addEventListener("click", handleClickOutside, true)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside, true)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [context?.open])

  // Debug: Log when popover is rendered (must be before early return to follow Rules of Hooks)
  React.useEffect(() => {
    if (context?.open) {
      // Use setTimeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect()
          const styles = window.getComputedStyle(contentRef.current)
          console.log('🔍 PopoverContent Debug:', {
            element: contentRef.current,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom,
              right: rect.right,
            },
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            styles: {
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              zIndex: styles.zIndex,
              position: styles.position,
              backgroundColor: styles.backgroundColor,
            },
            isVisible: rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0,
            isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
          })
        } else {
          console.warn('⚠️ PopoverContent ref is null!')
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [context?.open])

  if (!context?.open) return null

  // Always calculate a position - use fallback if position state not set yet
  let finalPosition = position
  if (!finalPosition && context.triggerRef.current) {
    try {
      const rect = context.triggerRef.current.getBoundingClientRect()
      finalPosition = {
        top: Math.min(rect.bottom + 4, window.innerHeight - 400),
        left: Math.min(rect.left, window.innerWidth - 340)
      }
    } catch {
      finalPosition = { top: 100, left: 100 }
    }
  }
  if (!finalPosition) {
    finalPosition = { top: 100, left: 100 }
  }

  // Get popover background color with opacity
  const getPopoverBg = () => {
    if (typeof window === 'undefined') return 'rgba(255, 255, 255, 0.50)'
    const root = document.documentElement
    const popoverValue = getComputedStyle(root).getPropertyValue('--popover').trim()
    const isDark = root.classList.contains('dark')

    // Parse HSL: "h s% l%" format
    const hslMatch = popoverValue.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%?/)
    if (hslMatch) {
      const h = parseFloat(hslMatch[1]) / 360
      const s = parseFloat(hslMatch[2]) / 100
      const l = parseFloat(hslMatch[3]) / 100

      // Convert HSL to RGB
      const c = (1 - Math.abs(2 * l - 1)) * s
      const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
      const m = l - c / 2

      let r = 0, g = 0, b = 0
      if (h < 1 / 6) { r = c; g = x; b = 0 }
      else if (h < 2 / 6) { r = x; g = c; b = 0 }
      else if (h < 3 / 6) { r = 0; g = c; b = x }
      else if (h < 4 / 6) { r = 0; g = x; b = c }
      else if (h < 5 / 6) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }

      return `rgba(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}, 0.50)`
    }

    // Fallback
    return isDark ? 'rgba(17, 24, 39, 0.50)' : 'rgba(255, 255, 255, 0.50)'
  }

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "rounded-xl border border-border/50 text-foreground shadow-2xl outline-none backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      style={{
        position: "fixed",
        zIndex: Z_INDEX.portalDropdown, 
        top: `${finalPosition.top}px`,
        left: `${finalPosition.left}px`,
        maxHeight: 'calc(100vh - 32px)', // Ensure it doesn't touch screen edges
        visibility: 'visible',
        opacity: 1,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        transform: 'none',
        backgroundColor: getPopoverBg(),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        ...props.style,
      }}
      {...(Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'style')))}
    >
      <div className="overflow-y-auto overflow-x-hidden flex-1 p-1">
        {children}
      </div>
    </div>
  )

  if (typeof window === "undefined") return null

  // Ensure we're portaling to body
  const portalTarget = document.body
  if (!portalTarget) {
    console.warn('⚠️ document.body is null!')
    return null
  }

  console.log('✅ Creating PopoverContent portal to body, position:', finalPosition)
  return createPortal(content, portalTarget)
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
