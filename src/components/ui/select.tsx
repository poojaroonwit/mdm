"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { SCROLLABLE_HEIGHTS } from "@/lib/constants"
import { Z_INDEX } from "@/lib/z-index"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  labels: Map<string, string>
  registerLabel: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

const Select = ({ children, value: controlledValue, onValueChange, defaultValue }: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const [open, setOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Map<string, string>>(new Map())
  const triggerRef = React.useRef<HTMLElement>(null)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }, [isControlled, onValueChange])

  const registerLabel = React.useCallback((val: string, label: string) => {
    setLabels(prev => {
      // Only update if the label actually changed
      if (prev.get(val) === label) {
        return prev
      }
      const newMap = new Map(prev)
      newMap.set(val, label)
      return newMap
    })
  }, [])

  return (
    <SelectContext.Provider value={{ 
      value, 
      onValueChange: handleValueChange, 
      open, 
      setOpen, 
      triggerRef,
      labels,
      registerLabel
    }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => {
  return <div role="group">{children}</div>
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext)
  if (!context) return <span>{placeholder}</span>
  
  const displayLabel = context.labels?.get(context.value) || context.value || placeholder
  return <span>{displayLabel}</span>
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)
  React.useEffect(() => {
    if (context) {
      (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = triggerRef.current
    }
  }, [context])

  const handleClick = () => {
    context?.setOpen(!context.open)
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      data-component="select-trigger"
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-md border-none bg-zinc-100/50 dark:bg-zinc-900/50 px-4 py-2 text-sm ring-offset-background transition-all duration-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40 [&>span]:line-clamp-1 group shadow-none",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-300" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: "popper" | "item-aligned"
  }
>(({ className, children, position = "popper", ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const [positionState, setPositionState] = React.useState<{ 
    top?: number; 
    bottom?: number; 
    left: number; 
    width: number;
    maxHeight: number;
  } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  React.useEffect(() => {
    if (context?.open && context.triggerRef.current) {
      const rect = context.triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 16
      const spaceAbove = rect.top - 16
      
      // If space below is less than 160px and there's more space above, open upwards
      const shouldOpenUp = spaceBelow < 160 && spaceAbove > spaceBelow
      const maxHeight = Math.min(shouldOpenUp ? spaceAbove : spaceBelow, 500)

      if (shouldOpenUp) {
        setPositionState({
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          maxHeight
        })
      } else {
        setPositionState({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          maxHeight
        })
      }
    } else {
      setPositionState(null)
    }
  }, [context?.open])

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

  if (!context?.open || !positionState) return null

  const content = (
    <div
      ref={contentRef}
      data-component="select-content"
      className={cn(
        "fixed rounded-md border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl outline-none flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      style={{
        zIndex: Z_INDEX.portalDropdown + 50,
        top: positionState.top !== undefined ? `${positionState.top}px` : 'auto',
        bottom: positionState.bottom !== undefined ? `${positionState.bottom}px` : 'auto',
        left: `${positionState.left}px`,
        width: position === "popper" ? `${positionState.width}px` : "auto",
        minWidth: position === "popper" ? `${positionState.width}px` : "8rem",
        maxWidth: position === "popper" ? `${positionState.width}px` : "none",
        maxHeight: `${positionState.maxHeight}px`,
      }}
      {...props}
    >
      <div 
        className="p-1 overflow-y-auto overflow-x-hidden h-full" 
        style={{ width: position === "popper" ? `${positionState.width}px` : "auto" }}
      >
        {children}
      </div>
    </div>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const isSelected = context?.value === value
  const lastLabelRef = React.useRef<string>('')

  // Extract label text and register it
  React.useEffect(() => {
    if (!context?.registerLabel || !children) return

    let label = ''
    if (typeof children === 'string') {
      label = children
    } else if (typeof children === 'number') {
      label = String(children)
    } else if (React.isValidElement(children)) {
      // Extract text from React element
      const extractText = (node: React.ReactNode): string => {
        if (typeof node === 'string' || typeof node === 'number') {
          return String(node)
        }
        if (React.isValidElement(node)) {
          const props = node.props as { children?: React.ReactNode }
          if (props.children) {
            return React.Children.toArray(props.children)
              .map(extractText)
              .join('')
          }
        }
        if (Array.isArray(node)) {
          return node.map(extractText).join('')
        }
        return ''
      }
      label = extractText(children)
    } else if (Array.isArray(children)) {
      label = children
        .map(child => {
          if (typeof child === 'string' || typeof child === 'number') {
            return String(child)
          }
          if (React.isValidElement(child)) {
            const props = child.props as { children?: React.ReactNode }
            if (props.children) {
              return React.Children.toArray(props.children)
              .filter(c => typeof c === 'string' || typeof c === 'number')
              .join('')
            }
          }
          return ''
        })
        .join('')
    }

    // Only register if the label actually changed
    if (label && label !== lastLabelRef.current) {
      lastLabelRef.current = label
      context.registerLabel(value, label)
    }
  }, [context?.registerLabel, value, children])

  const handleClick = () => {
    context?.onValueChange(value)
  }

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn(
        "relative flex min-h-10 w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40",
        isSelected && "bg-zinc-100/80 dark:bg-zinc-800/80 font-black text-zinc-900 dark:text-white",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </div>
)

const SelectScrollDownButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </div>
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
