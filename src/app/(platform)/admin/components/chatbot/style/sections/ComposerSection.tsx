'use client'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Type, Wrench, MessageSquare, Plus } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function ComposerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const composer = (formData as any).chatkitOptions?.composer || chatkitOptions?.composer || {}
  const tools: any[] = composer.tools || []

  const updateComposer = (updates: Record<string, any>) => {
    const currentOptions = (formData as any).chatkitOptions || chatkitOptions || {}
    const currentComposer = currentOptions.composer || {}
    setFormData({
      ...formData,
      chatkitOptions: {
        ...currentOptions,
        composer: { ...currentComposer, ...updates },
      },
    } as any)
  }

  const updateTool = (toolType: string, enabled: boolean, extraProps?: Record<string, any>) => {
    const currentOptions = (formData as any).chatkitOptions || chatkitOptions || {}
    const currentComposer = currentOptions.composer || {}
    let currentTools: any[] = currentComposer.tools || []

    if (enabled) {
      if (!currentTools.find((t: any) => t.type === toolType)) {
        currentTools = [...currentTools, { type: toolType, ...extraProps }]
      }
    } else {
      currentTools = currentTools.filter((t: any) => t.type !== toolType)
    }

    setFormData({
      ...formData,
      chatkitOptions: {
        ...currentOptions,
        composer: { ...currentComposer, tools: currentTools },
      },
    } as any)
  }

  const isToolEnabled = (toolType: string) => tools.some((t: any) => t.type === toolType)

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Define the appearance and functional capabilities of the message input area.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="interface">
        <AccordionSectionGroup id="interface" title="Input Interface" icon={Type} defaultOpen>
          <FormSection>
            <FormRow label="Placeholder" description="Hints shown in the empty input">
              <Input
                value={composer.placeholder || ''}
                onChange={(e) => updateComposer({ placeholder: e.target.value })}
                placeholder="Type a message..."
                className="h-8 text-xs"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="tools" title="Advanced Tools" icon={Wrench}>
          <FormSection>
            <FormRow label="File Search" description="AI can search uploaded documents">
              <Switch
                checked={isToolEnabled('file_search')}
                onCheckedChange={(checked) => updateTool('file_search', checked)}
              />
            </FormRow>
            <FormRow label="Web Search" description="AI can browse the live web">
              <Switch
                checked={isToolEnabled('web_search')}
                onCheckedChange={(checked) => updateTool('web_search', checked)}
              />
            </FormRow>
            <FormRow label="Code Context" description="Enable code interpretation and execution">
              <Switch
                checked={isToolEnabled('code_interpreter')}
                onCheckedChange={(checked) => updateTool('code_interpreter', checked)}
              />
            </FormRow>
            <FormRow label="Image Generation" description="AI can create visual responses">
              <Switch
                checked={isToolEnabled('image_generation')}
                onCheckedChange={(checked) => updateTool('image_generation', checked)}
              />
            </FormRow>
            <FormRow label="Allow Uploads" description="Users can attach files to messages">
              <Switch
                checked={isToolEnabled('file_upload')}
                onCheckedChange={(checked) => updateTool('file_upload', checked, { accept: '*/*' })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
