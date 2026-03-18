'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'

interface ColorSwatchProps {
  colors: string[]
  selectedColor: string
  onColorSelect: (color: string) => void
  className?: string
}

const predefinedColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // Grays
    '#3b82f6', '#2563eb', '#1d4ed8', // Blues
    '#ef4444', '#dc2626', '#b91c1c', // Reds
    '#10b981', '#059669', '#047857', // Greens
    '#f59e0b', '#d97706', '#b45309', // Ambers
    '#8b5cf6', '#7c3aed', '#6d28d9', // Violets
    '#000000', '#1e293b',
]

export function ColorSwatch({ 
  colors = predefinedColors, 
  selectedColor, 
  onColorSelect, 
  className 
}: ColorSwatchProps) {
  return (
    <div className={cn('grid grid-cols-8 gap-2', className)}>
      {colors.map((color) => (
        <Button
          key={color}
          variant="outline"
          size="sm"
          className={cn(
            'w-8 h-8 p-0 border-2 rounded-full transition-all hover:scale-110 shadow-sm',
            selectedColor === color 
              ? 'border-primary ring-2 ring-primary/20' 
              : 'border-border/50 hover:border-primary/50'
          )}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
          title={color}
        >
          {selectedColor === color && (
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shadow-sm",
              color.toLowerCase() === '#ffffff' ? "bg-black/20" : "bg-white"
            )} />
          )}
        </Button>
      ))}
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  className?: string
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {label && <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{label}</label>}
      <div className="flex items-center space-x-3">
        <div className="relative group">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-11 h-11 border border-border/50 rounded-xl cursor-pointer p-0 overflow-hidden bg-transparent"
          />
          <div 
            className="absolute inset-1 rounded-lg pointer-events-none border border-black/5" 
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-11 px-4 border border-border/50 rounded-xl text-sm bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}
