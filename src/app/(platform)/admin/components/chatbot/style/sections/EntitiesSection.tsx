'use client'

import { Switch } from '@/components/ui/switch'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'
import { Tag } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function EntitiesSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure how the bot identifies and displays tags, mentions, and other specialized entities.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="entities">
        <AccordionSectionGroup id="entities" title="Entity Mentions" icon={Tag} defaultOpen>
          <FormSection>
            <FormRow label="Enable Search" description="Toggle tag and mention functionality">
              <Switch
                checked={!!chatkitOptions?.entities}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    entities: checked ? {
                      onTagSearch: undefined,
                      onRequestPreview: undefined
                    } : undefined
                  }
                } as any)}
              />
            </FormRow>
          </FormSection>

          {chatkitOptions?.entities && (
            <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-lg mx-4 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Developer Implementation Required:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li className="text-[10px] text-muted-foreground"><code className="bg-muted px-1 rounded">onTagSearch(query)</code> - Custom search logic</li>
                <li className="text-[10px] text-muted-foreground"><code className="bg-muted px-1 rounded">onRequestPreview(entity)</code> - Preview generator</li>
              </ul>
            </div>
          )}
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
