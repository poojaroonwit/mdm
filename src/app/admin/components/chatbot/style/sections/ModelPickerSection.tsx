'use client'

import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'
import { FormRow, FormSection } from '../components/FormRow'

export function ModelPickerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="modelPicker" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Model Picker
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Enable the model picker to allow users to select different AI models during the conversation.
        </p>
        <FormSection>
          <FormRow label="Enable Model Picker" description="Allow users to switch between available AI models">
            <Switch
              checked={chatkitOptions?.modelPicker?.enabled ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  modelPicker: {
                    ...chatkitOptions?.modelPicker,
                    enabled: checked
                  }
                }
              } as any)}
            />
          </FormRow>
        </FormSection>

        <div className="p-3 bg-muted/50 rounded-lg mt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> The available models will be determined by your ChatKit agent configuration.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

