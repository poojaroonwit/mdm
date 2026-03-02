'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { DifyImageUpload } from '../DifyImageUpload'
import { IconPicker } from '@/components/ui/icon-picker'
import * as Icons from 'lucide-react'
import { ChevronsUpDown } from 'lucide-react'
import type { SectionProps } from './types'
import { FormRow, FormSection } from '../components/FormRow'

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
          Configure the "Get Started" popover that appears before the chat session begins.
        </p>
      </div>

      <FormSection className="pt-2 pb-4">
        <FormRow label="Enable Get Started" description="Show this screen before opening chat">
          <Switch
            checked={getStarted.enabled || false}
            onCheckedChange={(checked) => updateGetStarted({ enabled: checked })}
          />
        </FormRow>

        {getStarted.enabled && (
          <>
            <FormRow label="Image" description="Image displayed at the top (replaces icon)">
              <div className="flex flex-col gap-2">
                 <DifyImageUpload
                    value={getStarted.image}
                    onChange={(v) => updateGetStarted({ image: v })}
                 />
                 <div className="text-xs text-muted-foreground">
                    Or back to icon:
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className="ml-2 h-6 text-xs">
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

            <FormRow label="Title" description="Main heading text">
              <Input
                value={getStarted.title || ''}
                onChange={(e) => updateGetStarted({ title: e.target.value })}
                placeholder="Welcome to Support"
              />
            </FormRow>

            <FormRow label="Subtitle" description="Smaller text below the title">
              <Input
                value={getStarted.subTitle || ''}
                onChange={(e) => updateGetStarted({ subTitle: e.target.value })}
                placeholder="We're here to help"
              />
            </FormRow>

            <FormRow label="Description" description="Detailed text body">
              <Textarea
                value={getStarted.description || ''}
                onChange={(e) => updateGetStarted({ description: e.target.value })}
                placeholder="Ask us anything about our products or services."
                className="min-h-[80px]"
              />
            </FormRow>

            <FormRow label="Button Text" description="Text on the start button">
              <Input
                value={getStarted.buttonText || ''}
                onChange={(e) => updateGetStarted({ buttonText: e.target.value })}
                placeholder="Start Chat"
              />
            </FormRow>

            <FormRow label="Bottom Margin" description="Space between widget and popover (e.g. 20px)">
              <Input
                value={getStarted.marginBottom || ''}
                onChange={(e) => updateGetStarted({ marginBottom: e.target.value })}
                placeholder="0px"
              />
            </FormRow>
          </>
        )}
      </FormSection>
    </div>
  )
}
