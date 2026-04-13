'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { FormRow, FormSection } from '../components/FormRow'
import { MousePointer2, Layout as LayoutIcon, Palette, Type, Box, Square } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

interface StartScreenPromptsSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function StartScreenPromptsSection({ formData, setFormData }: StartScreenPromptsSectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Advanced styling and layout options for the quick starter prompts shown on the splash screen.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="layout">
        <AccordionSectionGroup id="layout" title="Prompt Layout" icon={LayoutIcon} defaultOpen>
          <FormSection>
            <FormRow label="Style Type" description="Button display style">
              <Select
                value={(formData as any).startScreenPromptsStyle || 'card'}
                onValueChange={(value: string) => setFormData({ ...formData, startScreenPromptsStyle: value as 'list' | 'card' } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Grid Cards</SelectItem>
                  <SelectItem value="list">Vertical List</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Grid Position" description="Vertical alignment">
              <Select
                value={(formData as any).startScreenPromptsPosition || 'center'}
                onValueChange={(value: string) => setFormData({ ...formData, startScreenPromptsPosition: value as 'center' | 'bottom' | 'list' } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center Centered</SelectItem>
                  <SelectItem value="bottom">Bottom Stacked</SelectItem>
                  <SelectItem value="list">Natural Flow</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Icon Mode" description="Visibility of prompt icons">
              <Select
                value={(formData as any).startScreenPromptsIconDisplay || 'suffix'}
                onValueChange={(value: string) => setFormData({ ...formData, startScreenPromptsIconDisplay: value as 'suffix' | 'show-all' | 'none' } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suffix">Suffix Only</SelectItem>
                  <SelectItem value="show-all">Full Icons</SelectItem>
                  <SelectItem value="none">Hide Icons</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="colors" title="Design & Colors" icon={Palette}>
          <FormSection>
            <FormRow label="Background" description="Prompt button background">
              <ColorInput
                value={(formData as any).startScreenPromptsBackgroundColor || '#f3f4f6'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsBackgroundColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#f3f4f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Text color inside buttons">
              <ColorInput
                value={(formData as any).startScreenPromptsFontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsFontColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="typography" title="Typography" icon={Type}>
          <FormSection>
            <FormRow label="Font Family" description="Font for button labels">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsFontFamily || 'Inter'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsFontFamily: e.target.value } as any)}
                placeholder="Inter"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Font Size" description="Text scale">
              <div className="relative">
                <Input
                    type="text"
                    value={(formData as any).startScreenPromptsFontSize || '14px'}
                    onChange={(e) => setFormData({ ...formData, startScreenPromptsFontSize: e.target.value } as any)}
                    placeholder="14px"
                    className="h-8 text-xs pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders & Spacing" icon={Square}>
          <FormSection>
            <FormRow label="Padding" description="Internal button spacing">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsPadding || '12px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsPadding: e.target.value } as any)}
                placeholder="12px"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Border Color" description="Outline color">
              <ColorInput
                value={(formData as any).startScreenPromptsBorderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsBorderColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Outline thickness">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsBorderWidth || '1px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsBorderWidth: e.target.value } as any)}
                placeholder="1px"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Corner Radius" description="Button roundness">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsBorderRadius || '8px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsBorderRadius: e.target.value } as any)}
                placeholder="8px"
                className="h-8 text-xs"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
