'use client'

import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function DisclaimerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Define legal notices or important information that users should see in the chat interface.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="disclaimer">
        <AccordionSectionGroup id="disclaimer" title="Legal Disclaimer" icon={AlertCircle} defaultOpen>
          <FormSection>
            <FormRow label="Text Content" description="Markdown supported body text">
              <Textarea
                value={chatkitOptions?.disclaimer?.text || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    disclaimer: {
                      ...chatkitOptions?.disclaimer,
                      text: e.target.value
                    }
                  }
                } as any)}
                placeholder="By using this chat, you agree to our terms..."
                rows={4}
                className="text-xs"
              />
            </FormRow>
          </FormSection>

          <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-lg mx-4">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <strong>Pro Tip:</strong> Leave this empty to hide the disclaimer panel. Styling is automatically inherited from your widget theme.
              </p>
            </div>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
