'use client'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { SectionProps } from './types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { FormRow, FormSection } from '../components/FormRow'
import { Send } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function SendButtonSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the appearance and sizing of the chat message send button.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="send-button">
        <AccordionSectionGroup id="send-button" title="Send Button" icon={Send} defaultOpen>
          <FormSection>
            <FormRow label="Background" description="Button background color">
              <ColorInput
                value={(formData as any).sendButtonBgColor || formData.primaryColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, sendButtonBgColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Icon Color" description="Send icon color">
              <ColorInput
                value={(formData as any).sendButtonIconColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, sendButtonIconColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Rounded" description="Use circular button style">
              <Switch
                checked={(formData as any).sendButtonRounded || false}
                onCheckedChange={(checked) => setFormData({ ...formData, sendButtonRounded: checked } as any)}
              />
            </FormRow>
            <FormRow label="Padding X" description="Horizontal internal spacing">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).sendButtonPaddingX || '8px')}
                  onChange={(e) => setFormData({ ...formData, sendButtonPaddingX: ensurePx(e.target.value) } as any)}
                  placeholder="8"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Padding Y" description="Vertical internal spacing">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).sendButtonPaddingY || '8px')}
                  onChange={(e) => setFormData({ ...formData, sendButtonPaddingY: ensurePx(e.target.value) } as any)}
                  placeholder="8"
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
