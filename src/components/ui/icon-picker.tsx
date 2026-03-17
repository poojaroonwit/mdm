"use client"

import React, { useMemo, useState, useEffect, Suspense } from "react"
import { loadIcon, getIconNames } from "@/lib/utils/icon-loader"
import { Input } from "@/components/ui/input"
import { AnimatedIcon } from "./animated-icon"
import { Loader2 } from "lucide-react"

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
        className="p-2 rounded-md flex items-center justify-center transition-colors"
        title={name}
      >
        <div
          className={
            "h-10 w-10 rounded-full flex items-center justify-center transition-colors " +
            (selected
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200")
          }
        >
          {animated ? (
            <AnimatedIcon
              icon={name}
              size={20}
              animation={animation}
              trigger="hover"
              className="text-current"
            />
          ) : LazyIcon ? (
            <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
              <LazyIcon className="h-5 w-5" />
            </Suspense>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </div>
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
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          // Reset category to "All" when searching so filtered results are always visible
          if (e.target.value.trim() !== '') {
            setActiveCategory('All')
          }
        }}
        placeholder={placeholder}
      />
      {filtered.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-6 border rounded-md">No icons found</div>
      ) : grouped && groupedIcons && Array.isArray(groupedIcons) && groupedIcons.length > 0 ? (
        <div className="flex border rounded-md overflow-hidden bg-background" style={{ height: 'calc(min(70vh, 450px))' }}>
          {/* Left: Category list */}
          <div className="w-1/3 min-w-[120px] max-w-[200px] border-r overflow-auto p-2 bg-muted/30">
            <ul className="space-y-1">
              {groupedIcons?.map(([category, items]) => {
                if (!items || !Array.isArray(items)) return null
                return (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={
                        "w-full text-left px-2 py-1 rounded-md text-sm transition-colors " +
                        (activeCategory === category
                          ? "bg-white shadow-sm"
                          : "hover:bg-white/60")
                      }
                    >
                      {category}
                      <span className="text-[10px] text-muted-foreground ml-1">({items.length})</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          {/* Right: Icons grid */}
          <div className="flex-1 overflow-auto p-2">
            {groupedIcons
              ?.filter(([category]) => category === activeCategory)
              ?.map(([category, items]) => {
                if (!items || !Array.isArray(items)) return null
                return (
                  <div key={category}>
                    <div className="grid grid-cols-6 gap-4">
                      {items?.map((name) => renderIconButton(name))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4 max-h-72 overflow-auto border rounded-md p-2">
          {filtered?.map((name) => renderIconButton(name))}
        </div>
      )}
    </div>
  )
}

export default IconPicker

