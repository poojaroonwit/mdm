"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue"> {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number[]>(
      value || defaultValue || [min]
    )
    const isControlled = value !== undefined
    const currentValue = isControlled ? value : internalValue
    const sliderValue = currentValue[0] || min

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)]
      if (!isControlled) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    const percentage = ((sliderValue - min) / (max - min)) * 100

    return (
      <div
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
      >
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="absolute h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          {...props}
        />
        <div
          className="absolute block h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg transition-all duration-150 scale-110 hover:scale-125 active:scale-95 pointer-events-none z-0"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
