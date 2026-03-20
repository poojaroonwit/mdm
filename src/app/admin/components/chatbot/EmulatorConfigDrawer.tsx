'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Label } from '@/components/ui/label'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import toast from 'react-hot-toast'

interface EmulatorConfig {
  backgroundColor?: string
  backgroundImage?: string
  text?: string
  description?: string
  [key: string]: any
}

interface EmulatorConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: EmulatorConfig
  onConfigChange: (config: EmulatorConfig) => void
}

export function EmulatorConfigDrawer({
  open,
  onOpenChange,
  config,
  onConfigChange
}: EmulatorConfigDrawerProps) {
  const [localConfig, setLocalConfig] = useState<EmulatorConfig>(config)

  // Sync local config with prop config when drawer opens
  useEffect(() => {
    if (open) {
      setLocalConfig(config)
    }
  }, [open, config])

  const handleChange = (key: string, value: any) => {
    // Only update local state, don't propagate changes immediately
    setLocalConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // Apply changes and close drawer
    onConfigChange(localConfig)
    toast.success('Configuration saved')
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Reset to original config and close drawer
    setLocalConfig(config)
    onOpenChange(false)
  }

  // Handle background change - supports color, gradient, image URL, or uploaded file
  const handleBackgroundChange = (value: string) => {
    // Check if it's an image/video URL or uploaded file path
    const isImageUrl = value.startsWith('http://') || 
                       value.startsWith('https://') || 
                       value.startsWith('/') || 
                       value.startsWith('data:') ||
                       value.startsWith('blob:')
    
    if (isImageUrl) {
      handleChange('backgroundImage', value)
      handleChange('backgroundColor', '') // Clear color when image is set
    } else {
      // It's a color or gradient
      handleChange('backgroundColor', value)
      handleChange('backgroundImage', '') // Clear image when color is set
    }
  }

  // Get current background value (image takes precedence over color)
  const currentBackgroundValue = localConfig.backgroundImage || localConfig.backgroundColor || '#ffffff'

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Emulator Configuration"
      description="Configure the emulator page background (applies to all preview modes)"
      width="w-[480px]"
      floating={true}
    >
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Background Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Page Background</h4>
          <p className="text-xs text-muted-foreground">
            Set a color, image, or video as the page background. This simulates the host website background behind the chat widget.
          </p>

          <div className="space-y-2">
            <Label>Background (Color / Image / Video)</Label>
            <ColorInput
              value={currentBackgroundValue}
              onChange={handleBackgroundChange}
              allowImageVideo={true}
              className="relative"
              placeholder="#ffffff or image URL"
              inputClassName="h-10 text-xs pl-7 w-full"
            />
          </div>
        </div>
      </div>

      {/* Footer with Save/Cancel buttons */}
      <div className="border-t border-border/50 p-4 flex justify-end gap-2 bg-background sticky bottom-0">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </CentralizedDrawer>
  )
}

