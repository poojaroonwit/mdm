'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Move, Maximize, Layers, Sun, Square, Palette, Settings } from 'lucide-react'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function PopoverSection({ formData, setFormData, chatkitOptions }: SectionProps) {
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
            <FormRow label="Max Height" description="Height of the chat interface">
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

        <AccordionSectionGroup id="border-radius" title="Borders & Corners" icon={Square}>
          <FormSection>
            <FormRow label="Border Width" description="Frame thickness">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowBorderWidth || formData.borderWidth || '1px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowBorderWidth: ensurePx(e.target.value) })}
                  placeholder="1"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Corner Radius" description="Window roundness">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowBorderRadius || formData.borderRadius || '12px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowBorderRadius: ensurePx(e.target.value) })}
                  placeholder="12"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
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
            <FormRow label="Shadow Blur" description="Shadow softness">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowShadowBlur || formData.shadowBlur || '4px')}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowBlur: ensurePx(e.target.value) })}
                  placeholder="4"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
