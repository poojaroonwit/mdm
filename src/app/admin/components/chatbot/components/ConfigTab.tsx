'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, MessageSquare, Zap, Upload, Mic, Settings, Users, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Chatbot } from '../types'
import { extractNumericValue, ensurePx } from '../style/styleUtils'
import {
  ThreadItemActionsSection,
  DisclaimerSection,
  ModelPickerSection,
  PersonaPickerSection,
  StartScreenSection,
  ComposerSection,
  GetStartedSection
} from '../style/sections'

interface ConfigTabProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

// Icon Select Combobox Component with search and icons
function IconSelectCombobox({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)

  // Comprehensive list of Lucide icons
  const iconList = [
    'None', 'Lightbulb', 'Star', 'Search', 'Zap', 'Sparkles', 'BookOpen', 'Compass', 'Globe', 'Mail',
    'Phone', 'User', 'Users', 'Settings', 'Info', 'CheckCircle2', 'Calendar', 'MapPin', 'Plus', 'Edit',
    'Trash2', 'Heart', 'Smile', 'MessageSquare', 'Brain', 'Rocket', 'Target', 'TrendingUp', 'HelpCircle',
    'AlertCircle', 'AlertTriangle', 'Check', 'X', 'XCircle', 'Minus', 'PlusCircle', 'MinusCircle',
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
    'Home', 'Folder', 'File', 'FileText', 'Image', 'Video', 'Music', 'Download', 'Upload', 'Share',
    'Copy', 'Scissors', 'Save', 'Lock', 'Unlock', 'Key', 'Shield', 'Eye', 'EyeOff', 'Bell', 'BellOff',
    'Tag', 'Tags', 'Filter', 'Sliders', 'Grid', 'List', 'Layout', 'Columns', 'Rows', 'Maximize', 'Minimize',
    'RefreshCw', 'RotateCw', 'RotateCcw', 'Repeat', 'Shuffle', 'Play', 'Pause', 'Stop', 'SkipForward', 'SkipBack'
  ]

  const iconOptions = iconList.map(iconName => {
    if (iconName === 'None') {
      return { value: 'none', label: 'None', icon: null }
    }
    const IconComponent = (Icons as any)[iconName]
    const displayName = iconName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
    return {
      value: iconName,
      label: displayName,
      icon: IconComponent
    }
  })

  const selectedOption = iconOptions.find(opt => opt.value === (value || 'none'))
  const SelectedIcon = selectedOption?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
            <span>{selectedOption?.label || 'Select icon...'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[9999]" align="start" sideOffset={5}>
        <Command>
          <CommandInput placeholder="Search icons..." />
          <CommandList>
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup>
              {iconOptions.map((option) => {
                const IconComponent = option.icon
                const isSelected = (value || 'none') === option.value
                const handleSelect = () => {
                  onValueChange(option.value === 'none' ? '' : option.value)
                  setOpen(false)
                }
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.value.toLowerCase(), option.label.toLowerCase()]}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {IconComponent ? (
                      <IconComponent className="mr-2 h-4 w-4" />
                    ) : null}
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ConfigTab({ formData, setFormData }: ConfigTabProps) {
  const [newFollowUpQuestion, setNewFollowUpQuestion] = useState('')
  const [accordionValue, setAccordionValue] = useState<string>('startScreen')
  const chatkitOptions = (formData as any).chatkitOptions || {}
  const engineType = (formData as any).engineType || 'custom'
  const isChatKitEngine = engineType === 'chatkit'
  const isAgentSDK = engineType === 'openai-agent-sdk'

  const addFollowUpQuestion = () => {
    if (newFollowUpQuestion.trim()) {
      setFormData({
        ...formData,
        followUpQuestions: [...(formData.followUpQuestions || []), newFollowUpQuestion.trim()]
      })
      setNewFollowUpQuestion('')
    }
  }

  const removeFollowUpQuestion = (index: number) => {
    const updated = [...(formData.followUpQuestions || [])]
    updated.splice(index, 1)
    setFormData({
      ...formData,
      followUpQuestions: updated
    })
  }

  return (
    <div className="w-full">
      <Tabs defaultValue={isChatKitEngine ? "features" : "conversation"} className="flex w-full gap-6">
        {/* Vertical Sidebar Menu - only show tabs that have content */}
        <TabsList orientation="vertical" className="bg-muted/30 p-1 min-h-[400px] h-fit flex-col justify-start items-stretch gap-1 w-[220px] rounded-lg shrink-0">
          {!isChatKitEngine && (
            <TabsTrigger value="conversation" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </TabsTrigger>
          )}
          {!isChatKitEngine && (
            <TabsTrigger value="prompts" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
              <Zap className="h-4 w-4" />
              Prompts
            </TabsTrigger>
          )}
          <TabsTrigger value="features" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Upload className="h-4 w-4" />
            Features
          </TabsTrigger>
          {!isChatKitEngine && (
            <TabsTrigger value="voice" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
          )}
          {isChatKitEngine && (
            <TabsTrigger value="chatkit" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
              <Settings className="h-4 w-4" />
              ChatKit
            </TabsTrigger>
          )}
          <TabsTrigger value="composer" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Megaphone className="h-4 w-4" />
            Composer
          </TabsTrigger>
        </TabsList>

        {/* Content Area */}
        <div className="flex-1 w-full max-w-[800px]">
          {/* Conversation Tab */}
          <TabsContent value="conversation" className="m-0 mt-0 space-y-4">
            {!isChatKitEngine && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label>Show Start Conversation Message</Label>
                    <p className="text-xs text-muted-foreground">Display an initial greeting message when the chat opens</p>
                  </div>
                  <Switch
                    checked={(formData as any).showStartConversation !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showStartConversation: checked } as any)}
                  />
                </div>

                {(formData as any).showStartConversation !== false && (
                  <div className="space-y-2">
                    <Label>Start Conversation Message</Label>
                    <p className="text-xs text-muted-foreground">
                      Initial message shown when the chat opens.
                    </p>
                    <Textarea
                      value={formData.conversationOpener || (formData as any).openaiAgentSdkGreeting || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({
                          ...formData,
                          conversationOpener: value,
                          ...(isAgentSDK && { openaiAgentSdkGreeting: value })
                        } as any)
                      }}
                      placeholder="Hello! How can I help you today?"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                )}

                <div className="space-y-2 border-t pt-4">
                  <Label>Follow-up Questions</Label>
                  <p className="text-xs text-muted-foreground">Add suggested follow-up questions for users</p>
                  <div className="flex gap-2">
                    <Input
                      value={newFollowUpQuestion}
                      onChange={(e) => setNewFollowUpQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFollowUpQuestion()}
                      placeholder="Enter a follow-up question"
                    />
                    <Button onClick={addFollowUpQuestion}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {(formData.followUpQuestions || []).map((question, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">{question}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFollowUpQuestion(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="m-0 mt-0 space-y-4">
            {!isChatKitEngine && (
              <div className="space-y-4">
                <div>
                  <Label>Start Screen Prompts</Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add quick prompt buttons that appear when the chat starts
                  </p>
                </div>
                <div className="space-y-2">
                  {((formData as any).startScreenPrompts || []).map((prompt: { label?: string; prompt: string; icon?: string }, index: number) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-start">
                        <div className="space-y-1 w-32">
                          <Label className="text-xs">Icon (optional)</Label>
                          <IconSelectCombobox
                            value={prompt.icon || 'none'}
                            onValueChange={(value) => {
                              const prompts = [...((formData as any).startScreenPrompts || [])]
                              prompts[index] = { ...prompts[index], icon: value === 'none' ? undefined : value }
                              setFormData({ ...formData, startScreenPrompts: prompts } as any)
                            }}
                          />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Button Label</Label>
                            <Input
                              value={prompt.label || ''}
                              onChange={(e) => {
                                const prompts = [...((formData as any).startScreenPrompts || [])]
                                prompts[index] = { ...prompts[index], label: e.target.value }
                                setFormData({ ...formData, startScreenPrompts: prompts } as any)
                              }}
                              placeholder="Button Label"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Prompt Text (required)</Label>
                            <Input
                              value={prompt.prompt || ''}
                              onChange={(e) => {
                                const prompts = [...((formData as any).startScreenPrompts || [])]
                                prompts[index] = { ...prompts[index], prompt: e.target.value }
                                setFormData({ ...formData, startScreenPrompts: prompts } as any)
                              }}
                              placeholder="Prompt Text"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const prompts = [...((formData as any).startScreenPrompts || [])]
                            prompts.splice(index, 1)
                            setFormData({ ...formData, startScreenPrompts: prompts } as any)
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
                      const prompts = [...((formData as any).startScreenPrompts || []), { prompt: '', label: '' }]
                      setFormData({ ...formData, startScreenPrompts: prompts } as any)
                    }}
                  >
                    + Add Prompt
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="m-0 mt-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label>Enable File Upload</Label>
                <p className="text-xs text-muted-foreground">Allow users to upload files in chat</p>
              </div>
              <Switch
                checked={formData.enableFileUpload}
                onCheckedChange={(checked) => setFormData({ ...formData, enableFileUpload: checked })}
              />
            </div>
            {!isChatKitEngine && !isAgentSDK && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label>Show Citations and Attributions</Label>
                  <p className="text-xs text-muted-foreground">Display source citations in responses</p>
                </div>
                <Switch
                  checked={formData.showCitations}
                  onCheckedChange={(checked) => setFormData({ ...formData, showCitations: checked })}
                />
              </div>
            )}
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="m-0 mt-0 space-y-4">
            {!isChatKitEngine && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label>Enable Voice Agent</Label>
                    <p className="text-xs text-muted-foreground">Allow users to interact via voice input and hear responses</p>
                  </div>
                  <Switch
                    checked={formData.enableVoiceAgent || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableVoiceAgent: checked })}
                  />
                </div>

                {formData.enableVoiceAgent && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Voice Provider</Label>
                      <Select
                        value={formData.voiceProvider || 'browser'}
                        onValueChange={(value: string) => setFormData({ ...formData, voiceProvider: value as 'browser' | 'openai-realtime' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="browser">Browser Web Speech API</SelectItem>
                          <SelectItem value="openai-realtime">OpenAI Realtime API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Voice UI Style</Label>
                      <Select
                        value={formData.voiceUIStyle || 'chat'}
                        onValueChange={(value: string) => setFormData({ ...formData, voiceUIStyle: value as 'chat' | 'wave' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chat">Chat-like (Current)</SelectItem>
                          <SelectItem value="wave">Wave Animation Background</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.voiceProvider === 'openai-realtime' && (
                      <div className="space-y-4 pt-2 border-t">
                        <h5 className="text-sm font-medium">Realtime Voice Settings</h5>
                        <div className="space-y-2">
                          <Label>Realtime Voice Prompt ID (Optional)</Label>
                          <Input
                            value={(formData as any).openaiAgentSdkRealtimePromptId || ''}
                            onChange={(e) => setFormData({ ...formData, openaiAgentSdkRealtimePromptId: e.target.value } as any)}
                            placeholder="pmpt_..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prompt Version (Optional)</Label>
                          <Input
                            value={(formData as any).openaiAgentSdkRealtimePromptVersion || '1'}
                            onChange={(e) => setFormData({ ...formData, openaiAgentSdkRealtimePromptVersion: e.target.value } as any)}
                            placeholder="1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ChatKit Tab */}
          {isChatKitEngine && (
            <TabsContent value="chatkit" className="m-0 mt-0 space-y-4">
              <h3 className="text-lg font-semibold mb-2">ChatKit Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure ChatKit-specific features and options.
              </p>
              <Accordion type="single" collapsible value={accordionValue} onValueChange={(value) => setAccordionValue(typeof value === 'string' ? value : value[0] || '')}>
                <StartScreenSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
                <ThreadItemActionsSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
                <DisclaimerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
                <ModelPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
                <PersonaPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
                <AccordionItem value="get-started" className="border-b-0 border-border/50 px-4">
                  <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
                    <div className="flex items-center gap-2">
                      <Icons.PlayCircle className="h-4 w-4" />
                      Get Started Popover
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <GetStartedSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          )}

          {/* Composer Tab */}
          <TabsContent value="composer" className="m-0 mt-0">
            <div className="w-full bg-white dark:bg-card rounded-lg border shadow-sm p-0 overflow-hidden">
              <ComposerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
