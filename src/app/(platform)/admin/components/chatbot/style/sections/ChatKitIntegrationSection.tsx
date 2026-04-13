'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { X, Settings, Layout, Palette, Square, History, MousePointerClick, Plus, Upload } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { FormRow, FormSection } from '../components/FormRow'
import type { Chatbot } from '../../types'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

interface ChatKitIntegrationSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatKitIntegrationSection({ formData, setFormData }: ChatKitIntegrationSectionProps) {
  const handleChange = (field: keyof Chatbot, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }
  const engineType = (formData as any).engineType || 'custom'
  const isChatKitEngine = engineType === 'chatkit'
  const isOpenAIAgentSDK = engineType === 'openai-agent-sdk'
  const isEnabled = formData.useChatKitInRegularStyle === true
  const chatbotEnabled = (formData as any).chatbotEnabled !== false

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure deep integration settings for ChatKit and OpenAI Agent SDK engines.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="general">
        <AccordionSectionGroup id="general" title="General Settings" icon={Settings} defaultOpen>
          <FormSection>
            {isOpenAIAgentSDK && (
              <FormRow label="Enable Widget" description="Toggle visibility of the chatbot">
                <Switch
                  checked={chatbotEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, chatbotEnabled: checked } as any)}
                />
              </FormRow>
            )}
            <FormRow label="Desktop Integration" description={isChatKitEngine ? "Use regular UI on desktop" : "Enable ChatKit layers"}>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, useChatKitInRegularStyle: checked })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="header" title="Header Content" icon={Layout}>
          <FormSection>
            <FormRow label="Show Title" description="Toggle title display">
              <Switch
                checked={(formData as any).headerShowTitle !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowTitle: checked } as any)}
              />
            </FormRow>
            {(formData as any).headerShowTitle !== false && (
              <FormRow label="Title" description="Text displayed in header">
                <Input
                  value={formData.headerTitle || ''}
                  onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value } as any)}
                  placeholder="Chatbot Name"
                  className="h-8 text-xs font-medium"
                />
              </FormRow>
            )}
            <FormRow label="Description" description="Small tagline below title">
              <Input
                value={formData.headerDescription || ''}
                onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                placeholder="How can I help?"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Logo Type" description="Upload or use URL">
              <div className="space-y-2">
                <Input
                  value={formData.headerLogo || ''}
                  onChange={(e) => setFormData({ ...formData, headerLogo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="h-8 text-xs"
                />
                <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed" onClick={() => (document.getElementById('header-logo-upload-ck') as any)?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-2" /> Upload Image
                </Button>
                <input id="header-logo-upload-ck" type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const reader = new FileReader(); reader.onload = (ev) => setFormData({ ...formData, headerLogo: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }} />
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="actions" title="Action Buttons" icon={MousePointerClick}>
          <FormSection>
            <FormRow label="Clear Session" description="Show clear conversation button">
              <Switch
                checked={(formData as any).headerShowClearSession !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowClearSession: checked } as any)}
              />
            </FormRow>
            <FormRow label="Start Chat" description="Show entry message to start chat">
              <Switch
                checked={formData.showStartConversation !== false}
                onCheckedChange={(checked) => handleChange('showStartConversation', checked)}
              />
            </FormRow>
            <FormRow label="Conversation Renaming" description="Allow users to rename threads">
              <Switch
                checked={(formData as any).enableConversationRenaming !== false}
                onCheckedChange={(checked) => handleChange('enableConversationRenaming', checked)}
              />
            </FormRow>
            <FormRow label="New Chat Button" description="Display New Chat button in sidebar">
              <Switch
                checked={(formData as any).showNewChatButton !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, showNewChatButton: checked } as any)}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="styling" title="Header Styling" icon={Palette}>
          <FormSection>
            <FormRow label="Background" description="Header color or image">
              <ColorInput
                value={formData.headerBgColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Header text color">
              <ColorInput
                value={formData.headerFontColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, headerFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="history" title="History Settings" icon={History}>
          <FormSection>
            <FormRow label="Enable History" description="Show conversation history sidebar">
              <Switch
                checked={(formData as any).chatkitOptions?.history?.enabled !== false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  chatkitOptions: { ...(formData as any).chatkitOptions, history: { ...(formData as any).chatkitOptions?.history, enabled: checked } }
                } as any)}
              />
            </FormRow>
            {(formData as any).chatkitOptions?.history?.enabled !== false && (
              <>
                <FormRow label="Allow Deletion" description="Show delete thread action">
                  <Switch
                    checked={(formData as any).chatkitOptions?.history?.showDelete !== false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      chatkitOptions: { ...(formData as any).chatkitOptions, history: { ...(formData as any).chatkitOptions?.history, showDelete: checked } }
                    } as any)}
                  />
                </FormRow>
                <FormRow label="Allow Re-naming" description="Show rename thread action">
                  <Switch
                    checked={(formData as any).chatkitOptions?.history?.showRename !== false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      chatkitOptions: { ...(formData as any).chatkitOptions, history: { ...(formData as any).chatkitOptions?.history, showRename: checked } }
                    } as any)}
                  />
                </FormRow>
              </>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
