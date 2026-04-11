'use client'

import React, { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Palette } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 border-2 hover:scale-110 transition-transform"
          style={{ backgroundColor: value }}
        >
          <Palette className="h-3 w-3 text-white drop-shadow-lg" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Choose Color</div>
          <HexColorPicker color={value} onChange={onChange} />
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border-2 border-gray-300" 
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono text-gray-600">{value}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
