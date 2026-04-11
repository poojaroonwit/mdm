"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Z_INDEX } from "@/lib/z-index"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

const DropdownMenu = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLElement>(null)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)
  React.useEffect(() => {
    if (context) {
      (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = triggerRef.current
    }
  }, [context])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(!context.open)
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
        triggerRef.current = node
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
        if (context) {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
    })
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => {
  return <div role="group">{children}</div>
}

const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const DropdownMenuRadioGroup = ({ children, value, onValueChange }: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) => {
  return <div role="radiogroup">{children}</div>
}

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number
    align?: "start" | "center" | "end"
    customPosition?: { x: number; y: number } | null
  }
>(({ className, sideOffset = 4, align = "start", children, customPosition, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  React.useEffect(() => {
    // If custom position is provided, use it directly with a small offset
    if (customPosition && context?.open) {
      setPosition({
        top: customPosition.y + 8, // Small offset below cursor
        left: customPosition.x + 4, // Small offset to the right
      })
      return
    }

    if (context?.open && context.triggerRef.current) {
      const updatePosition = () => {
        if (!context.triggerRef.current || !contentRef.current) return
        
        const triggerRect = context.triggerRef.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()
        
        let left = triggerRect.left
        
        if (align === "end") {
          left = triggerRect.right - contentRect.width
        } else if (align === "center") {
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
        }
        
        setPosition({
          top: triggerRect.bottom + sideOffset,
          left: left,
        })
      }
      
      // Initial position (will be adjusted after content is measured)
      const triggerRect = context.triggerRef.current.getBoundingClientRect()
      setPosition({
        top: triggerRect.bottom + sideOffset,
        left: triggerRect.left,
      })
      
      // Update position after content is rendered and measured
      const timeoutId = setTimeout(updatePosition, 0)
      
      return () => clearTimeout(timeoutId)
    } else {
      setPosition(null)
    }
  }, [context?.open, sideOffset, align, customPosition])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        context?.open &&
        contentRef.current &&
        context.triggerRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !context.triggerRef.current.contains(e.target as Node)
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
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [context?.open])

  if (!context?.open || !position) return null

  const content = (
    <DropdownMenuPortal>
      <div
        ref={contentRef}
        className={cn(
          "min-w-[8rem] rounded-md border border-zinc-100/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 p-1 text-zinc-900 dark:text-white shadow-2xl outline-none backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300",
          className
        )}
        style={{
          position: "fixed",
          zIndex: Z_INDEX.popover + 200, // Above popover (popover uses popover + 100)
          top: `${position.top}px`,
          left: `${position.left}px`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuPortal>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    role="menuitem"
    className={cn(
      "relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus:bg-zinc-100/50 dark:focus:bg-zinc-800/50 disabled:pointer-events-none disabled:opacity-40",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
  }
>(({ className, children, checked, ...props }, ref) => (
  <div
    ref={ref}
    role="menuitemcheckbox"
    aria-checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus:bg-zinc-100/50 dark:focus:bg-zinc-800/50 disabled:pointer-events-none disabled:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4" />}
    </span>
    {children}
  </div>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
  }
>(({ className, children, checked, ...props }, ref) => (
  <div
    ref={ref}
    role="menuitemradio"
    aria-checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus:bg-zinc-100/50 dark:focus:bg-zinc-800/50 disabled:pointer-events-none disabled:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Circle className="h-2 w-2 fill-current" />}
    </span>
    {children}
  </div>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-all duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus:bg-zinc-100/50 dark:focus:bg-zinc-800/50",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </div>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "min-w-[8rem] rounded-md border border-zinc-100/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 p-1 text-zinc-900 dark:text-white shadow-2xl outline-none backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300",
      className
    )}
    style={{
      zIndex: Z_INDEX.popover + 200, // Above popover (popover uses popover + 100)
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      ...style,
    }}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
