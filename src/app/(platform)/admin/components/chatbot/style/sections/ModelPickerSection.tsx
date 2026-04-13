'use client'

import { Switch } from '@/components/ui/switch'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'
import { Cpu } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function ModelPickerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Enable users to switch between different AI models within the chat session.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="model">
        <AccordionSectionGroup id="model" title="Model Switching" icon={Cpu} defaultOpen>
          <FormSection>
            <FormRow label="Enable Picker" description="Display model selector in chat window">
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

          <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-lg mx-4">
             <p className="text-[10px] text-muted-foreground leading-relaxed">
                <strong>Note:</strong> Available models are determined by your ChatKit agent configuration settings in the primary dashboard.
             </p>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
