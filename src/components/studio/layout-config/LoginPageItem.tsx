'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { LogIn, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, LoginPageConfig } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'
import { ColorInput } from './ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'

interface LoginPageItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  spaceId: string
  selectedPageId: string | null
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>
}

export function LoginPageItem({
  page,
  index,
  isMobileViewport,
  spaceId,
  selectedPageId,
  setSelectedPageId,
}: LoginPageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loginPageConfig, setLoginPageConfig] = useState<LoginPageConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
        if (config?.loginPageConfig) {
          setLoginPageConfig(config.loginPageConfig)
        } else {
          setLoginPageConfig({
            backgroundType: 'gradient',
            backgroundColor: '#1e40af',
            gradient: {
              from: '#1e40af',
              to: '#1e40af',
              angle: 135
            },
            leftPanelWidth: '70%',
            rightPanelWidth: '30%',
            cardStyle: {
              backgroundColor: '#ffffff',
              textColor: '#1f2937',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              shadow: true
            },
            title: 'Sign in',
            description: 'Access this workspace',
            showLogo: false
          })
        }
      } catch (err) {
        console.error('Failed to load login page config:', err)
      }
    }
    loadConfig()
  }, [spaceId])

  const handleSave = async () => {
    if (!loginPageConfig) return
    setIsSaving(true)
    try {
      const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId) || await SpacesEditorManager.createDefaultConfig(spaceId)
      const updatedConfig = {
        ...config,
        loginPageConfig,
        updatedAt: new Date().toISOString()
      }
      await SpacesEditorManager.saveSpacesEditorConfig(updatedConfig)
      toast.success('Login page configuration saved')
    } catch (err) {
      toast.error('Failed to save login page configuration')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const currentConfig = loginPageConfig || {
    backgroundType: 'gradient' as const,
    backgroundColor: '#1e40af',
    gradient: { from: '#1e40af', to: '#1e40af', angle: 135 },
    leftPanelWidth: '70%',
    rightPanelWidth: '30%',
    cardStyle: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      borderRadius: 8,
      shadow: true
    },
    title: 'Sign in',
    description: 'Access this workspace',
    showLogo: false
  }

  const isSelected = selectedPageId === page.id

  return (
    <div
      className={`rounded-[10px] border border-border ${
        isSelected ? 'ring-2 ring-border' : ''
      } bg-muted hover:bg-muted/80 select-none`}
    >
      <div className={`flex items-center justify-between gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LogIn className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
          <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-foreground pointer-events-none`}>
            {page.name || 'Login Page'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
            setSelectedPageId(page.id)
          }}
          className={`flex items-center justify-center ${isMobileViewport ? 'h-6 w-6' : 'h-5 w-5'} rounded hover:bg-muted transition-colors`}
          title={isExpanded ? 'Collapse' : 'Expand settings'}
        >
          {isExpanded ? (
            <ChevronUp className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
          ) : (
            <ChevronDown className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
          )}
        </button>
      </div>

      {/* Expanded Settings Section */}
      {isExpanded && loginPageConfig && (
        <div className={`border-t border-border ${isMobileViewport ? 'p-3' : 'p-2'} space-y-3 bg-background/50`}>
          {/* Title */}
          <div className="space-y-2">
            <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Login Title</Label>
            <Input
              type="text"
              className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
              value={currentConfig.title || 'Sign in'}
              onChange={(e) => setLoginPageConfig({ ...currentConfig, title: e.target.value })}
              placeholder="Sign in"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Description</Label>
            <Input
              type="text"
              className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
              value={currentConfig.description || 'Access this workspace'}
              onChange={(e) => setLoginPageConfig({ ...currentConfig, description: e.target.value })}
              placeholder="Access this workspace"
            />
          </div>

          {/* Background Type */}
          <div className="space-y-2">
            <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Background Type</Label>
            <Select
              value={currentConfig.backgroundType || 'gradient'}
              onValueChange={(value: string) => {
                setLoginPageConfig({ ...currentConfig, backgroundType: value as 'color' | 'image' | 'gradient' })
              }}
            >
              <SelectTrigger className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Color (for color type) */}
          {currentConfig.backgroundType === 'color' && (
            <div className="space-y-2">
              <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Background Color</Label>
              <ColorInput
                value={currentConfig.backgroundColor || '#1e40af'}
                onChange={(color) => setLoginPageConfig({ ...currentConfig, backgroundColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs pl-7`}
              />
            </div>
          )}

          {/* Gradient Settings */}
          {currentConfig.backgroundType === 'gradient' && (
            <>
              <div className="space-y-2">
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Gradient From</Label>
                <ColorInput
                  value={currentConfig.gradient?.from || '#1e40af'}
                  onChange={(color) => setLoginPageConfig({
                    ...currentConfig,
                    gradient: { ...currentConfig.gradient!, from: color }
                  })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#1e40af"
                  inputClassName={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs pl-7`}
                />
              </div>
              <div className="space-y-2">
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Gradient To</Label>
                <div className="flex items-center gap-2">
                  <ColorInput
                    value={currentConfig.gradient?.to || '#1e40af'}
                    onChange={(color) => setLoginPageConfig({
                      ...currentConfig,
                      gradient: { ...currentConfig.gradient!, to: color }
                    })}
                    allowImageVideo={false}
                    className="relative flex-1"
                    placeholder="#1e40af"
                    inputClassName={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs pl-7`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Gradient Angle</Label>
                <Input
                  type="number"
                  className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
                  value={currentConfig.gradient?.angle || 135}
                  onChange={(e) => setLoginPageConfig({
                    ...currentConfig,
                    gradient: { ...currentConfig.gradient!, angle: parseInt(e.target.value) || 135 }
                  })}
                  min={0}
                  max={360}
                />
              </div>
            </>
          )}

          {/* Background Image */}
          {currentConfig.backgroundType === 'image' && (
            <div className="space-y-2">
              <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Background Image URL</Label>
              <Input
                type="text"
                className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
                value={currentConfig.backgroundImage || ''}
                onChange={(e) => setLoginPageConfig({ ...currentConfig, backgroundImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Panel Widths */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Left Panel Width</Label>
              <Input
                type="text"
                className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
                value={currentConfig.leftPanelWidth || '70%'}
                onChange={(e) => setLoginPageConfig({ ...currentConfig, leftPanelWidth: e.target.value })}
                placeholder="70%"
              />
            </div>
            <div className="space-y-2">
              <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Right Panel Width</Label>
              <Input
                type="text"
                className={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
                value={currentConfig.rightPanelWidth || '30%'}
                onChange={(e) => setLoginPageConfig({ ...currentConfig, rightPanelWidth: e.target.value })}
                placeholder="30%"
              />
            </div>
          </div>

          {/* Card Style */}
          <div className="space-y-2">
            <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Card Background Color</Label>
            <div className="flex items-center gap-2">
              <ColorInput
                value={currentConfig.cardStyle?.backgroundColor || '#ffffff'}
                onChange={(color) => setLoginPageConfig({
                  ...currentConfig,
                  cardStyle: { ...currentConfig.cardStyle!, backgroundColor: color }
                })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs pl-7`}
              />
            </div>
          </div>

          <MultiSideInput
            label="Card Border Radius"
            baseKey="borderRadius"
            type="corners"
            defaultValue={8}
            inputClassName={`${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
            getValue={(side: string) => {
              const br = currentConfig.cardStyle?.borderRadius
              if (typeof br === 'number') return br
              if (typeof br === 'object' && br !== null) {
                const obj = br as any
                const corner = obj[side]
                return corner?.value ?? 8
              }
              return 8
            }}
            setValue={(updates) => {
              const currentBr = currentConfig.cardStyle?.borderRadius
              
              let brObj: any = typeof currentBr === 'number' 
                ? {
                    topLeft: { value: currentBr, unit: 'px' },
                    topRight: { value: currentBr, unit: 'px' },
                    bottomRight: { value: currentBr, unit: 'px' },
                    bottomLeft: { value: currentBr, unit: 'px' }
                  }
                : (currentBr || {
                    topLeft: { value: 8, unit: 'px' },
                    topRight: { value: 8, unit: 'px' },
                    bottomRight: { value: 8, unit: 'px' },
                    bottomLeft: { value: 8, unit: 'px' }
                  })
              
              Object.keys(updates).forEach(key => {
                if (key === 'borderRadius') {
                  const value = updates[key]
                  if (typeof value === 'string' && value.endsWith('px')) {
                    const numValue = parseInt(value.replace('px', '')) || 8
                    brObj = {
                      topLeft: { value: numValue, unit: 'px' },
                      topRight: { value: numValue, unit: 'px' },
                      bottomRight: { value: numValue, unit: 'px' },
                      bottomLeft: { value: numValue, unit: 'px' }
                    }
                  }
                } else if (key.startsWith('borderRadius')) {
                  const corner = key.replace('borderRadius', '').charAt(0).toLowerCase() + key.replace('borderRadius', '').slice(1)
                  const value = updates[key]
                  if (typeof value === 'string' && value.endsWith('px')) {
                    const numValue = parseInt(value.replace('px', '')) || 8
                    brObj[corner] = { value: numValue, unit: 'px' }
                  }
                }
              })
              
              const allSame = brObj.topLeft.value === brObj.topRight.value &&
                             brObj.topRight.value === brObj.bottomRight.value &&
                             brObj.bottomRight.value === brObj.bottomLeft.value &&
                             brObj.topLeft.unit === brObj.topRight.unit &&
                             brObj.topRight.unit === brObj.bottomRight.unit &&
                             brObj.bottomRight.unit === brObj.bottomLeft.unit
              
              setLoginPageConfig({
                ...currentConfig,
                cardStyle: { 
                  ...currentConfig.cardStyle!, 
                  borderRadius: allSame ? brObj.topLeft.value : brObj 
                }
              })
            }}
          />

          <div className="flex items-center justify-between">
            <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>Card Shadow</Label>
            <Switch
              checked={currentConfig.cardStyle?.shadow !== false}
              onCheckedChange={(checked) => setLoginPageConfig({
                ...currentConfig,
                cardStyle: { ...currentConfig.cardStyle!, shadow: checked }
              })}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full ${isMobileViewport ? 'h-10' : 'h-8'} text-xs`}
          >
            <Settings className="mr-2 h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Login Page Config'}
          </Button>
        </div>
      )}
    </div>
  )
}

