'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import { Button } from '@/components/ui/button'
import { X, Settings, Layout, Palette, Square, History, MousePointerClick, LayoutTemplate } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { FormRow, FormSection } from '../components/FormRow'
import type { Chatbot } from '../../types'

interface ChatKitIntegrationSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatKitIntegrationSection({ formData, setFormData }: ChatKitIntegrationSectionProps) {
  const [openItem, setOpenItem] = useState('general-settings')

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
  const chatbotEnabled = (formData as any).chatbotEnabled !== false // Default to true

  return (
    <div className="space-y-2">
      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(val) => setOpenItem(val as string)}
      >
        {/* General Settings */}
        <AccordionItem value="general-settings" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">General Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <FormSection>
              {isOpenAIAgentSDK && (
                <FormRow label="Enable Chatbot Widget" description="When disabled, the chatbot will not be displayed">
                  <Switch
                    checked={chatbotEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, chatbotEnabled: checked } as any)}
                  />
                </FormRow>
              )}
              <FormRow label="Enable on Desktop" description={isChatKitEngine ? "Use regular style UI on desktop" : "Enable ChatKit for regular style engines"}>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, useChatKitInRegularStyle: checked })}
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {/* Header Content */}
        <AccordionItem value="header-content" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Content</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {/* Title & Description */}
              <div className="rounded-md border p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-4">Title & Description</h4>
                <FormSection>
                  <FormRow label="Show Title" description="">
                    <Switch
                      id="headerShowTitle"
                      checked={(formData as any).headerShowTitle !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, headerShowTitle: checked } as any)}
                    />
                  </FormRow>
                  {(formData as any).headerShowTitle !== false && (
                    <FormRow label="Title" description="Title displayed in the header">
                      <Input
                        value={formData.headerTitle || ''}
                        onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value } as any)}
                        placeholder="Chatbot Name"
                      />
                    </FormRow>
                  )}
                  <FormRow label="Header Description" description="Short tagline or description">
                    <Input
                      value={formData.headerDescription || ''}
                      onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                      placeholder="Short tagline or description"
                    />
                  </FormRow>
                </FormSection>
              </div>

              {/* Header Logo */}
              <div className="rounded-md border p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-4">Header Logo</h4>
                <FormSection>
                  <FormRow label="Show Header Logo" description="">
                    <Switch
                      checked={(formData as any).headerShowLogo !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, headerShowLogo: checked } as any)}
                    />
                  </FormRow>
                  {(formData as any).headerShowLogo !== false && (
                    <>
                      <FormRow label="Image URL" description="">
                        <Input
                          value={formData.headerLogo || ''}
                          onChange={(e) => setFormData({ ...formData, headerLogo: e.target.value })}
                          placeholder="https://example.com/logo.png"
                        />
                      </FormRow>
                      <FormRow label="Or Upload File" description="">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              const url = ev.target?.result as string
                              setFormData({ ...formData, headerLogo: url })
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </FormRow>
                      {formData.headerLogo && (
                        <div className="mt-2">
                          <img
                            src={formData.headerLogo}
                            alt="Header logo"
                            className="h-12 w-12 object-contain border rounded bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </FormSection>
              </div>

              {/* Header Custom Buttons */}
              <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-4">Header Custom Buttons</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Add custom buttons to the header. These buttons will appear in the header area.
                </p>
                <div className="space-y-2">
                  {((formData as any).chatkitOptions?.header?.customButtonLeft || []).map((button: { icon?: string; label?: string }, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-background">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <FormSection>
                            <FormRow label="Button Label" description="" className="py-1">
                              <Input
                                value={button.label || ''}
                                onChange={(e) => {
                                  const buttons = [...((formData as any).chatkitOptions?.header?.customButtonLeft || [])]
                                  buttons[index] = { ...buttons[index], label: e.target.value }
                                  const currentOptions = (formData as any).chatkitOptions || {}
                                  setFormData({
                                    ...formData,
                                    chatkitOptions: {
                                      ...currentOptions,
                                      header: {
                                        ...currentOptions.header,
                                        customButtonLeft: buttons
                                      }
                                    }
                                  } as any)
                                }}
                                placeholder="Button Label"
                              />
                            </FormRow>
                            <FormRow label="Icon Name" description="" className="py-1">
                              <Input
                                value={button.icon || ''}
                                onChange={(e) => {
                                  const buttons = [...((formData as any).chatkitOptions?.header?.customButtonLeft || [])]
                                  buttons[index] = { ...buttons[index], icon: e.target.value }
                                  const currentOptions = (formData as any).chatkitOptions || {}
                                  setFormData({
                                    ...formData,
                                    chatkitOptions: {
                                      ...currentOptions,
                                      header: {
                                        ...currentOptions.header,
                                        customButtonLeft: buttons
                                      }
                                    }
                                  } as any)
                                }}
                                placeholder="e.g., Settings, Menu"
                              />
                            </FormRow>
                          </FormSection>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const buttons = [...((formData as any).chatkitOptions?.header?.customButtonLeft || [])]
                            buttons.splice(index, 1)
                            const currentOptions = (formData as any).chatkitOptions || {}
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...currentOptions,
                                header: {
                                  ...currentOptions.header,
                                  customButtonLeft: buttons
                                }
                              }
                            } as any)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentButtons = (formData as any).chatkitOptions?.header?.customButtonLeft || []
                      const buttons = [...currentButtons, { icon: '', label: '' }]
                      const currentOptions = (formData as any).chatkitOptions || {}
                      setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...currentOptions,
                          header: {
                            ...currentOptions.header,
                            customButtonLeft: buttons
                          }
                        }
                      } as any)
                    }}
                  >
                    + Add Header Button
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Header Action Buttons */}
        <AccordionItem value="header-actions" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Action Buttons</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <FormSection>
              <FormRow label="Show Clear Button" description="Display clear conversation button in header">
                <Switch
                  checked={(formData as any).headerShowClearSession !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, headerShowClearSession: checked } as any)}
                />
              </FormRow>
              <FormRow label="Show Start Conversation" description="Show entry message to start chat">
                <Switch
                  checked={formData.showStartConversation !== false}
                  onCheckedChange={(checked) => handleChange('showStartConversation', checked)}
                />
              </FormRow>
              <FormRow label="Enable Renaming" description="Allow users to rename conversations">
                <Switch
                  checked={(formData as any).enableConversationRenaming !== false}
                  onCheckedChange={(checked) => handleChange('enableConversationRenaming', checked)}
                />
              </FormRow>
              <FormRow label="Show New Chat Button" description="Display New Chat button in sidebar">
                <Switch
                  checked={(formData as any).showNewChatButton !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, showNewChatButton: checked } as any)}
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {/* Header Styling */}
        <AccordionItem value="header-styling" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Styling</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <FormSection>
              <FormRow label="Background Color" description="Header background color or image">
                <ColorInput
                  value={formData.headerBgColor || '#1e40af'}
                  onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                  allowImageVideo={true}
                  className="relative"
                  placeholder="#1e40af"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Text Color" description="Header text color">
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
          </AccordionContent>
        </AccordionItem>

        {/* Header Border */}
        <AccordionItem value="header-border" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Border</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <FormSection>
              <FormRow label="Show Header Border" description="Display border under header">
                <Switch
                  checked={(formData as any).headerBorderEnabled !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, headerBorderEnabled: checked } as any)}
                />
              </FormRow>
              {(formData as any).headerBorderEnabled !== false && (
                <FormRow label="Border Color" description="Color of the header border">
                  <ColorInput
                    value={(formData as any).headerBorderColor || '#e5e7eb'}
                    onChange={(color) => setFormData({ ...formData, headerBorderColor: color } as any)}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#e5e7eb"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
              )}
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {/* History Panel Settings */}
        <AccordionItem value="history-panel" className="border-b border-border/50 px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">History Panel Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <FormSection>
              <FormRow label="Show History Panel" description="Enable the chat history panel/sidebar">
                <Switch
                  checked={(formData as any).chatkitOptions?.history?.enabled !== false}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...(formData as any).chatkitOptions,
                      history: {
                        ...(formData as any).chatkitOptions?.history,
                        enabled: checked
                      }
                    }
                  } as any)}
                />
              </FormRow>
              {(formData as any).chatkitOptions?.history?.enabled !== false && (
                <>
                  <FormRow label="Allow Thread Deletion" description="Show delete action for threads">
                    <Switch
                      checked={(formData as any).chatkitOptions?.history?.showDelete !== false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...(formData as any).chatkitOptions,
                          history: {
                            ...(formData as any).chatkitOptions?.history,
                            showDelete: checked
                          }
                        }
                      } as any)}
                    />
                  </FormRow>
                  <FormRow label="Allow Thread Renaming" description="Show rename action for threads">
                    <Switch
                      checked={(formData as any).chatkitOptions?.history?.showRename !== false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...(formData as any).chatkitOptions,
                          history: {
                            ...(formData as any).chatkitOptions?.history,
                            showRename: checked
                          }
                        }
                      } as any)}
                    />
                  </FormRow>
                </>
              )}
            </FormSection>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
