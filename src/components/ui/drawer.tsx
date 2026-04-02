"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useControlledDialogState, useDialogBodyScrollLock, useDialogEscapeKey } from "@/lib/dialog-utils"
import { Z_INDEX } from "@/lib/z-index"

interface DrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(undefined)

const Drawer = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
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

  useDialogBodyScrollLock(open)

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  )
}

const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(true)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e)
        if (typeof (children as any).props?.onClick === 'function') {
          (children as any).props.onClick(e)
        }
      },
      ref: (node: HTMLButtonElement) => {
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
        if ((children as any).ref) {
          if (typeof (children as any).ref === 'function') {
            (children as any).ref(node)
          } else {
            ((children as any).ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
        }
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DrawerTrigger.displayName = "DrawerTrigger"

const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(false)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e)
        if (typeof (children as any).props?.onClick === 'function') {
          (children as any).props.onClick(e)
        }
      },
      ref: (node: HTMLButtonElement) => {
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
        if ((children as any).ref) {
          if (typeof (children as any).ref === 'function') {
            (children as any).ref(node)
          } else {
            ((children as any).ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
        }
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DrawerClose.displayName = "DrawerClose"

const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    overlayColor?: string
    overlayOpacity?: number
    overlayBlur?: number
  }
>(({ className, overlayColor, overlayOpacity, overlayBlur, style, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  // Get values from props or CSS variables (set by branding config)
  const color = overlayColor || (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--drawer-overlay-color').trim() || '#000000' : '#000000')
  const opacity = overlayOpacity ?? (typeof window !== 'undefined' ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--drawer-overlay-opacity').trim()) || 80 : 80)
  const blur = overlayBlur ?? (typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--drawer-overlay-blur').trim().replace('px', '')) || 4 : 4)

  // Convert hex to rgba if needed
  const getBackgroundColor = () => {
    if (!color) return undefined
    
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      // Extract RGB values and apply opacity
      const rgbMatch = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
      }
      return color
    } else {
      // Convert hex to rgba
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
    }
  }

  const backgroundColor = getBackgroundColor()
  const blurValue = blur > 0 ? `${blur}px` : undefined

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0",
        !backgroundColor && "bg-zinc-950/20 dark:bg-black/40",
        !blurValue && "backdrop-blur-md",
        className
      )}
      style={{ 
        zIndex: Z_INDEX.overlay,
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(blurValue ? { 
          backdropFilter: `blur(${blurValue})`,
          WebkitBackdropFilter: `blur(${blurValue})`
        } : {}),
        ...style
      }}
      onClick={() => context?.setOpen(false)}
      {...props}
    />
  )
})
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    widthClassName?: string
    floating?: boolean
    floatingMargin?: string
    overlayColor?: string
    overlayOpacity?: number
    overlayBlur?: number
    showOverlay?: boolean
  }
>(({ className, children, widthClassName, floating = true, floatingMargin, overlayColor, overlayOpacity, overlayBlur, showOverlay = true, ...props }, ref) => {
  const context = React.useContext(DrawerContext)
  const [isVisible, setIsVisible] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  useDialogEscapeKey(
    context?.open ?? false,
    () => context?.setOpen(false),
    true
  )

  // Handle animation states
  React.useEffect(() => {
    if (context?.open) {
      setIsVisible(true)
      // Small delay to ensure DOM is ready for animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      // Wait for exit animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [context?.open])

  if (!isVisible) return null

  // Get drawer style from CSS variables (set by branding config)
  const getDrawerStyle = () => {
    if (typeof window === 'undefined') {
      return { type: 'floating', margin: '16px', borderRadius: '24px', width: '500px', backgroundBlur: '20px', backgroundOpacity: '80' }
    }
    
    const type = getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-type').trim() || 'floating'
    const margin = getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-margin').trim() || '20px'
    const borderRadius = getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-border-radius').trim() || '24px'
    const width = getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-width').trim() || '500px'
    const backgroundBlur = getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-background-blur').trim() || '20px'
    const backgroundOpacity = getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-background-opacity').trim() || '80'
    
    return { type, margin, borderRadius, width, backgroundBlur, backgroundOpacity }
  }

  const style = getDrawerStyle()
  const drawerType = floating !== undefined ? (floating ? 'floating' : 'normal') : style.type
  const margin = floatingMargin || style.margin
  const borderRadius = style.borderRadius
  const backgroundBlur = style.backgroundBlur
  const backgroundOpacity = parseFloat(style.backgroundOpacity) || 80
  // Use provided widthClassName or generate from style.width
  const defaultWidth = widthClassName || (style.width ? `w-[${style.width}]` : 'w-[500px]')
  const widthValue = widthClassName ? undefined : style.width

  // Determine styling based on drawer type
  const getDrawerClasses = () => {
    const baseClasses = "fixed border border-zinc-100/60 dark:border-zinc-800/60 shadow-2xl outline-none transition-all duration-300 ease-out backdrop-blur-xl"
    
    switch (drawerType) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-3xl",
          defaultWidth
        )
      case 'floating':
        return cn(
          baseClasses,
          "rounded-3xl",
          defaultWidth
        )
      case 'normal':
      default:
        return cn(
          baseClasses,
          "inset-y-0 right-0 h-full border-l",
          defaultWidth
        )
    }
  }

  const getDrawerStyles = () => {
    const baseStyle: React.CSSProperties = {
      zIndex: Z_INDEX.drawer,
      ...(widthValue && !widthClassName ? { width: widthValue } : {}),
      backdropFilter: `blur(${backgroundBlur})`,
      WebkitBackdropFilter: `blur(${backgroundBlur})`,
      backgroundColor: `rgba(${typeof window !== 'undefined' ? (document.documentElement.classList.contains('dark') ? '9, 9, 11' : '255, 255, 255') : '255, 255, 255'}, ${backgroundOpacity / 100})`,
      // Animation transform
      transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
      opacity: isAnimating ? 1 : 0,
    }

    switch (drawerType) {
      case 'modern':
        const marginNum = parseFloat(margin) || 20
        const marginUnit = margin.replace(String(marginNum), '') || 'px'
        return {
          ...baseStyle,
          top: margin,
          right: margin,
          bottom: margin,
          height: `calc(100vh - ${marginNum * 2}${marginUnit})`,
          borderRadius: borderRadius,
        }
      case 'floating':
        const floatingMarginNum = parseFloat(margin) || 20
        const floatingMarginUnit = margin.replace(String(floatingMarginNum), '') || 'px'
        return {
          ...baseStyle,
          top: margin,
          right: margin,
          bottom: margin,
          left: 'auto',
          height: `calc(100vh - ${floatingMarginNum * 2}${floatingMarginUnit})`,
          borderRadius: borderRadius,
        }
      case 'normal':
      default:
        // Normal: full height, no margins
        return baseStyle
    }
  }

  const content = (
    <>
      {showOverlay && (
        <DrawerOverlay 
          overlayColor={overlayColor} 
          overlayOpacity={overlayOpacity} 
          overlayBlur={overlayBlur}
          style={{
            opacity: isAnimating ? 1 : 0,
            transition: 'opacity 300ms ease-out',
          }}
          className="bg-zinc-950/20 dark:bg-black/40 backdrop-blur-md"
        />
      )}
      <div
        ref={ref}
        className={cn(getDrawerClasses(), className)}
        style={{
          ...getDrawerStyles(),
          ...props.style
        }}
        data-drawer-content
        {...(Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'style')))}
      >
        {children}
      </div>
    </>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  // Get border radius from CSS variable to match drawer
  const borderRadius = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--drawer-style-border-radius').trim() || '24px'
    : '24px'
  
  return (
    <div 
      className={cn("border-b border-zinc-100/60 dark:border-zinc-800/60 px-6 py-6 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-md", className)} 
      style={{
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        ...style
      }}
      {...props}
    />
  )
}
const DrawerTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100", className)} {...props} />
)

const DrawerDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm font-medium text-zinc-500 dark:text-zinc-400", className)} {...props} />
)

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription }
