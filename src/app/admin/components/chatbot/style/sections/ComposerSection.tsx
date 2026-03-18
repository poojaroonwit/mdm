'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import * as Icons from 'lucide-react'
import type { SectionProps } from './types'
import { FormRow, FormSection } from '../components/FormRow'

export function ComposerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const [openItem, setOpenItem] = useState('placeholder')

  // Get current composer config
  const composer = (formData as any).chatkitOptions?.composer || chatkitOptions?.composer || {}
  const tools: any[] = composer.tools || []

  const updateComposer = (updates: Record<string, any>) => {
    const currentOptions = (formData as any).chatkitOptions || chatkitOptions || {}
    const currentComposer = currentOptions.composer || {}
    setFormData({
      ...formData,
      chatkitOptions: {
        ...currentOptions,
        composer: {
          ...currentComposer,
          ...updates,
        },
      },
    } as any)
  }

  const updateTool = (toolType: string, enabled: boolean, extraProps?: Record<string, any>) => {
    const currentOptions = (formData as any).chatkitOptions || chatkitOptions || {}
    const currentComposer = currentOptions.composer || {}
    let currentTools: any[] = currentComposer.tools || []

    if (enabled) {
      // Add tool if not already present
      if (!currentTools.find((t: any) => t.type === toolType)) {
        currentTools = [...currentTools, { type: toolType, ...extraProps }]
      }
    } else {
      // Remove tool
      currentTools = currentTools.filter((t: any) => t.type !== toolType)
    }

    setFormData({
      ...formData,
      chatkitOptions: {
        ...currentOptions,
        composer: {
          ...currentComposer,
          tools: currentTools,
        },
      },
    } as any)
  }

  const isToolEnabled = (toolType: string) => {
    return tools.some((t: any) => t.type === toolType)
  }

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the composer (input area) behavior and available tools.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(val) => setOpenItem(val as string)}
      >
        <AccordionItem value="placeholder" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Icons.Type className="h-4 w-4" />
              Placeholder Text
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Placeholder" description="Text shown when the input is empty">
                <Input
                  value={composer.placeholder || ''}
                  onChange={(e) => updateComposer({ placeholder: e.target.value })}
                  placeholder="Type a message..."
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tools" className="border-b-0 border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Icons.Wrench className="h-4 w-4" />
              Composer Tools
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="File Search" description="Allow file search in conversations">
                <Switch
                  checked={isToolEnabled('file_search')}
                  onCheckedChange={(checked) => updateTool('file_search', checked)}
                />
              </FormRow>
              <FormRow label="Web Search" description="Enable web search capability">
                <Switch
                  checked={isToolEnabled('web_search')}
                  onCheckedChange={(checked) => updateTool('web_search', checked)}
                />
              </FormRow>
              <FormRow label="Code Interpreter" description="Enable code execution">
                <Switch
                  checked={isToolEnabled('code_interpreter')}
                  onCheckedChange={(checked) => updateTool('code_interpreter', checked)}
                />
              </FormRow>
              <FormRow label="Image Generation" description="Enable image generation">
                <Switch
                  checked={isToolEnabled('image_generation')}
                  onCheckedChange={(checked) => updateTool('image_generation', checked)}
                />
              </FormRow>
              <FormRow label="File Upload" description="Allow file uploads in the composer">
                <Switch
                  checked={isToolEnabled('file_upload')}
                  onCheckedChange={(checked) => updateTool('file_upload', checked, { accept: '*/*' })}
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
