'use client'

import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'
import { FormRow, FormSection } from '../components/FormRow'

export function ThreadItemActionsSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="threadItemActions" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Message Actions (Like, Dislike, Retry)
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Configure which action buttons appear on chat messages.
        </p>
        <FormSection>
          <FormRow label="Feedback (Like/Dislike)" description="Show like and dislike buttons on messages">
            <Switch
              checked={chatkitOptions?.threadItemActions?.feedback ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  threadItemActions: {
                    ...chatkitOptions?.threadItemActions,
                    feedback: checked
                  }
                }
              } as any)}
            />
          </FormRow>

          <FormRow label="Retry" description="Show retry button to regenerate responses">
            <Switch
              checked={chatkitOptions?.threadItemActions?.retry ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  threadItemActions: {
                    ...chatkitOptions?.threadItemActions,
                    retry: checked
                  }
                }
              } as any)}
            />
          </FormRow>
        </FormSection>

        <div className="p-3 bg-muted/50 rounded-lg mt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> These settings only apply when using the ChatKit widget.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

