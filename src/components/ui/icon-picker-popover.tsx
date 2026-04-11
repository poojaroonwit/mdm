"use client"

import React, { useMemo, useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { IconPicker } from "./icon-picker"
import { AnimatedIcon } from "./animated-icon"
import { Z_INDEX } from "@/lib/z-index"

type IconComponent = React.ComponentType<{ className?: string }>

// Helper to dynamically load icon
const loadIcon = async (iconName: string): Promise<IconComponent | null> => {
  try {
    const module = await import('lucide-react')
    return (module as any)[iconName] || null
  } catch {
    return null
  }
}

export interface IconPickerPopoverProps {
  value?: string
  onChange: (iconName: string) => void
  label?: string
  animated?: boolean
  animation?: 'none' | 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'float' | 'scale' | 'rotate' | 'shake' | 'glow'
  zIndex?: number
}

export default function IconPickerPopover({ value, onChange, animated = false, animation = 'scale', zIndex }: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [CurrentIcon, setCurrentIcon] = useState<IconComponent | null>(null)

  useEffect(() => {
    if (value) {
      loadIcon(value).then(setCurrentIcon)
    } else {
      setCurrentIcon(null)
    }
  }, [value])

  return (
    <div className="relative inline-block">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          const rect = anchorRef.current?.getBoundingClientRect() || null
          setAnchorRect(rect)
          setOpen((v) => !v)
        }}
        className="p-2 rounded-md inline-flex items-center gap-3 border border-zinc-100/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-sm shadow-lg"
        title={value || "Choose icon"}
      >
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner-sm">
          {CurrentIcon ? (
            animated ? (
              <AnimatedIcon
                icon={value!}
                size={20}
                animation={animation}
                trigger="hover"
                className="text-current"
              />
            ) : (
              <CurrentIcon className="h-5 w-5" />
            )
          ) : (
            <span className="text-xs">?</span>
          )}
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-[160px] truncate">{value || "None"}</span>
      </button>

      {open && anchorRect && createPortal(
        <>
          {/* Fullscreen click-capture above drawer/backdrops */}
          <div
            className="fixed inset-0"
            style={{ zIndex: Z_INDEX.overlay }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bg-white/95 dark:bg-zinc-950/95 border border-zinc-100/60 dark:border-zinc-800/60 rounded-2xl shadow-2xl backdrop-blur-xl"
            style={{
              zIndex: zIndex || Z_INDEX.popover,
              top: anchorRect.bottom + window.scrollY + 8,
              left: Math.min(
                anchorRect.left + window.scrollX,
                Math.max(8, window.scrollX + window.innerWidth - 740)
              ),
              width: 720
            }}
          >
            <div className="p-3">
              <IconPicker
                value={value}
                onChange={(name) => {
                  onChange(name)
                  setOpen(false)
                }}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}


