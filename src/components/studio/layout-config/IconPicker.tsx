'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, LayoutDashboard, ClipboardList, Workflow, Layers, FileIcon, Settings, FileText } from 'lucide-react'
import { SpacesEditorPage } from '@/lib/space-studio-manager'
import toast from 'react-hot-toast'

interface IconPickerProps {
  spaceId: string
  page: SpacesEditorPage
  allIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  reactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  isMobileViewport: boolean
  onUpdate: (pageId: string, icon: string) => Promise<void>
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function IconPicker({
  spaceId,
  page,
  allIcons,
  reactIcons,
  isMobileViewport,
  onUpdate,
  trigger,
  open,
  onOpenChange,
}: IconPickerProps) {
  const [iconSearchQuery, setIconSearchQuery] = useState('')
  const [iconPickerTab, setIconPickerTab] = useState<'icons' | 'lucide' | 'heroicons' | 'react-icons' | 'alphabet' | 'numbers' | 'roman' | 'colors'>('heroicons')
  const [iconLibraryTab, setIconLibraryTab] = useState<'all' | 'ho' | 'hs' | 'fa' | 'md' | 'fi' | 'ai' | 'bs' | 'hi'>('all')
  
  // Common icons for pages
  const commonIcons = [
    { name: 'LayoutDashboard', icon: LayoutDashboard, library: 'lucide' },
    { name: 'ClipboardList', icon: ClipboardList, library: 'lucide' },
    { name: 'Workflow', icon: Workflow, library: 'lucide' },
    { name: 'Layers', icon: Layers, library: 'lucide' },
    { name: 'File', icon: FileIcon, library: 'lucide' },
    { name: 'Settings', icon: Settings, library: 'lucide' },
    { name: 'FileText', icon: FileText, library: 'lucide' },
  ]
  
  // Alphabet A-Z
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  
  // Numbers 0-9
  const numbers = '0123456789'.split('')
  
  // Roman numerals
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC', 'C', 'D', 'M']
  
  // Color swatches
  const colorSwatches = [
    { name: 'Red', value: '#ef4444', color: 'bg-red-500' },
    { name: 'Orange', value: '#f97316', color: 'bg-orange-500' },
    { name: 'Amber', value: '#f59e0b', color: 'bg-amber-500' },
    { name: 'Yellow', value: '#eab308', color: 'bg-yellow-500' },
    { name: 'Lime', value: '#84cc16', color: 'bg-lime-500' },
    { name: 'Green', value: '#22c55e', color: 'bg-green-500' },
    { name: 'Emerald', value: '#10b981', color: 'bg-emerald-500' },
    { name: 'Teal', value: '#14b8a6', color: 'bg-teal-500' },
    { name: 'Cyan', value: '#06b6d4', color: 'bg-cyan-500' },
    { name: 'Sky', value: '#0ea5e9', color: 'bg-sky-500' },
    { name: 'Blue', value: '#1e40af', color: 'bg-blue-500' },
    { name: 'Indigo', value: '#6366f1', color: 'bg-indigo-500' },
    { name: 'Violet', value: '#8b5cf6', color: 'bg-violet-500' },
    { name: 'Purple', value: '#a855f7', color: 'bg-purple-500' },
    { name: 'Fuchsia', value: '#d946ef', color: 'bg-fuchsia-500' },
    { name: 'Pink', value: '#ec4899', color: 'bg-pink-500' },
    { name: 'Rose', value: '#f43f5e', color: 'bg-rose-500' },
    { name: 'Gray', value: '#6b7280', color: 'bg-gray-500' },
    { name: 'Slate', value: '#64748b', color: 'bg-slate-500' },
    { name: 'Zinc', value: '#71717a', color: 'bg-zinc-500' },
    { name: 'Neutral', value: '#737373', color: 'bg-neutral-500' },
    { name: 'Stone', value: '#78716c', color: 'bg-stone-500' },
    { name: 'Black', value: '#000000', color: 'bg-black' },
    { name: 'White', value: '#ffffff', color: 'bg-white border border-gray-300' },
  ]
  
  const filteredIcons = useMemo(() => {
    let iconsToFilter: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }> = []
    
    if (iconPickerTab === 'icons' || iconPickerTab === 'lucide') {
      iconsToFilter = [...commonIcons, ...allIcons]
    } else if (iconPickerTab === 'heroicons') {
      iconsToFilter = reactIcons.filter(icon => icon.library === 'ho' || icon.library === 'hs')
      
      // Filter by library if selected (ho or hs)
      if (iconLibraryTab !== 'all' && (iconLibraryTab === 'ho' || iconLibraryTab === 'hs')) {
        iconsToFilter = iconsToFilter.filter(icon => icon.library === iconLibraryTab)
      }
    } else if (iconPickerTab === 'react-icons') {
      iconsToFilter = reactIcons
      
      // Filter by library if selected
      if (iconLibraryTab !== 'all') {
        iconsToFilter = iconsToFilter.filter(icon => icon.library === iconLibraryTab)
      }
    } else {
      return []
    }
    
    if (!iconSearchQuery.trim()) {
      // Show common icons first (only for lucide), then first 100 from filtered icons
      if (iconPickerTab === 'icons' || iconPickerTab === 'lucide') {
        return [...commonIcons, ...iconsToFilter.filter(i => !commonIcons.find(c => c.name === i.name)).slice(0, 100)]
      }
      return iconsToFilter.slice(0, 200)
    }
    
    const query = iconSearchQuery.toLowerCase()
    const filtered = iconsToFilter.filter(icon => 
      icon.name.toLowerCase().includes(query)
    )
    
    // If lucide icons, prioritize common icons
    if (iconPickerTab === 'icons' || iconPickerTab === 'lucide') {
      const commonMatches = commonIcons.filter(icon => 
        icon.name.toLowerCase().includes(query)
      )
      return [...commonMatches, ...filtered.filter(icon => 
        !commonIcons.find(c => c.name === icon.name)
      )].slice(0, 200)
    }
    
    return filtered.slice(0, 200)
  }, [iconSearchQuery, allIcons, reactIcons, iconPickerTab, iconLibraryTab])
  
  const filteredAlphabet = useMemo(() => {
    if (!iconSearchQuery.trim()) return alphabet
    const query = iconSearchQuery.toLowerCase()
    return alphabet.filter(letter => letter.toLowerCase().includes(query))
  }, [iconSearchQuery])
  
  const filteredNumbers = useMemo(() => {
    if (!iconSearchQuery.trim()) return numbers
    const query = iconSearchQuery.toLowerCase()
    return numbers.filter(num => num.includes(query))
  }, [iconSearchQuery])
  
  const filteredRoman = useMemo(() => {
    if (!iconSearchQuery.trim()) return romanNumerals
    const query = iconSearchQuery.toLowerCase()
    return romanNumerals.filter(roman => roman.toLowerCase().includes(query))
  }, [iconSearchQuery])
  
  const filteredColors = useMemo(() => {
    if (!iconSearchQuery.trim()) return colorSwatches
    const query = iconSearchQuery.toLowerCase()
    return colorSwatches.filter(color => color.name.toLowerCase().includes(query))
  }, [iconSearchQuery])

  const handleIconSelect = async (iconValue: string) => {
    try {
      await onUpdate(page.id, iconValue)
      toast.success('Icon updated')
      onOpenChange?.(false)
      setIconSearchQuery('')
      setIconPickerTab('icons')
    } catch (err) {
      toast.error('Failed to update icon')
      console.error(err)
    }
  }

  return (
    <Popover 
      open={open} 
      onOpenChange={(open) => {
        onOpenChange?.(open)
        if (!open) setIconSearchQuery('')
      }}
    >
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[450px] p-0" 
        align="start"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '450px', minWidth: '450px', maxWidth: '450px' }}
      >
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search ${iconPickerTab}...`}
              value={iconSearchQuery}
              onChange={(e) => setIconSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Tabs for different icon types */}
          <Tabs value={iconPickerTab} onValueChange={(v) => {
            setIconPickerTab(v as any)
            setIconLibraryTab('all') // Reset library tab when switching
          }}>
            <div className="mt-3">
              <TabsList className="grid grid-cols-8 w-full h-8">
              <TabsTrigger value="icons" className="text-[10px] px-1">Lucide</TabsTrigger>
              <TabsTrigger value="heroicons" className="text-[10px] px-1">Hero</TabsTrigger>
              <TabsTrigger value="react-icons" className="text-[10px] px-1">React</TabsTrigger>
              <TabsTrigger value="alphabet" className="text-[10px] px-1">A-Z</TabsTrigger>
              <TabsTrigger value="numbers" className="text-[10px] px-1">0-9</TabsTrigger>
              <TabsTrigger value="roman" className="text-[10px] px-1">Roman</TabsTrigger>
              <TabsTrigger value="colors" className="text-[10px] px-1">Colors</TabsTrigger>
            </TabsList>
            
            {/* Heroicons Library Selector */}
            {iconPickerTab === 'heroicons' && (
              <div className="mt-2 p-2 border-b">
                <div className="text-xs font-semibold text-foreground mb-1">Heroicons Style:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'ho', label: 'Outline (24px)' },
                    { value: 'hs', label: 'Solid (24px)' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIconLibraryTab(value as any)
                      }}
                      className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                        iconLibraryTab === value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* React Icons Library Selector */}
            {iconPickerTab === 'react-icons' && (
              <div className="mt-2 p-2 border-b">
                <div className="text-xs font-semibold text-foreground mb-1">Icon Library:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'fa', label: 'Font Awesome' },
                    { value: 'md', label: 'Material' },
                    { value: 'fi', label: 'Feather' },
                    { value: 'ai', label: 'Ant Design' },
                    { value: 'bs', label: 'Bootstrap' },
                    { value: 'hi', label: 'Heroicons' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIconLibraryTab(value as any)
                      }}
                      className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                        iconLibraryTab === value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <TabsContent value="heroicons" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {iconSearchQuery ? 'No icons found' : 'Loading Heroicons...'}
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map(({ name, icon: IconComp }) => {
                    const isSelected = page.icon === name || page.icon?.startsWith(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleIconSelect(name)
                        }}
                        className={`p-2 rounded-md border transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-background border-border hover:bg-muted hover:border-border'
                        }`}
                        title={name}
                      >
                        <IconComp className={`h-4 w-4 mx-auto ${isSelected ? 'text-primary' : 'text-foreground'}`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="icons" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {iconSearchQuery ? 'No icons found' : 'Loading icons...'}
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map(({ name, icon: IconComp }) => {
                    const isSelected = page.icon === name || (!page.icon && name === 'File')
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleIconSelect(`lucide-${name}`)
                        }}
                        className={`p-2 rounded-md border transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-background border-border hover:bg-muted hover:border-border'
                        }`}
                        title={name}
                      >
                        <IconComp className={`h-4 w-4 mx-auto ${isSelected ? 'text-primary' : 'text-foreground'}`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="react-icons" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {iconSearchQuery ? 'No icons found' : reactIcons.length === 0 ? 'Loading react-icons...' : 'Select a library above'}
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map(({ name, icon: IconComp }) => {
                    const isSelected = page.icon === name || page.icon?.startsWith(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleIconSelect(name)
                        }}
                        className={`p-2 rounded-md border transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-background border-border hover:bg-muted hover:border-border'
                        }`}
                        title={name}
                      >
                        <IconComp className={`h-4 w-4 mx-auto ${isSelected ? 'text-primary' : 'text-foreground'}`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="alphabet" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {filteredAlphabet.map((letter) => {
                  const isSelected = page.icon === `letter-${letter}` || (page.icon === letter)
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleIconSelect(`letter-${letter}`)
                      }}
                      className={`p-2 rounded-md border transition-colors flex items-center justify-center ${
                        isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-border hover:bg-muted hover:border-border'
                      }`}
                      title={letter}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {letter}
                      </span>
                    </button>
                  )
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="numbers" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {filteredNumbers.map((num) => {
                  const isSelected = page.icon === `number-${num}` || (page.icon === num)
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleIconSelect(`number-${num}`)
                      }}
                      className={`p-2 rounded-md border transition-colors flex items-center justify-center ${
                        isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-border hover:bg-muted hover:border-border'
                      }`}
                      title={num}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {num}
                      </span>
                    </button>
                  )
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="roman" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {filteredRoman.map((roman) => {
                  const isSelected = page.icon === `roman-${roman}` || (page.icon === roman)
                  return (
                    <button
                      key={roman}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleIconSelect(`roman-${roman}`)
                      }}
                      className={`p-2 rounded-md border transition-colors flex items-center justify-center ${
                        isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-border hover:bg-muted hover:border-border'
                      }`}
                      title={roman}
                    >
                      <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {roman}
                      </span>
                    </button>
                  )
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="colors" className="mt-2 p-2 max-h-[350px] overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {filteredColors.map((color) => {
                  const isSelected = page.icon === `color-${color.value}` || (page.icon === color.value)
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleIconSelect(`color-${color.value}`)
                      }}
                      className={`p-2 rounded-md border-2 transition-all flex items-center justify-center ${
                        isSelected 
                          ? 'border-primary ring-2 ring-primary/30' 
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                      title={color.name}
                    >
                      <div className={`w-full h-6 rounded ${color.color}`} />
                    </button>
                  )
                })}
              </div>
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  )
}

