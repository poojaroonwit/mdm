'use client'

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleSegmentedProps {
  /** Whether dark mode is currently active */
  isDarkMode: boolean
  /** Whether system mode is active (optional) */
  isSystemMode?: boolean
  /** Whether component is mounted/ready (optional) */
  mounted?: boolean
  /** Callback when light mode is selected */
  onLightMode: () => void
  /** Callback when dark mode is selected */
  onDarkMode: () => void
  /** Additional className for the container */
  className?: string
  /** Whether to show system mode help text */
  showSystemModeHelp?: boolean
  /** Alignment of the toggle */
  align?: 'left' | 'center' | 'right'
}

/**
 * Modern segmented control theme toggle component
 * 
 * @example
 * ```tsx
 * <ThemeToggleSegmented
 *   isDarkMode={isDarkMode}
 *   onLightMode={() => setTheme('light')}
 *   onDarkMode={() => setTheme('dark')}
 * />
 * ```
 */
export function ThemeToggleSegmented({
  isDarkMode,
  isSystemMode = false,
  mounted = true,
  onLightMode,
  onDarkMode,
  className,
  showSystemModeHelp = false,
  align = 'right',
}: ThemeToggleSegmentedProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <div className={cn('flex items-center', alignmentClasses[align], className)}>
      <div className={cn(
        "inline-flex items-center gap-1 p-1 bg-muted rounded-lg border border-border",
        isSystemMode && "opacity-60"
      )}>
        <button
          type="button"
          onClick={onLightMode}
          disabled={!mounted}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            !isDarkMode && !isSystemMode
              ? "bg-background text-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sun className={cn(
            'h-4 w-4',
            !isDarkMode && !isSystemMode 
              ? 'text-amber-500' 
              : isSystemMode && !isDarkMode
              ? 'text-amber-500/70'
              : 'text-muted-foreground'
          )} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={onDarkMode}
          disabled={!mounted}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            isDarkMode && !isSystemMode
              ? "bg-background text-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Moon className={cn(
            'h-4 w-4',
            isDarkMode && !isSystemMode 
              ? 'text-blue-500' 
              : isSystemMode && isDarkMode
              ? 'text-blue-500/70'
              : 'text-muted-foreground'
          )} />
          <span>Dark</span>
        </button>
      </div>
      {showSystemModeHelp && isSystemMode && (
        <p className="text-xs text-muted-foreground mt-2 px-2 text-center italic">
          Click Light or Dark to override system preference
        </p>
      )}
    </div>
  )
}

