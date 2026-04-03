"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  variant: "pills" | "underline"
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

const Tabs = ({ children, value: controlledValue, onValueChange, defaultValue, className, variant = "pills" }: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  className?: string
  variant?: "pills" | "underline"
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange, variant }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical"
  }
>(({ className, orientation = "horizontal", ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const variant = context?.variant || "pills"

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        variant === "pills" 
          ? "inline-flex items-center justify-center rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 p-1 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-md"
          : "inline-flex h-10 items-center justify-start border-b border-zinc-100/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400",
        orientation === "vertical" && "inline-flex h-auto w-full flex-col items-stretch border-b-0",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const isActive = context?.value === value
  const variant = context?.variant || "pills"

  const handleClick = () => {
    context?.onValueChange(value)
  }

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-40",
        variant === "pills" && [
          "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-wider",
          isActive 
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        ],
        variant === "underline" && [
          "px-3 py-2.5 text-[10px] font-black uppercase tracking-wider",
          isActive 
            ? "text-zinc-900 dark:text-white relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900 dark:after:bg-zinc-50"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        ],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const isActive = context?.value === value

  if (!isActive) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn(
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
