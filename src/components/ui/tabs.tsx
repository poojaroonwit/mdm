"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabsContextValue {
  baseId: string
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
  const baseId = React.useId()
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
    <TabsContext.Provider value={{ baseId, value, onValueChange: handleValueChange, variant }}>
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
          ? "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground"
          : "inline-flex h-10 items-center justify-start border-b border-border text-muted-foreground",
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
  const triggerId = `${context?.baseId ?? "tabs"}-trigger-${value}`
  const panelId = `${context?.baseId ?? "tabs"}-panel-${value}`

  const handleClick = () => {
    context?.onValueChange(value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const tabList = event.currentTarget.closest('[role="tablist"]')
    if (!tabList) return

    const tabs = Array.from(
      tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    ).filter((tab) => !tab.disabled)

    const currentIndex = tabs.indexOf(event.currentTarget)
    if (currentIndex === -1) return

    let nextIndex = currentIndex

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % tabs.length
        break
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = tabs.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    tabs[nextIndex]?.focus()
    tabs[nextIndex]?.click()
  }

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={triggerId}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex min-h-11 items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-[background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-40",
        variant === "pills" && [
          "rounded-lg px-4 py-2 text-sm font-semibold tracking-[-0.01em]",
          isActive 
            ? "bg-background text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(37,99,235,0.08)]" 
            : "text-muted-foreground hover:text-foreground"
        ],
        variant === "underline" && [
          "px-3 py-2.5 text-sm font-semibold tracking-[-0.01em]",
          isActive 
            ? "text-foreground relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary"
            : "text-muted-foreground hover:text-foreground"
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
  const triggerId = `${context?.baseId ?? "tabs"}-trigger-${value}`
  const panelId = `${context?.baseId ?? "tabs"}-panel-${value}`

  if (!isActive) return null

  return (
    <div
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={triggerId}
      tabIndex={0}
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
