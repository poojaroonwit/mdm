'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertCircle } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'

export function DisclaimerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="disclaimer" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Disclaimer
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <FormSection>
            <FormRow label="Disclaimer Text" description="Legal notice or important information for users">
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
                placeholder="Enter disclaimer text..."
                rows={4}
              />
            </FormRow>
          </FormSection>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Leave empty to hide the disclaimer. Styling is handled by ChatKit.
              </p>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

