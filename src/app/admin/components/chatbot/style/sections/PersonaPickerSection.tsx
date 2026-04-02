'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { X, User } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'

export function PersonaPickerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const personas = chatkitOptions?.personaPicker?.personas || []
  console.log('[PersonaPickerSection] rendering', { chatkitOptions, personas })

  return (
    <div className="py-4 px-4 space-y-4">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Enable the persona picker to allow users to select different AI personas during the conversation. Each persona can have its own name, description, and system prompt to change the AI's behavior and personality.
        </p>

        <FormSection>
          <FormRow label="Enable Persona Picker" description="Allow users to switch between different AI personas">
            <Switch
              checked={chatkitOptions?.personaPicker?.enabled ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  personaPicker: {
                    ...chatkitOptions?.personaPicker,
                    enabled: checked
                  }
                }
              } as any)}
            />
          </FormRow>
        </FormSection>

        {chatkitOptions?.personaPicker?.enabled && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Personas</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Define different personas that users can select. Each persona can have a unique name, description, and system prompt.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Note:</strong> Personas will automatically use the header avatar configuration (icon/image, colors) from the chat header settings.
                </div>
                {personas.map((persona: { id?: string; name?: string; description?: string; systemPrompt?: string }, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium">Persona {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedPersonas = [...personas]
                          updatedPersonas.splice(index, 1)
                          setFormData({
                            ...formData,
                            chatkitOptions: {
                              ...chatkitOptions,
                              personaPicker: {
                                ...chatkitOptions?.personaPicker,
                                personas: updatedPersonas
                              }
                            }
                          } as any)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <FormSection>
                      <FormRow label="ID" description="Optional persona identifier" className="py-1">
                        <Input
                          value={persona.id || ''}
                          onChange={(e) => {
                            const updatedPersonas = [...personas]
                            updatedPersonas[index] = { ...updatedPersonas[index], id: e.target.value }
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...chatkitOptions,
                                personaPicker: {
                                  ...chatkitOptions?.personaPicker,
                                  personas: updatedPersonas
                                }
                              }
                            } as any)
                          }}
                          placeholder="persona-1"
                        />
                      </FormRow>
                      <FormRow label="Name" description="" className="py-1">
                        <Input
                          value={persona.name || ''}
                          onChange={(e) => {
                            const updatedPersonas = [...personas]
                            updatedPersonas[index] = { ...updatedPersonas[index], name: e.target.value }
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...chatkitOptions,
                                personaPicker: {
                                  ...chatkitOptions?.personaPicker,
                                  personas: updatedPersonas
                                }
                              }
                            } as any)
                          }}
                          placeholder="Friendly Assistant"
                        />
                      </FormRow>
                      <FormRow label="Description" description="Optional persona description" className="py-1">
                        <Input
                          value={persona.description || ''}
                          onChange={(e) => {
                            const updatedPersonas = [...personas]
                            updatedPersonas[index] = { ...updatedPersonas[index], description: e.target.value }
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...chatkitOptions,
                                personaPicker: {
                                  ...chatkitOptions?.personaPicker,
                                  personas: updatedPersonas
                                }
                              }
                            } as any)
                          }}
                          placeholder="A helpful and friendly AI assistant"
                        />
                      </FormRow>
                      <FormRow label="System Prompt" description="Defines how this persona behaves and responds" className="py-1">
                        <Textarea
                          value={persona.systemPrompt || ''}
                          onChange={(e) => {
                            const updatedPersonas = [...personas]
                            updatedPersonas[index] = { ...updatedPersonas[index], systemPrompt: e.target.value }
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...chatkitOptions,
                                personaPicker: {
                                  ...chatkitOptions?.personaPicker,
                                  personas: updatedPersonas
                                }
                              }
                            } as any)
                          }}
                          placeholder="You are a helpful assistant that..."
                          rows={3}
                        />
                      </FormRow>
                    </FormSection>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedPersonas = [...personas, { name: '', systemPrompt: '' }]
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        personaPicker: {
                          ...chatkitOptions?.personaPicker,
                          personas: updatedPersonas
                        }
                      }
                    } as any)
                  }}
                >
                  + Add Persona
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> When users switch personas, the system prompt will change, affecting how the AI responds. Make sure each persona's system prompt clearly defines its unique behavior and personality.
          </p>
        </div>
      </div>
    </div>
  )
}
