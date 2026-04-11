'use client'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { SectionProps } from './types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { FormRow, FormSection } from '../components/FormRow'

export function SendButtonSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="sendButton" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Send Button
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Configure the appearance of the send button in the chat composer.
        </p>
        <FormSection>
          <FormRow label="Background Color" description="Button background color">
            <ColorInput
              value={(formData as any).sendButtonBgColor || formData.primaryColor || '#1e40af'}
              onChange={(color) => setFormData({ ...formData, sendButtonBgColor: color } as any)}
              allowImageVideo={false}
              className="relative"
              placeholder="#1e40af"
              inputClassName="h-8 text-xs pl-7"
            />
          </FormRow>
          <FormRow label="Icon Color" description="Send icon color">
            <ColorInput
              value={(formData as any).sendButtonIconColor || '#ffffff'}
              onChange={(color) => setFormData({ ...formData, sendButtonIconColor: color } as any)}
              allowImageVideo={false}
              className="relative"
              placeholder="#ffffff"
              inputClassName="h-8 text-xs pl-7"
            />
          </FormRow>
          <FormRow label="Rounded Button" description="Use rounded button style">
            <Switch
              checked={(formData as any).sendButtonRounded || false}
              onCheckedChange={(checked) => setFormData({ ...formData, sendButtonRounded: checked } as any)}
            />
          </FormRow>
          <FormRow label="Padding X" description="Horizontal padding">
            <div className="relative">
              <Input
                type="number"
                value={extractNumericValue((formData as any).sendButtonPaddingX || '8px')}
                onChange={(e) => setFormData({ ...formData, sendButtonPaddingX: ensurePx(e.target.value) } as any)}
                placeholder="8"
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
            </div>
          </FormRow>
          <FormRow label="Padding Y" description="Vertical padding">
            <div className="relative">
              <Input
                type="number"
                value={extractNumericValue((formData as any).sendButtonPaddingY || '8px')}
                onChange={(e) => setFormData({ ...formData, sendButtonPaddingY: ensurePx(e.target.value) } as any)}
                placeholder="8"
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
            </div>
          </FormRow>
        </FormSection>
      </AccordionContent>
    </AccordionItem>
  )
}

