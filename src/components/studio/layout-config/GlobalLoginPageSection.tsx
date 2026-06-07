import { LogIn, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator as SeparatorComponent } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { LoginPageConfig, SpacesEditorPage } from '@/lib/space-studio-manager'

import { ColorInput } from './ColorInput'

interface GlobalLoginPageSectionProps {
  currentLoginConfig: LoginPageConfig
  postAuthRedirectPageId: string
  availablePages: SpacesEditorPage[]
  isMobileViewport: boolean
  isSavingLoginConfig: boolean
  setLoginPageConfig: (config: LoginPageConfig) => void
  setPostAuthRedirectPageId: (pageId: string) => void
  onSaveLoginConfig: () => void
}

export function GlobalLoginPageSection({
  currentLoginConfig,
  postAuthRedirectPageId,
  availablePages,
  isMobileViewport,
  isSavingLoginConfig,
  setLoginPageConfig,
  setPostAuthRedirectPageId,
  onSaveLoginConfig
}: GlobalLoginPageSectionProps) {
  const compactInputClass = `${isMobileViewport ? 'h-10' : 'h-8'} text-xs w-32`
  const colorInputClass = isMobileViewport ? 'h-10 pl-7' : 'h-8 text-xs pl-7'

  const updateLoginConfig = (updates: Partial<LoginPageConfig>) => {
    setLoginPageConfig({ ...currentLoginConfig, ...updates } as LoginPageConfig)
  }

  const updateCardStyle = (updates: Partial<NonNullable<LoginPageConfig['cardStyle']>>) => {
    updateLoginConfig({
      cardStyle: {
        ...currentLoginConfig.cardStyle,
        ...updates
      }
    })
  }

  const updateGradient = (updates: Partial<NonNullable<LoginPageConfig['gradient']>>) => {
    updateLoginConfig({
      gradient: {
        from: currentLoginConfig.gradient?.from || '#1e40af',
        to: currentLoginConfig.gradient?.to || '#1e40af',
        angle: currentLoginConfig.gradient?.angle || 135,
        ...updates
      }
    })
  }

  return (
    <>
      <SeparatorComponent className="my-4" />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          <h3 className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold`}>Login Page Configuration</h3>
        </div>

        <TextSetting
          label="Login Title"
          value={currentLoginConfig.title || 'Sign in'}
          placeholder="Sign in"
          className={compactInputClass}
          onChange={(title) => updateLoginConfig({ title })}
        />
        <TextSetting
          label="Description"
          value={currentLoginConfig.description || 'Access this workspace'}
          placeholder="Access this workspace"
          className={compactInputClass}
          onChange={(description) => updateLoginConfig({ description })}
        />

        <div className="flex items-center justify-between">
          <Label className={isMobileViewport ? 'text-sm' : 'text-xs'}>Background Type</Label>
          <Select
            value={currentLoginConfig.backgroundType || 'gradient'}
            onValueChange={(backgroundType: string) => updateLoginConfig({ backgroundType: backgroundType as 'color' | 'image' | 'gradient' })}
          >
            <SelectTrigger className={`${isMobileViewport ? 'h-10' : 'h-8'} w-32`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="color">Solid Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentLoginConfig.backgroundType === 'color' && (
          <ColorSetting
            label="Background Color"
            value={currentLoginConfig.backgroundColor || '#1e40af'}
            placeholder="#1e40af"
            inputClassName={colorInputClass}
            isMobileViewport={isMobileViewport}
            onChange={(backgroundColor) => updateLoginConfig({ backgroundColor })}
          />
        )}

        {currentLoginConfig.backgroundType === 'gradient' && (
          <>
            <ColorSetting
              label="Gradient From"
              value={currentLoginConfig.gradient?.from || '#1e40af'}
              placeholder="#1e40af"
              inputClassName={colorInputClass}
              isMobileViewport={isMobileViewport}
              onChange={(from) => updateGradient({ from })}
            />
            <ColorSetting
              label="Gradient To"
              value={currentLoginConfig.gradient?.to || '#1e40af'}
              placeholder="#1e40af"
              inputClassName={colorInputClass}
              isMobileViewport={isMobileViewport}
              onChange={(to) => updateGradient({ to })}
            />
            <TextSetting
              label="Gradient Angle"
              type="number"
              value={currentLoginConfig.gradient?.angle || 135}
              placeholder="135"
              className={compactInputClass}
              onChange={(angle) => updateGradient({ angle: parseInt(angle) || 135 })}
            />
          </>
        )}

        {currentLoginConfig.backgroundType === 'image' && (
          <TextSetting
            label="Background Image URL"
            value={currentLoginConfig.backgroundImage || ''}
            placeholder="https://example.com/image.jpg"
            className={compactInputClass}
            onChange={(backgroundImage) => updateLoginConfig({ backgroundImage })}
          />
        )}

        <TextSetting
          label="Left Panel Width"
          value={currentLoginConfig.leftPanelWidth || '70%'}
          placeholder="70%"
          className={compactInputClass}
          onChange={(leftPanelWidth) => updateLoginConfig({ leftPanelWidth })}
        />
        <TextSetting
          label="Right Panel Width"
          value={currentLoginConfig.rightPanelWidth || '30%'}
          placeholder="30%"
          className={compactInputClass}
          onChange={(rightPanelWidth) => updateLoginConfig({ rightPanelWidth })}
        />

        <div className="space-y-2 border-t pt-2">
          <Label className={isMobileViewport ? 'text-sm' : 'text-xs'}>Card Style</Label>
          <ColorSetting
            label="Card Background"
            value={currentLoginConfig.cardStyle?.backgroundColor || '#ffffff'}
            placeholder="#ffffff"
            inputClassName={colorInputClass}
            isMobileViewport={isMobileViewport}
            labelClassName={isMobileViewport ? 'text-xs' : 'text-[10px]'}
            onChange={(backgroundColor) => updateCardStyle({ backgroundColor })}
          />
          <ColorSetting
            label="Card Text"
            value={currentLoginConfig.cardStyle?.textColor || '#1f2937'}
            placeholder="#1f2937"
            inputClassName={colorInputClass}
            isMobileViewport={isMobileViewport}
            labelClassName={isMobileViewport ? 'text-xs' : 'text-[10px]'}
            onChange={(textColor) => updateCardStyle({ textColor })}
          />
          <TextSetting
            label="Border Radius"
            type="number"
            value={currentLoginConfig.cardStyle?.borderRadius || 8}
            placeholder="8"
            className={compactInputClass}
            labelClassName={isMobileViewport ? 'text-xs' : 'text-[10px]'}
            onChange={(borderRadius) => updateCardStyle({ borderRadius: parseInt(borderRadius) || 8 })}
          />
          <div className="flex items-center justify-between">
            <Label htmlFor="card-shadow" className={isMobileViewport ? 'text-xs' : 'text-[10px]'}>Enable Shadow</Label>
            <Switch
              id="card-shadow"
              checked={currentLoginConfig.cardStyle?.shadow !== false}
              onCheckedChange={(shadow) => updateCardStyle({ shadow })}
            />
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="flex items-center justify-between">
            <Label className={isMobileViewport ? 'text-sm' : 'text-xs'}>Post-Authentication Redirect Page</Label>
            <Select value={postAuthRedirectPageId || ''} onValueChange={setPostAuthRedirectPageId}>
              <SelectTrigger className={`${isMobileViewport ? 'h-10' : 'h-8'} w-32`}>
                <SelectValue placeholder="Select page (default: first page)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Use First Page (Default)</SelectItem>
                {availablePages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.displayName || page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} mt-1 text-muted-foreground`}>
            Select which page users should be redirected to after successful login
          </p>
        </div>

        <Button
          onClick={onSaveLoginConfig}
          disabled={isSavingLoginConfig}
          className="w-full"
          size={isMobileViewport ? 'default' : 'sm'}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSavingLoginConfig ? 'Saving...' : 'Save Login Page Configuration'}
        </Button>
      </div>
    </>
  )
}

function TextSetting({
  label,
  value,
  placeholder,
  className,
  labelClassName,
  type = 'text',
  onChange
}: {
  label: string
  value: string | number
  placeholder: string
  className: string
  labelClassName?: string
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className={labelClassName || 'text-xs'}>{label}</Label>
      <Input
        type={type}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function ColorSetting({
  label,
  value,
  placeholder,
  inputClassName,
  labelClassName,
  isMobileViewport,
  onChange
}: {
  label: string
  value: string
  placeholder: string
  inputClassName: string
  labelClassName?: string
  isMobileViewport: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className={labelClassName || (isMobileViewport ? 'text-sm' : 'text-xs')}>{label}</Label>
      <ColorInput
        value={value}
        onChange={onChange}
        allowImageVideo={false}
        className="relative w-32"
        placeholder={placeholder}
        inputClassName={inputClassName}
      />
    </div>
  )
}
