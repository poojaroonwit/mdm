'use client'

import { Switch } from '@/components/ui/switch'
import { History, Settings, Info } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function ChatKitHistorySection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const history = (formData as any).chatkitOptions?.history || chatkitOptions?.history || {}

  const updateHistory = (updates: any) => {
    const currentOptions = (formData as any).chatkitOptions || chatkitOptions || {}
    setFormData({
      ...formData,
      chatkitOptions: {
        ...currentOptions,
        history: { ...history, ...updates }
      }
    } as any)
  }

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the conversation history panel, allowing users to browse and manage previous chat threads.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="visibility">
        <AccordionSectionGroup id="visibility" title="Panel Visibility" icon={History} defaultOpen>
          <FormSection>
            <FormRow label="Enable History" description="Show the history sidebar in the interface">
              <Switch
                checked={history.enabled !== false}
                onCheckedChange={(checked) => updateHistory({ enabled: checked })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="management" title="Thread Management" icon={Settings}>
          <FormSection>
            <FormRow label="Allow Deletion" description="Users can permanently remove threads">
              <Switch
                checked={history.showDelete !== false}
                onCheckedChange={(checked) => updateHistory({ showDelete: checked })}
              />
            </FormRow>
            <FormRow label="Allow Renaming" description="Users can customize thread titles">
              <Switch
                checked={history.showRename !== false}
                onCheckedChange={(checked) => updateHistory({ showRename: checked })}
              />
            </FormRow>
          </FormSection>

          <div className="mt-4 px-4 pb-4">
             <div className="p-3 bg-muted/30 border border-border/50 rounded-lg flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Developer Note:</strong> History data is stored locally by default. Server-side persistence requires a configured backend storage integration.
                </p>
             </div>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
