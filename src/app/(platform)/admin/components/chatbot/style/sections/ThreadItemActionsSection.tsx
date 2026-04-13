'use client'

import { Switch } from '@/components/ui/switch'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'
import { ThumbsUp, RefreshCw, MessageSquare } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function ThreadItemActionsSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure interactive action buttons that appear on each message.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="actions">
        <AccordionSectionGroup id="actions" title="Message Actions" icon={ThumbsUp} defaultOpen>
          <FormSection>
            <FormRow label="Feedback Controls" description="Allow users to like or dislike responses">
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

            <FormRow label="Retry Option" description="Enable regeneration of the last message">
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

          <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-lg mx-4">
            <div className="flex gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <strong>Compatibility:</strong> These settings are specifically optimized for the <strong>ChatKit</strong> engine. Support in other engines may vary.
              </p>
            </div>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
