'use client'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Layout, MousePointerClick, Palette, Square, X, Plus, Info } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function ChatKitHeaderSection({ formData, setFormData }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Customize the chat window header, including branding, action buttons, and visual styles.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="content">
        <AccordionSectionGroup id="content" title="Brand & Content" icon={Layout} defaultOpen>
          <FormSection>
            <FormRow label="Show Title" description="Display the chatbot name in the header">
              <Switch
                checked={(formData as any).headerShowTitle !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowTitle: checked } as any)}
              />
            </FormRow>
            {(formData as any).headerShowTitle !== false && (
              <FormRow label="Title Text" description="">
                <Input
                  value={formData.headerTitle || ''}
                  onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value } as any)}
                  placeholder="Chatbot Name"
                  className="h-8 text-xs"
                />
              </FormRow>
            )}
            <FormRow label="Tagline" description="Secondary description text">
              <Input
                value={formData.headerDescription || ''}
                onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                placeholder="A helpful assistant..."
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Branding Image" description="Logo displayed at the top">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.headerLogo || ''}
                    onChange={(e) => setFormData({ ...formData, headerLogo: e.target.value })}
                    placeholder="https://..."
                    className="h-8 text-xs"
                  />
                  <Switch
                    checked={(formData as any).headerShowLogo !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, headerShowLogo: checked } as any)}
                  />
                </div>
                {formData.headerLogo && (
                  <img src={formData.headerLogo} className="h-8 w-8 object-contain border rounded bg-white shadow-sm" />
                )}
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="actions" title="Action Buttons" icon={MousePointerClick}>
          <FormSection>
            <FormRow label="Clear Session" description="Allow users to reset the conversation">
              <Switch
                checked={(formData as any).headerShowClearSession !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowClearSession: checked } as any)}
              />
            </FormRow>
            <FormRow label="Start Menu" description="Show opening conversation menu">
              <Switch
                checked={formData.showStartConversation !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, showStartConversation: checked })}
              />
            </FormRow>
            <FormRow label="Renaming" description="Allow users to edit thread names">
              <Switch
                checked={(formData as any).enableConversationRenaming !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, enableConversationRenaming: checked } as any)}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="styling" title="Visual Style" icon={Palette}>
          <FormSection>
            <FormRow label="Background" description="Header bar color">
              <ColorInput
                value={formData.headerBgColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Text/Icons" description="Foreground content color">
              <ColorInput
                value={formData.headerFontColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, headerFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="border" title="Borders" icon={Square}>
          <FormSection>
            <FormRow label="Enable Border" description="Show bottom separator line">
              <Switch
                checked={(formData as any).headerBorderEnabled !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerBorderEnabled: checked } as any)}
              />
            </FormRow>
            {(formData as any).headerBorderEnabled !== false && (
              <FormRow label="Border Color" description="">
                <ColorInput
                  value={(formData as any).headerBorderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, headerBorderColor: color } as any)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
