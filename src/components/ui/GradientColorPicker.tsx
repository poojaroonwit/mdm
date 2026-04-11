'use client'

import React, { useState, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Plus, X, RotateCw } from 'lucide-react'

interface ColorStop {
  id: string
  color: string
  position: number
}

interface GradientColorPickerProps {
  value?: string
  onChange: (value: string) => void
  onApply?: () => void
  onCancel?: () => void
  showApplyCancel?: boolean
  className?: string
}

export function GradientColorPicker({
  value = 'linear-gradient(90deg, #ff0000 0%, #00ff00 100%)',
  onChange,
  onApply,
  onCancel,
  showApplyCancel = true,
  className = ''
}: GradientColorPickerProps) {
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')
  const [angle, setAngle] = useState(90)
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: '1', color: '#ff0000', position: 0 },
    { id: '2', color: '#00ff00', position: 100 }
  ])
  const [selectedStopId, setSelectedStopId] = useState<string>('1')
  const [pendingValue, setPendingValue] = useState(value)

  // Parse existing gradient value
  React.useEffect(() => {
    if (value && value.includes('gradient')) {
      try {
        // Parse linear gradient
        if (value.includes('linear-gradient')) {
          setGradientType('linear')
          const angleMatch = value.match(/linear-gradient\((\d+)deg/)
          if (angleMatch) {
            setAngle(parseInt(angleMatch[1]))
          }
          
          // Parse color stops
          const colorMatches = value.match(/#[a-fA-F0-9]{6}\s+\d+%/g)
          if (colorMatches && colorMatches.length >= 2) {
            const stops = colorMatches.map((match, index) => {
              const [color, position] = match.split(' ')
              return {
                id: (index + 1).toString(),
                color: color,
                position: parseInt(position.replace('%', ''))
              }
            })
            setColorStops(stops)
            if (stops.length > 0) {
              setSelectedStopId(stops[0].id)
            }
          }
        }
        // Parse radial gradient
        else if (value.includes('radial-gradient')) {
          setGradientType('radial')
          // For radial gradients, we'll use a default angle
          setAngle(0)
          
          const colorMatches = value.match(/#[a-fA-F0-9]{6}\s+\d+%/g)
          if (colorMatches && colorMatches.length >= 2) {
            const stops = colorMatches.map((match, index) => {
              const [color, position] = match.split(' ')
              return {
                id: (index + 1).toString(),
                color: color,
                position: parseInt(position.replace('%', ''))
              }
            })
            setColorStops(stops)
            if (stops.length > 0) {
              setSelectedStopId(stops[0].id)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse gradient:', error)
      }
    }
  }, [value])

  // Generate gradient string
  const generateGradient = useCallback((stops: ColorStop[], type: 'linear' | 'radial', gradAngle: number) => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position)
    const stopString = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')
    
    if (type === 'linear') {
      return `linear-gradient(${gradAngle}deg, ${stopString})`
    } else {
      return `radial-gradient(circle, ${stopString})`
    }
  }, [])

  // Update pending value when stops or settings change
  React.useEffect(() => {
    const newGradient = generateGradient(colorStops, gradientType, angle)
    setPendingValue(newGradient)
  }, [colorStops, gradientType, angle, generateGradient])

  const handleColorChange = useCallback((color: string) => {
    setColorStops(prev => prev.map(stop => 
      stop.id === selectedStopId ? { ...stop, color } : stop
    ))
  }, [selectedStopId])

  const handlePositionChange = useCallback((stopId: string, position: number) => {
    setColorStops(prev => prev.map(stop => 
      stop.id === stopId ? { ...stop, position: Math.max(0, Math.min(100, position)) } : stop
    ))
  }, [])

  const addColorStop = useCallback(() => {
    if (colorStops.length < 3) {
      const newId = (colorStops.length + 1).toString()
      const newStop: ColorStop = {
        id: newId,
        color: '#0000ff',
        position: 50
      }
      setColorStops(prev => [...prev, newStop])
      setSelectedStopId(newId)
    }
  }, [colorStops.length])

  const removeColorStop = useCallback((stopId: string) => {
    if (colorStops.length > 2) {
      setColorStops(prev => prev.filter(stop => stop.id !== stopId))
      if (selectedStopId === stopId) {
        setSelectedStopId(colorStops[0]?.id || '1')
      }
    }
  }, [colorStops.length, selectedStopId, colorStops])

  const handleApply = useCallback(() => {
    onChange(pendingValue)
    onApply?.()
  }, [pendingValue, onChange, onApply])

  const handleCancel = useCallback(() => {
    setPendingValue(value)
    onCancel?.()
  }, [value, onCancel])

  const selectedStop = colorStops.find(stop => stop.id === selectedStopId)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Gradient Type */}
      <div>
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">Gradient Type</Label>
        <div className="flex gap-2">
          <Button
            variant={gradientType === 'linear' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGradientType('linear')}
            className="text-xs"
          >
            Linear
          </Button>
          <Button
            variant={gradientType === 'radial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGradientType('radial')}
            className="text-xs"
          >
            Radial
          </Button>
        </div>
      </div>

      {/* Angle (for linear gradients) */}
      {gradientType === 'linear' && (
        <div>
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">Angle</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
              className="h-8 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAngle(prev => (prev + 45) % 360)}
              className="h-8 w-8 p-0"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Color Stops */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Color Stops</Label>
          {colorStops.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addColorStop}
              className="h-6 w-6 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {colorStops.map((stop) => (
            <div key={stop.id} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 border rounded-lg cursor-pointer shadow-lg transition-all duration-200 ${
                  selectedStopId === stop.id ? 'ring-2 ring-zinc-400 dark:ring-zinc-500 border-transparent' : 'border-zinc-100/60 dark:border-zinc-800/60'
                }`}
                style={{ backgroundColor: stop.color }}
                onClick={() => setSelectedStopId(stop.id)}
              />
              <Input
                type="number"
                min="0"
                max="100"
                value={stop.position}
                onChange={(e) => handlePositionChange(stop.id, parseInt(e.target.value) || 0)}
                className="h-6 w-16 text-xs"
              />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black">%</span>
              {colorStops.length > 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeColorStop(stop.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      {selectedStop && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 block">
            Stop: {selectedStop.position}%
          </Label>
          <HexColorPicker
            color={selectedStop.color}
            onChange={handleColorChange}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Preview */}
      <div className="pt-2">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">Preview</Label>
        <div
          className="w-full h-12 border border-zinc-100/60 dark:border-zinc-800/60 rounded-md shadow-inner-sm"
          style={{ background: pendingValue }}
        />
      </div>

      {/* Apply/Cancel */}
      {showApplyCancel && (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}
