"use client"

import React, { useMemo, useState, useEffect, Suspense } from "react"
import { loadIcon, getIconNames } from "@/lib/utils/icon-loader"
import { Input } from "@/components/ui/input"
import { AnimatedIcon } from "./animated-icon"
import { Loader2, Check, Search } from "lucide-react"

type IconComponent = React.ComponentType<{ className?: string }>

export interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  placeholder?: string
  grouped?: boolean
  animated?: boolean
  animation?: 'none' | 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'float' | 'scale' | 'rotate' | 'shake' | 'glow'
}

function categorizeIcon(name: string): string {
  // Simple heuristics based on common Lucide prefixes/semantics
  if (/^(user|users|user|contact|profile|id)/i.test(name)) return 'Users & People'
  if (/^(building|home|house|factory|warehouse|store)/i.test(name)) return 'Places & Buildings'
  if (/^(calendar|clock|timer|hourglass|alarm|watch)/i.test(name)) return 'Date & Time'
  if (/^(file|folder|clipboard|document|note|book)/i.test(name)) return 'Files & Folders'
  if (/^(arrow|chevron|move|navigation|locate|pin)/i.test(name)) return 'Arrows & Navigation'
  if (/^(settings|cog|wrench|tool|hammer|gear)/i.test(name)) return 'Settings & Tools'
  if (/^(chart|bar|pie|line|trend|graph|activity)/i.test(name)) return 'Charts & Analytics'
  if (/^(credit|wallet|bank|coin|currency|shopping|cart)/i.test(name)) return 'Commerce & Finance'
  if (/^(message|mail|phone|chat|comment|inbox|send)/i.test(name)) return 'Communication'
  if (/^(image|photo|camera|video|play|pause|music|mic)/i.test(name)) return 'Media'
  if (/^(shield|lock|key|fingerprint|badge)/i.test(name)) return 'Security & Access'
  if (/^(bug|server|database|code|terminal)/i.test(name)) return 'Dev & System'
  if (/^(heart|star|like|dislike|smile|emoji)/i.test(name)) return 'Feedback & Status'
  return 'Others'
}

export function IconPicker({ value, onChange, placeholder = "Search icons...", grouped = true, animated = false, animation = 'scale' }: IconPickerProps) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [iconNames, setIconNames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load icon names on mount
  useEffect(() => {
    getIconNames().then((names) => {
      setIconNames(names)
      setIsLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return iconNames
    return iconNames.filter((name) => name.toLowerCase().includes(q))
  }, [iconNames, query])

  const renderIconButton = (name: string) => {
    const selected = value === name
    const LazyIcon = loadIcon(name)

    return (
      <button
        key={name}
        type="button"
        onClick={() => onChange(name)}
        className={
          "relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer select-none " +
          (selected
            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-sm"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900")
        }
        title={name}
      >
        <div
          className={
            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors border " +
            (selected
              ? "bg-white/10 border-white/20 text-white dark:bg-black/10 dark:border-black/20 dark:text-zinc-900"
              : "bg-white dark:bg-zinc-950 border-zinc-100/60 dark:border-zinc-800/60 text-zinc-500")
          }
        >
          {animated ? (
            <AnimatedIcon
              icon={name}
              size={16}
              animation={animation}
              trigger="hover"
              className="text-current"
            />
          ) : LazyIcon ? (
            <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
              <LazyIcon className="h-4 w-4" />
            </Suspense>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
        <span className="truncate">{name}</span>
        {selected && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white dark:text-zinc-900 opacity-60">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </button>
    )
  }

  const groupedIcons = useMemo(() => {
    if (!grouped) return null
    if (!filtered || filtered.length === 0) return null
    const map = new Map<string, string[]>()
    for (const name of filtered) {
      const cat = categorizeIcon(name)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(name)
    }
    const list = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'Others') return 1
      if (b[0] === 'Others') return -1
      return a[0].localeCompare(b[0])
    })
    // Prepend an "All" virtual category combining all icons
    const allIcons: string[] = []
    list.forEach(([, arr]) => allIcons.push(...arr))
    return [["All", allIcons] as [string, string[]], ...list]
  }, [filtered, grouped])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading icons...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Search input — AppKit style with search icon */}
      <div className="relative border-b border-zinc-100/60 dark:border-zinc-800/60 pb-2">
        <Search
          className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            // Reset category to "All" when searching so filtered results are always visible
            if (e.target.value.trim() !== '') {
              setActiveCategory('All')
            }
          }}
          placeholder={placeholder}
          className="w-full border border-zinc-100/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/10 rounded-xl py-2 pl-9 pr-3 text-xs leading-5 text-zinc-900 dark:text-zinc-100 bg-white/50 dark:bg-zinc-950/50 focus:outline-none transition-all duration-200"
          autoComplete="off"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 py-6 border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl">No icons found</div>
      ) : grouped && groupedIcons && Array.isArray(groupedIcons) && groupedIcons.length > 0 ? (
        <div className="flex border border-zinc-100/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl shadow-inner-sm" style={{ height: 'calc(min(70vh, 450px))' }}>
          {/* Left: Category list — AppKit-aligned styling */}
          <div className="w-1/3 min-w-[120px] max-w-[200px] border-r border-zinc-100/60 dark:border-zinc-800/60 overflow-auto p-1.5 bg-zinc-50/30 dark:bg-zinc-900/30">
            <ul className="space-y-0.5">
              {groupedIcons?.map(([category, items]) => {
                if (!items || !Array.isArray(items)) return null
                return (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 " +
                        (activeCategory === category
                          ? "bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100/60 dark:border-zinc-800/60 font-semibold text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent")
                      }
                    >
                      {category}
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1.5 font-black uppercase tracking-tighter">({items.length})</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          {/* Right: Icons list — AppKit-aligned list pattern */}
          <div className="flex-1 overflow-auto p-1.5">
            {groupedIcons
              ?.filter(([category]) => category === activeCategory)
              ?.map(([category, items]) => {
                if (!items || !Array.isArray(items)) return null
                return (
                  <div key={category} className="space-y-0.5">
                    {items?.map((name) => renderIconButton(name))}
                  </div>
                )
              })}
          </div>
        </div>
      ) : (
        <div className="max-h-72 overflow-auto border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl p-1.5 space-y-0.5 shadow-inner-sm">
          {filtered?.map((name) => renderIconButton(name))}
        </div>
      )}
    </div>
  )
}

export default IconPicker
