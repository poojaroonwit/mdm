'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Move, Maximize, Layers, Sun, Square, Palette } from 'lucide-react'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { MultiSideInput } from '../components/MultiSideInput'
import type { SectionProps } from './types'

function boundedPercent(value: string, fallback: number) {
  if (value.trim() === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, parsed))
}

export function PopoverSection({ formData, setFormData }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the visual container and positioning for the chat popover window.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="position">
        <AccordionSectionGroup id="position" title="Position & Alignment" icon={Move} defaultOpen>
          <FormSection>
            <FormRow label="Relative Position" description="Placement compared to button">
              <Select
                value={formData.popoverPosition || 'left'}
                onValueChange={(v: any) => setFormData({ ...formData, popoverPosition: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left of Button</SelectItem>
                  <SelectItem value="top">Top of Button</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Primary Margin" description="Spacing from widget button">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMargin || '10px')}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                  placeholder="10"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="dimensions" title="Window Dimensions" icon={Maximize}>
          <FormSection>
            <FormRow label="Window Width" description="Width of the chat interface">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowWidth || '380px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowWidth: ensurePx(e.target.value) })}
                  placeholder="380"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Window Height" description="Height of the chat interface">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowHeight || '600px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowHeight: ensurePx(e.target.value) })}
                  placeholder="600"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="surface" title="Surface & Glass" icon={Palette}>
          <FormSection>
            <FormRow label="Background" description="Window color or image">
              <ColorInput
                value={formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, messageBoxColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Background Opacity" description="Transparency of the popover surface">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={(formData as any).chatWindowBackgroundOpacity ?? 100}
                  onChange={(e) => setFormData({
                    ...formData,
                    chatWindowBackgroundOpacity: boundedPercent(e.target.value, 100),
                  } as any)}
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
              </div>
            </FormRow>
            <FormRow label="Backdrop Blur" description="Glassmorphism blur behind the window">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={(formData as any).chatWindowBackgroundBlur ?? 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    chatWindowBackgroundBlur: boundedPercent(e.target.value, 0),
                  } as any)}
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="border-radius" title="Borders & Corners" icon={Square}>
          <FormSection>
            <FormRow label="Frame Color" description="Border outline color">
              <ColorInput
                value={formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, chatWindowBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Set all sides or adjust individually">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="chatWindowBorderWidth"
                defaultValue={formData.borderWidth || '1px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Corner Radius" description="Set all corners or adjust individually">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="chatWindowBorderRadius"
                defaultValue={formData.borderRadius || '12px'}
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="spacing" title="Inner Spacing" icon={Move}>
          <FormSection>
            <FormRow label="Horizontal Padding" description="Left and right inner spacing">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).chatWindowPaddingX || '0px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowPaddingX: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Vertical Padding" description="Top and bottom inner spacing">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).chatWindowPaddingY || '0px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowPaddingY: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="depth" title="Shadow & Depth" icon={Sun}>
          <FormSection>
            <FormRow label="Shadow Color" description="Window elevation color">
              <ColorInput
                value={formData.chatWindowShadowColor || formData.shadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, chatWindowShadowColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Shadow X" description="Horizontal shadow offset">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).chatWindowShadowX || '0px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowX: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Y" description="Vertical shadow offset">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).chatWindowShadowY || '0px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowY: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Blur" description="Shadow softness">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  value={extractNumericValue(formData.chatWindowShadowBlur || formData.shadowBlur || '4px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowBlur: ensurePx(e.target.value) })}
                  placeholder="4"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Spread" description="Expand or contract the shadow">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).chatWindowShadowSpread || '0px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowSpread: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="overlay" title="Page Overlay" icon={Layers}>
          <FormSection>
            <FormRow label="Enable Overlay" description="Dim the page while the popover is open">
              <Switch
                checked={(formData as any).overlayEnabled ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, overlayEnabled: checked } as any)}
              />
            </FormRow>
            {(formData as any).overlayEnabled && (
              <>
                <FormRow label="Overlay Color" description="Color behind the open popover">
                  <ColorInput
                    value={(formData as any).overlayColor || '#000000'}
                    onChange={(color) => setFormData({ ...formData, overlayColor: color } as any)}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#000000"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Overlay Opacity" description="Strength of the page dimming">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={(formData as any).overlayOpacity ?? 50}
                      onChange={(e) => setFormData({
                        ...formData,
                        overlayOpacity: boundedPercent(e.target.value, 50),
                      } as any)}
                      className="pr-8 h-8 text-xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                </FormRow>
                <FormRow label="Overlay Blur" description="Blur the page behind the popover">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={(formData as any).overlayBlur ?? 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        overlayBlur: boundedPercent(e.target.value, 0),
                      } as any)}
                      className="pr-8 h-8 text-xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                  </div>
                </FormRow>
              </>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
