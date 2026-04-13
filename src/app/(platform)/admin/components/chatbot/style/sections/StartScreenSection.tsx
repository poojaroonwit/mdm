'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X, Monitor, MousePointer2, Plus, MessageSquare } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

// ChatKit Icon Select Component - Only shows ChatKit-supported icons
function ChatKitIconSelect({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const validChatKitIcons = [
    'agent', 'analytics', 'atom', 'bolt', 'book-open', 'calendar', 'chart', 'check', 'check-circle',
    'chevron-left', 'chevron-right', 'circle-question', 'compass', 'confetti', 'cube', 'document',
    'dots-horizontal', 'empty-circle', 'globe', 'keys', 'lab', 'images', 'info', 'lifesaver',
    'lightbulb', 'mail', 'map-pin', 'maps', 'name', 'notebook', 'notebook-pencil', 'page-blank',
    'phone', 'plus', 'profile', 'profile-card', 'star', 'star-filled', 'search', 'sparkle',
    'sparkle-double', 'square-code', 'square-image', 'square-text', 'suitcase', 'settings-slider',
    'user', 'wreath', 'write', 'write-alt', 'write-alt2', 'bug'
  ]

  const getIconLabel = (iconName: string) => {
    if (iconName === 'none') return 'None'
    return iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onValueChange(val === 'none' ? '' : val)}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Select icon" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="none">None</SelectItem>
        {validChatKitIcons.map((iconName) => (
          <SelectItem key={iconName} value={iconName}>
            {getIconLabel(iconName)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function StartScreenSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Define the initial greeting and suggested starter prompts for the chat session.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="greeting">
        <AccordionSectionGroup id="greeting" title="Initial Greeting" icon={Monitor} defaultOpen>
          <FormSection>
            <FormRow label="Greeting Message" description="Message shown when a user starts chatting">
              <Textarea
                value={chatkitOptions?.startScreen?.greeting || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    startScreen: {
                      ...chatkitOptions?.startScreen,
                      greeting: e.target.value
                    }
                  }
                } as any)}
                placeholder="Hello! How can I help you today?"
                rows={3}
                className="text-xs"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="prompts" title="Quick Prompts" icon={MessageSquare}>
          <div className="px-4 pb-6 space-y-4">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Configure Prompt Buttons</p>
            <div className="space-y-3">
              {(chatkitOptions?.startScreen?.prompts || []).map((prompt: { label?: string; prompt: string; icon?: string }, index: number) => (
                <div key={index} className="border border-border/60 rounded-lg p-3 bg-muted/20 relative group">
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                      prompts.splice(index, 1)
                      setFormData({ ...formData, chatkitOptions: { ...chatkitOptions, startScreen: { ...chatkitOptions?.startScreen, prompts } } } as any)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <FormSection>
                    <FormRow label="Button Label" description="" className="py-0.5">
                      <Input
                        value={prompt.label || ''}
                        onChange={(e) => {
                          const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                          prompts[index] = { ...prompts[index], label: e.target.value }
                          setFormData({ ...formData, chatkitOptions: { ...chatkitOptions, startScreen: { ...chatkitOptions?.startScreen, prompts } } } as any)
                        }}
                        placeholder="e.g. Help"
                        className="h-7 text-[11px]"
                      />
                    </FormRow>
                    <FormRow label="Message Text" description="" className="py-0.5">
                      <Input
                        value={prompt.prompt || ''}
                        onChange={(e) => {
                          const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                          prompts[index] = { ...prompts[index], prompt: e.target.value }
                          setFormData({ ...formData, chatkitOptions: { ...chatkitOptions, startScreen: { ...chatkitOptions?.startScreen, prompts } } } as any)
                        }}
                        placeholder="e.g. How do I...?"
                        className="h-7 text-[11px]"
                      />
                    </FormRow>
                    <FormRow label="Icon" description="" className="py-0.5">
                      <ChatKitIconSelect
                        value={prompt.icon || 'none'}
                        onValueChange={(value) => {
                          const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                          prompts[index] = { ...prompts[index], icon: value === 'none' ? undefined : value }
                          setFormData({ ...formData, chatkitOptions: { ...chatkitOptions, startScreen: { ...chatkitOptions?.startScreen, prompts } } } as any)
                        }}
                      />
                    </FormRow>
                  </FormSection>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-[11px] border-dashed"
                onClick={() => {
                  const prompts = [...(chatkitOptions?.startScreen?.prompts || []), { prompt: '' }]
                  setFormData({ ...formData, chatkitOptions: { ...chatkitOptions, startScreen: { ...chatkitOptions?.startScreen, prompts } } } as any)
                }}
              >
                <Plus className="h-3 w-3 mr-1.5" /> Add Starter Prompt
              </Button>
            </div>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
