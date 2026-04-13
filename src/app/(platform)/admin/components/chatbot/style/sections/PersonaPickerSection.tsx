'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { X, User, Settings, Info, Plus } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function PersonaPickerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const personas = chatkitOptions?.personaPicker?.personas || []

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configuration for the multi-persona feature, allowing end-users to switch between pre-defined AI personalities.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="config">
        <AccordionSectionGroup 
          id="config" 
          title="General Configuration" 
          icon={Settings}
          defaultOpen={true}
        >
          <FormSection>
            <FormRow label="Enable Switcher" description="Show the persona selection UI to end-users">
              <Switch
                checked={chatkitOptions?.personaPicker?.enabled ?? false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    personaPicker: { ...chatkitOptions?.personaPicker, enabled: checked }
                  }
                } as any)}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        {chatkitOptions?.personaPicker?.enabled && (
          <AccordionSectionGroup id="personas" title="Persona Definitions" icon={User}>
            <div className="px-4 pb-6 space-y-5">
              <div className="flex gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-normal">
                  <strong>Note:</strong> Personas inherit visual branding from the primary header configuration. Unique prompts define their unique logic.
                </p>
              </div>

              <div className="space-y-4">
                {personas.map((persona: { id?: string; name?: string; description?: string; systemPrompt?: string }, index: number) => (
                  <div key={index} className="group border border-border/60 rounded-xl overflow-hidden bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Persona #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => {
                          const updatedPersonas = [...personas]
                          updatedPersonas.splice(index, 1)
                          setFormData({
                            ...formData,
                            chatkitOptions: {
                              ...chatkitOptions,
                              personaPicker: { ...chatkitOptions?.personaPicker, personas: updatedPersonas }
                            }
                          } as any)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-4">
                      <FormSection>
                        <FormRow label="Identifier" description="Unique key for API/Logic">
                          <Input
                            value={persona.id || ''}
                            className="h-8 text-xs font-mono"
                            onChange={(e) => {
                              const updatedPersonas = [...personas]
                              updatedPersonas[index] = { ...updatedPersonas[index], id: e.target.value }
                              setFormData({
                                ...formData,
                                chatkitOptions: { ...chatkitOptions, personaPicker: { ...chatkitOptions?.personaPicker, personas: updatedPersonas } }
                              } as any)
                            }}
                            placeholder="persona-id"
                          />
                        </FormRow>
                        <FormRow label="Display Name" description="Visible name in the switcher">
                          <Input
                            value={persona.name || ''}
                            className="h-8 text-xs font-medium"
                            onChange={(e) => {
                              const updatedPersonas = [...personas]
                              updatedPersonas[index] = { ...updatedPersonas[index], name: e.target.value }
                              setFormData({
                                ...formData,
                                chatkitOptions: { ...chatkitOptions, personaPicker: { ...chatkitOptions?.personaPicker, personas: updatedPersonas } }
                              } as any)
                            }}
                            placeholder="e.g. Creative Assistant"
                          />
                        </FormRow>
                        <FormRow label="Tagline" description="Brief description for UI">
                          <Input
                            value={persona.description || ''}
                            className="h-8 text-xs"
                            onChange={(e) => {
                              const updatedPersonas = [...personas]
                              updatedPersonas[index] = { ...updatedPersonas[index], description: e.target.value }
                              setFormData({
                                ...formData,
                                chatkitOptions: { ...chatkitOptions, personaPicker: { ...chatkitOptions?.personaPicker, personas: updatedPersonas } }
                              } as any)
                            }}
                            placeholder="Helps with visual tasks..."
                          />
                        </FormRow>
                        <div className="space-y-1.5 pt-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">System Logic / Prompt</Label>
                          <Textarea
                            value={persona.systemPrompt || ''}
                            className="text-xs min-h-[80px] bg-background/50 focus:bg-background transition-colors"
                            onChange={(e) => {
                              const updatedPersonas = [...personas]
                              updatedPersonas[index] = { ...updatedPersonas[index], systemPrompt: e.target.value }
                              setFormData({
                                ...formData,
                                chatkitOptions: { ...chatkitOptions, personaPicker: { ...chatkitOptions?.personaPicker, personas: updatedPersonas } }
                              } as any)
                            }}
                            placeholder="You are an AI specialized in..."
                          />
                        </div>
                      </FormSection>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 border-dashed hover:border-solid hover:bg-muted/50 transition-all gap-1.5"
                  onClick={() => {
                    const updatedPersonas = [...personas, { id: 'new-persona', name: 'New Persona', systemPrompt: '' }]
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        personaPicker: { ...chatkitOptions?.personaPicker, personas: updatedPersonas }
                      }
                    } as any)
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Personality Profile
                </Button>
              </div>
            </div>
          </AccordionSectionGroup>
        )}
      </AccordionSectionWrapper>

      <div className="px-4 py-6 border-t border-border/40 mt-6 bg-muted/5">
        <p className="text-[10px] text-muted-foreground italic text-center leading-relaxed max-w-[80%] mx-auto">
          Tip: Personas are most effective when their system prompts are distinct. Use them to provide specialized domain expertise.
        </p>
      </div>
    </div>
  )
}
