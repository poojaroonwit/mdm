'use client'

import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'
import { FormRow, FormSection } from '../components/FormRow'

export function EntitiesSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="entities" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Entities (Tags & Mentions)
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Configure entity search and preview functionality.
        </p>
        <FormSection>
          <FormRow label="Enable Entity Search" description="Enable tag/mention search functionality">
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
          <div className="p-3 bg-muted rounded text-sm text-muted-foreground space-y-2 mt-4">
            <p>Entity handlers must be implemented in code:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs">onTagSearch(query: string)</code> - Search for entities</li>
              <li><code className="text-xs">onRequestPreview(entity: any)</code> - Generate entity preview</li>
            </ul>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

