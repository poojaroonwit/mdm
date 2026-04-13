'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { PaddingInput } from '../components/PaddingInput'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { FormRow, FormSection } from '../components/FormRow'
import { MessageSquare, Type, User, Sparkles, Settings, Bot, Search, Brain, Zap, Star, Heart, Smile, Users, HelpCircle, Lightbulb, Rocket, Target, TrendingUp, UserCircle, UserCheck, UserPlus } from 'lucide-react'
import * as Icons from 'lucide-react'

interface MessagesSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function MessagesSection({ formData, setFormData }: MessagesSectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Customize the appearance and behavior of messages for both the bot and the user.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="bot-styling">
        {/* Bot Message Styling */}
        <AccordionSectionGroup id="bot-styling" title="Bot Message Styling" icon={MessageSquare} defaultOpen>
          <FormSection>
            <FormRow label="Background" description="Bot message background color">
              <ColorInput
                value={formData.botMessageBackgroundColor || '#f3f4f6'}
                onChange={(color) => setFormData({ ...formData, botMessageBackgroundColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#f3f4f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Bot message text color">
              <ColorInput
                value={formData.botMessageFontColor || formData.fontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, botMessageFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Family" description="Bot message font family">
              <Input
                value={formData.botMessageFontFamily || formData.fontFamily || 'Inter'}
                onChange={(e) => setFormData({ ...formData, botMessageFontFamily: e.target.value })}
                placeholder="Inter"
                className="h-8 text-xs font-mono"
              />
            </FormRow>
            <FormRow label="Font Size" description="Bot message font size">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.botMessageFontSize || formData.fontSize || '14px')}
                  onChange={(e) => setFormData({ ...formData, botMessageFontSize: ensurePx(e.target.value) })}
                  placeholder="14"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Padding" description="Bot message padding">
              <PaddingInput
                formData={formData}
                setFormData={setFormData}
                label=""
              />
            </FormRow>
            <FormRow label="Border Color" description="Bot bubble border color">
              <ColorInput
                value={formData.botBubbleBorderColor || formData.bubbleBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, botBubbleBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Bot bubble border width">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="botBubbleBorderWidth"
                defaultValue={formData.bubbleBorderWidth || formData.borderWidth || '1px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Bot bubble border radius">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="botBubbleBorderRadius"
                defaultValue={formData.bubbleBorderRadius || formData.borderRadius || '8px'}
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        {/* Bot Avatar Settings */}
        <AccordionSectionGroup id="bot-avatar" title="Bot Avatar" icon={User}>
          <FormSection>
            <FormRow label="Avatar Type" description="Icon or custom image">
              <Select
                value={formData.avatarType || 'icon'}
                onValueChange={(v: any) => setFormData({ ...formData, avatarType: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icon">Icon</SelectItem>
                  <SelectItem value="image">Upload Image</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            {formData.avatarType === 'icon' ? (
              <>
                <FormRow label="Avatar Icon" description="Select bot avatar icon">
                  <Select
                    value={formData.avatarIcon || 'Bot'}
                    onValueChange={(v) => setFormData({ ...formData, avatarIcon: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {['Bot', 'MessageSquare', 'Sparkles', 'Brain', 'Zap', 'Star', 'Heart', 'Smile', 'User', 'Users', 'HelpCircle', 'Lightbulb', 'Rocket', 'Target', 'TrendingUp'].map((iconName) => {
                        const IconComponent = (Icons as any)[iconName] || Icons.Bot
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{iconName}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Icon Color" description="Color of the icon inside the avatar">
                  <ColorInput
                    value={formData.avatarIconColor || '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, avatarIconColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Background Color" description="Background color of the avatar circle">
                  <ColorInput
                    value={formData.avatarBackgroundColor || '#1e40af'}
                    onChange={(color) => setFormData({ ...formData, avatarBackgroundColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#1e40af"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
              </>
            ) : (
              <FormRow label="Upload Image" description="Upload image for bot avatar">
                <Input
                  type="file"
                  accept="image/*"
                  className="h-8 text-xs file:text-xs file:bg-muted"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string
                      setFormData({ ...formData, avatarImageUrl: url })
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>

        {/* Typing Indicator & Thinking Message */}
        <AccordionSectionGroup id="typing-thinking" title="Typing Indicator & Thinking" icon={Sparkles}>
          <FormSection>
            <FormRow label="Indicator Style" description="Animation style for typing indicator">
              <Select
                value={formData.typingIndicatorStyle || 'spinner'}
                onValueChange={(v: any) => setFormData({ ...formData, typingIndicatorStyle: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spinner">Spinner</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Indicator Color" description="Color of the typing indicator">
              <ColorInput
                value={formData.typingIndicatorColor || '#6b7280'}
                onChange={(color) => setFormData({ ...formData, typingIndicatorColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#6b7280"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Show Thinking Message" description="Display 'Thinking...' text like OpenAI">
              <Switch
                checked={(formData as any).showThinkingMessage ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, showThinkingMessage: checked } as any)}
              />
            </FormRow>
            {(formData as any).showThinkingMessage && (
              <FormRow label="Thinking Text" description="Custom text to display while thinking">
                <Input
                  value={(formData as any).thinkingMessageText || 'Thinking...'}
                  onChange={(e) => setFormData({ ...formData, thinkingMessageText: e.target.value } as any)}
                  placeholder="Thinking..."
                  className="h-8 text-xs"
                />
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>

        {/* Display Options */}
        <AccordionSectionGroup id="display-options" title="Display Options" icon={Settings}>
          <FormSection>
            <FormRow label="Show Message Name" description="Display name above messages">
              <Switch
                checked={formData.showMessageName !== undefined ? formData.showMessageName : false}
                onCheckedChange={(checked) => setFormData({ ...formData, showMessageName: checked })}
              />
            </FormRow>
            {formData.showMessageName && (
              <>
                <FormRow label="Message Name" description="Default is chatbot name">
                  <Input
                    value={formData.messageName || ''}
                    onChange={(e) => setFormData({ ...formData, messageName: e.target.value })}
                    placeholder="Leave empty to use chatbot name"
                    className="h-8 text-xs"
                  />
                </FormRow>
                <FormRow label="Name Position" description="Where to display the message name">
                  <Select
                    value={formData.messageNamePosition || 'top-of-message'}
                    onValueChange={(v: string) => setFormData({ ...formData, messageNamePosition: v as 'top-of-message' | 'top-of-avatar' | 'right-of-avatar' })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-of-message">Top of Message</SelectItem>
                      <SelectItem value="top-of-avatar">Top of Avatar</SelectItem>
                      <SelectItem value="right-of-avatar">Right of Avatar</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
              </>
            )}
            <FormRow label="Show Message Avatar" description="Display avatar before messages">
              <Switch
                checked={formData.showMessageAvatar !== undefined ? formData.showMessageAvatar : true}
                onCheckedChange={(checked) => setFormData({ ...formData, showMessageAvatar: checked })}
              />
            </FormRow>
            {formData.showMessageAvatar !== false && (
              <FormRow label="Avatar Position" description="Bot message avatar placement">
                <Select
                  value={formData.messageAvatarPosition || 'top-of-message'}
                  onValueChange={(v: string) => setFormData({ ...formData, messageAvatarPosition: v as 'top-of-message' | 'left-of-message' })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-of-message">Top of Message</SelectItem>
                    <SelectItem value="left-of-message">Left of Message</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>

        {/* User Message Styling */}
        <AccordionSectionGroup id="user-styling" title="User Message Styling" icon={UserCircle}>
          <FormSection>
            <FormRow label="Background" description="User message background color">
              <ColorInput
                value={formData.userMessageBackgroundColor || formData.primaryColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, userMessageBackgroundColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="User message text color">
              <ColorInput
                value={formData.userMessageFontColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, userMessageFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Family" description="User message font family">
              <Input
                value={formData.userMessageFontFamily || formData.fontFamily || 'Inter'}
                onChange={(e) => setFormData({ ...formData, userMessageFontFamily: e.target.value })}
                placeholder="Inter"
                className="h-8 text-xs font-mono"
              />
            </FormRow>
            <FormRow label="Font Size" description="User message font size">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.userMessageFontSize || formData.fontSize || '14px')}
                  onChange={(e) => setFormData({ ...formData, userMessageFontSize: ensurePx(e.target.value) })}
                  placeholder="14"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Padding" description="User message padding">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="userBubblePadding"
                defaultValue={formData.bubblePadding || '12px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Color" description="User bubble border color">
              <ColorInput
                value={formData.userBubbleBorderColor || formData.bubbleBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, userBubbleBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="User bubble border width">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="userBubbleBorderWidth"
                defaultValue={formData.bubbleBorderWidth || formData.borderWidth || '1px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="User bubble border radius">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="userBubbleBorderRadius"
                defaultValue={formData.bubbleBorderRadius || formData.borderRadius || '8px'}
                type="corners"
              />
            </FormRow>
            <FormRow label="Show User Avatar" description="Avatar for user messages">
              <Switch
                checked={formData.showUserAvatar !== undefined ? formData.showUserAvatar : (formData.showMessageAvatar !== undefined ? formData.showMessageAvatar : true)}
                onCheckedChange={(checked) => setFormData({ ...formData, showUserAvatar: checked })}
              />
            </FormRow>
            {formData.showUserAvatar !== false && (
              <>
                <FormRow label="Avatar Type" description="Icon or custom image">
                  <Select
                    value={formData.userAvatarType || 'icon'}
                    onValueChange={(v: any) => setFormData({ ...formData, userAvatarType: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">Icon</SelectItem>
                      <SelectItem value="image">Upload Image</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                {formData.userAvatarType === 'icon' ? (
                  <>
                    <FormRow label="User Icon" description="Select user avatar icon">
                      <Select
                        value={formData.userAvatarIcon || 'User'}
                        onValueChange={(v) => setFormData({ ...formData, userAvatarIcon: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {['User', 'Users', 'UserCircle', 'UserCheck', 'UserPlus', 'Smile', 'Heart', 'Star', 'Zap', 'MessageSquare', 'Bot', 'HelpCircle', 'Lightbulb', 'Rocket', 'Target'].map((iconName) => {
                            const IconComponent = (Icons as any)[iconName] || Icons.User
                            return (
                              <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{iconName}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </FormRow>
                    <FormRow label="Icon Color" description="User avatar icon color">
                      <ColorInput
                        value={formData.userAvatarIconColor || '#6b7280'}
                        onChange={(color) => setFormData({ ...formData, userAvatarIconColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#6b7280"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </FormRow>
                    <FormRow label="Background Color" description="User avatar background color">
                      <ColorInput
                        value={formData.userAvatarBackgroundColor || '#e5e7eb'}
                        onChange={(color) => setFormData({ ...formData, userAvatarBackgroundColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#e5e7eb"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </FormRow>
                  </>
                ) : (
                  <FormRow label="Upload Image" description="Upload image for user avatar">
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-8 text-xs file:text-xs file:bg-muted"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string
                          setFormData({ ...formData, userAvatarImageUrl: url })
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </FormRow>
                )}
              </>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
