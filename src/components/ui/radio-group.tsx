import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
  disabled?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === RadioGroupItem) {
            return React.cloneElement(child, {
              checked: value === (child.props as any).value,
              onChange: () => onValueChange?.((child.props as any).value),
            } as any)
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          value={value}
          id={id}
          disabled={disabled}
          className={cn(
            "h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/20 dark:focus-visible:ring-zinc-500/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-40 appearance-none cursor-pointer transition-all duration-200",
            "checked:bg-zinc-900 dark:checked:bg-zinc-100 checked:border-zinc-900 dark:checked:border-zinc-100 shadow-sm",
            className
          )}
          {...props}
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900 transition-opacity duration-200",
            (props as any).checked ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
