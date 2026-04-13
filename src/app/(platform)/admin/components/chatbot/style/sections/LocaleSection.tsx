'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'
import { Globe, Cpu, Tag } from 'lucide-react'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { Switch } from '@/components/ui/switch'

export function LocaleSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Select the primary language for the chat interface and system messages.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="locale">
        <AccordionSectionGroup id="locale" title="Interface Language" icon={Globe} defaultOpen>
          <FormSection>
            <FormRow label="Language" description="Global locale for chat UI">
              <Select
                value={chatkitOptions?.locale || 'en'}
                onValueChange={(v) => setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    locale: v
                  }
                } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="th">Thai</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}

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
