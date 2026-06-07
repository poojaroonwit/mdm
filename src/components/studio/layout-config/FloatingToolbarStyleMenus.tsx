'use client'

import React from 'react'
import { Expand, Palette, SlidersHorizontal, Type } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker'
import { PlacedWidget } from './widgets'

interface ToolbarMenuProps {
  widget: PlacedWidget
  onUpdateProperty: (path: string[], value: any) => void
}

export function TypographyMenu({ widget, onUpdateProperty }: ToolbarMenuProps) {
  const props = widget.properties || {}
  const style = props.style || {}

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2" title="Typography">
          <Type className="w-4 h-4" />
          <span className="ml-1 text-xs">Text</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Text</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-3 space-y-3">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Font Size</div>
            <input
              className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground"
              type="number"
              value={Number(style.fontSize ?? props.fontSize ?? 14)}
              onChange={(e) => onUpdateProperty(['properties', 'style', 'fontSize'], Number(e.target.value) || 14)}
            />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Font Weight</div>
            <select
              className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground"
              value={String(style.fontWeight ?? props.fontWeight ?? 'normal')}
              onChange={(e) => onUpdateProperty(['properties', 'style', 'fontWeight'], e.target.value)}
            >
              <option value="lighter">Light</option>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <EnhancedColorPicker
            value={style.color || props.textColor || '#111827'}
            onChange={(color) => onUpdateProperty(['properties', 'style', 'color'], color)}
            label="Font Color"
            className="text-xs"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StyleMenu({ widget, onUpdateProperty }: ToolbarMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2" title="Style">
          <Palette className="w-4 h-4" />
          <span className="ml-1 text-xs">Style</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Style Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-3">
          <EnhancedColorPicker
            value={widget.properties?.backgroundColor || widget.properties?.fillColor || '#ffffff'}
            onChange={(color) => onUpdateProperty(['properties', 'backgroundColor'], color)}
            label="Background Color"
            className="text-xs"
          />
        </div>
        <DropdownMenuSeparator />
        <div className="p-3">
          <div className="text-xs font-medium text-foreground mb-2">Border</div>
          <div className="space-y-2">
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Width</div>
              <input
                className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground"
                type="number"
                value={Number(widget.properties?.borderWidth ?? 0)}
                onChange={(e) => onUpdateProperty(['properties', 'borderWidth'], Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Radius</div>
              <input
                className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground"
                type="number"
                value={Number(widget.properties?.borderRadius ?? 0)}
                onChange={(e) => onUpdateProperty(['properties', 'borderRadius'], Number(e.target.value) || 0)}
              />
            </div>
            <EnhancedColorPicker
              value={widget.properties?.borderColor || '#000000'}
              onChange={(color) => onUpdateProperty(['properties', 'borderColor'], color)}
              label="Border Color"
              className="text-xs"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PaddingMenu({ widget, onUpdateProperty }: ToolbarMenuProps) {
  const pad = widget.properties?.padding || {}
  const current = typeof pad === 'object'
    ? pad
    : { top: Number(pad || 0), right: Number(pad || 0), bottom: Number(pad || 0), left: Number(pad || 0) }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2" title="Padding">
          <Expand className="w-4 h-4" />
          <span className="ml-1 text-xs">Padding</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Padding</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-3 grid grid-cols-2 gap-2">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side}>
              <div className="text-[11px] text-muted-foreground mb-1 capitalize">{side}</div>
              <input
                className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground"
                type="number"
                value={Number(current[side] || 0)}
                onChange={(e) => onUpdateProperty(['properties', 'padding'], { ...current, [side]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EffectsMenu({ widget, onUpdateProperty }: ToolbarMenuProps) {
  const shadow = widget.properties?.shadow || {}

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2" title="Effects">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="ml-1 text-xs">Effects</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Shadow & Effects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-3 grid grid-cols-2 gap-2">
          {(['offsetX', 'offsetY', 'blur', 'spread'] as const).map((field) => (
            <div key={field}>
              <div className="text-[11px] text-muted-foreground mb-1">{field}</div>
              <input
                className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground"
                type="number"
                value={Number(shadow[field] ?? 0)}
                onChange={(e) => onUpdateProperty(['properties', 'shadow'], { ...shadow, [field]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
          <div className="col-span-2">
            <EnhancedColorPicker
              value={shadow.color || '#000000'}
              onChange={(color) => onUpdateProperty(['properties', 'shadow'], { ...shadow, color })}
              label="Shadow Color"
              className="text-xs"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
