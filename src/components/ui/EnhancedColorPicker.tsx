'use client'

import React, { useState, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Palette, Layers } from 'lucide-react'
import { GradientColorPicker } from './GradientColorPicker'

interface EnhancedColorPickerProps {
  value?: string
  onChange: (value: string) => void
  onApply?: () => void
  onCancel?: () => void
  showApplyCancel?: boolean
  className?: string
  label?: string
}

export function EnhancedColorPicker({
  value = '#000000',
  onChange,
  onApply,
  onCancel,
  showApplyCancel = true,
  className = '',
  label = 'Color'
}: EnhancedColorPickerProps) {
  const [colorType, setColorType] = useState<'solid' | 'gradient'>('solid')
  const [pendingValue, setPendingValue] = useState(value)
  const [showPicker, setShowPicker] = useState(false)

  // Determine initial color type based on value
  React.useEffect(() => {
    if (value && value.includes('gradient')) {
      setColorType('gradient')
    } else {
      setColorType('solid')
    }
    setPendingValue(value)
  }, [value])

  const handleSolidColorChange = useCallback((hex: string) => {
    setPendingValue(hex)
  }, [])

  const handleGradientChange = useCallback((gradient: string) => {
    setPendingValue(gradient)
  }, [])

  const handleApply = useCallback(() => {
    onChange(pendingValue)
    setShowPicker(false)
    onApply?.()
  }, [pendingValue, onChange, onApply])

  const handleCancel = useCallback(() => {
    setPendingValue(value)
    setShowPicker(false)
    onCancel?.()
  }, [value, onCancel])

  const handleSwatchClick = useCallback(() => {
    setShowPicker(!showPicker)
  }, [showPicker])

  const getSwatchBackground = () => {
    if (colorType === 'gradient') {
      return pendingValue
    }
    return pendingValue
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{label}</Label>
      
      <div className="flex items-center gap-2">
        {/* Color Type Toggle */}
        <div className="flex border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
          <Button
            variant={colorType === 'solid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setColorType('solid')}
            className="h-8 px-2 rounded-r-none"
          >
            <Palette className="w-3 h-3" />
          </Button>
          <Button
            variant={colorType === 'gradient' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setColorType('gradient')}
            className="h-8 px-2 rounded-l-none"
          >
            <Layers className="w-3 h-3" />
          </Button>
        </div>

        {/* Color Swatch */}
        <div
          className="w-8 h-8 border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl cursor-pointer shadow-sm"
          style={{ background: getSwatchBackground() }}
          onClick={handleSwatchClick}
        />

        {/* Color Input */}
        <Input
          value={colorType === 'solid' ? pendingValue : 'Gradient'}
          onChange={(e) => {
            if (colorType === 'solid') {
              setPendingValue(e.target.value)
            }
          }}
          className="h-8 text-xs"
          placeholder={colorType === 'solid' ? '#000000' : 'Gradient'}
          readOnly={colorType === 'gradient'}
        />
      </div>

      {/* Color Picker */}
      {showPicker && (
        <div className="mt-2 p-3 border border-zinc-100/60 dark:border-zinc-800/60 rounded-2xl bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          {colorType === 'solid' ? (
            <div>
              <div className="space-y-3">
                <HexColorPicker
                  color={pendingValue}
                  onChange={handleSolidColorChange}
                  style={{ width: '100%' }}
                />
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-lg border border-zinc-100/60 dark:border-zinc-800/60 shadow-sm" 
                    style={{ backgroundColor: pendingValue }}
                  />
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">{pendingValue}</span>
                </div>
              </div>
              {showApplyCancel && (
                <div className="flex gap-2 justify-end mt-2">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleApply}>
                    Apply
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <GradientColorPicker
              value={pendingValue}
              onChange={handleGradientChange}
              onApply={handleApply}
              onCancel={handleCancel}
              showApplyCancel={showApplyCancel}
            />
          )}
        </div>
      )}
    </div>
  )
}
