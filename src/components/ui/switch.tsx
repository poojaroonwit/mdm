"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
      onChange?.(e)
    }

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ease-in-out shadow-inner border border-zinc-100/60 dark:border-zinc-800/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/20 dark:focus-visible:ring-zinc-500/20 focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-40",
            checked 
              ? "bg-zinc-900 dark:bg-zinc-100" 
              : "bg-zinc-100/50 dark:bg-zinc-800/50",
            className
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow-sm ring-0 transition-transform duration-300 ease-in-out",
              checked ? "translate-x-[22px]" : "translate-x-[2px]"
            )}
          />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }