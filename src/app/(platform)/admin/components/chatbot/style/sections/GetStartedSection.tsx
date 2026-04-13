'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { DifyImageUpload } from '../DifyImageUpload'
import { IconPicker } from '@/components/ui/icon-picker'
import * as Icons from 'lucide-react'
import { Rocket, Box, Image as ImageIcon, MessageCircle } from 'lucide-react'
import type { SectionProps } from './types'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function GetStartedSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  // Get current getStarted config
  const getStarted = (formData as any).chatkitOptions?.getStarted || chatkitOptions?.getStarted || {}

  const updateGetStarted = (updates: Record<string, any>) => {
    const currentOptions = (formData as any).chatkitOptions || chatkitOptions || {}
    const currentGetStarted = currentOptions.getStarted || {}
    setFormData({
      ...formData,
      chatkitOptions: {
        ...currentOptions,
        getStarted: {
          ...currentGetStarted,
          ...updates,
        },
      },
    } as any)
  }

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the pre-chat splash screen that appears before a session starts.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="settings">
        <AccordionSectionGroup id="settings" title="Get Started Settings" icon={Rocket} defaultOpen>
          <FormSection>
            <FormRow label="Enable Screen" description="Show splash screen before chat">
              <Switch
                checked={getStarted.enabled || false}
                onCheckedChange={(checked) => updateGetStarted({ enabled: checked })}
              />
            </FormRow>

            {getStarted.enabled && (
              <>
                <FormRow label="Brand Asset" description="Header image or icon">
                  <div className="space-y-3">
                    <DifyImageUpload
                        value={getStarted.image}
                        onChange={(v) => updateGetStarted({ image: v })}
                    />
                    <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Alternative:</span>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">
                                <MessageCircle className="h-3 w-3 mr-1.5" />
                                Select Icon
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-4" align="start">
                            <IconPicker
                                value={getStarted.icon || 'MessageCircle'}
                                onChange={(v) => updateGetStarted({ icon: v, image: '' })}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                  </div>
                </FormRow>

                <FormRow label="Title" description="Main welcome heading">
                  <Input
                    value={getStarted.title || ''}
                    onChange={(e) => updateGetStarted({ title: e.target.value })}
                    placeholder="Welcome to Support"
                    className="h-8 text-xs font-semibold"
                  />
                </FormRow>

                <FormRow label="Subtitle" description="Tagline below heading">
                  <Input
                    value={getStarted.subTitle || ''}
                    onChange={(e) => updateGetStarted({ subTitle: e.target.value })}
                    placeholder="We're here to help"
                    className="h-8 text-xs"
                  />
                </FormRow>

                <FormRow label="Body Text" description="Detailed description">
                  <Textarea
                    value={getStarted.description || ''}
                    onChange={(e) => updateGetStarted({ description: e.target.value })}
                    placeholder="Ask us anything..."
                    className="text-xs min-h-[80px]"
                  />
                </FormRow>

                <FormRow label="Button Label" description="Text on action button">
                  <Input
                    value={getStarted.buttonText || ''}
                    onChange={(e) => updateGetStarted({ buttonText: e.target.value })}
                    placeholder="Start Chatting"
                    className="h-8 text-xs"
                  />
                </FormRow>

                <FormRow label="Bottom Space" description="Vertical offset from bottom">
                  <div className="relative">
                    <Input
                        value={getStarted.marginBottom || ''}
                        onChange={(e) => updateGetStarted({ marginBottom: e.target.value })}
                        placeholder="0"
                        className="h-8 text-xs pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                  </div>
                </FormRow>
              </>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
