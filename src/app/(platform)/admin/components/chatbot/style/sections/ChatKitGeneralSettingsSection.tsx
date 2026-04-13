'use client'

import { Switch } from '@/components/ui/switch'
import { Settings, Monitor, Info } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function ChatKitGeneralSettingsSection({ formData, setFormData }: SectionProps) {
  const engineType = (formData as any).engineType || 'custom'
  const isChatKitEngine = engineType === 'chatkit'
  const isOpenAIAgentSDK = engineType === 'openai-agent-sdk'
  const isEnabled = formData.useChatKitInRegularStyle === true
  const chatbotEnabled = (formData as any).chatbotEnabled !== false

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure foundational settings and cross-engine compatibility for the ChatKit interface.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="platform">
        <AccordionSectionGroup id="platform" title="Platform Controls" icon={Settings} defaultOpen>
          <FormSection>
            {isOpenAIAgentSDK && (
              <FormRow label="Global Activation" description="Enable or disable the chatbot widget completely">
                <Switch
                  checked={chatbotEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, chatbotEnabled: checked } as any)}
                />
              </FormRow>
            )}
            <FormRow label="Desktop Interface" description={isChatKitEngine ? "Force regular style UI on desktop" : "Inject ChatKit UI into regular engines"}>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, useChatKitInRegularStyle: checked })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="compatibility" title="Device Compatibility" icon={Monitor}>
          <div className="px-4 pb-4">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg flex gap-2">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-blue-800 dark:text-blue-200 font-bold uppercase tracking-wider">Mobile Always-On</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-normal">
                  Mobile devices always utilize the native <strong>ChatKit UI</strong> optimized for touch interaction, regardless of desktop settings.
                </p>
              </div>
            </div>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
