'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { Box, Square, Type, Send, Layout, Paperclip, ArrowRight, Zap, Check, ArrowUp, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { FormRow, FormSection } from '../components/FormRow'

interface RegularFooterSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularFooterSection({ formData, setFormData }: RegularFooterSectionProps) {
  // Migrate sendButtonPaddingX/Y to individual sides if needed
  useEffect(() => {
    if ((formData.sendButtonPaddingX || formData.sendButtonPaddingY) &&
      !formData.sendButtonPaddingTop && !formData.sendButtonPaddingRight &&
      !formData.sendButtonPaddingBottom && !formData.sendButtonPaddingLeft) {
      const y = formData.sendButtonPaddingY || '8px'
      const x = formData.sendButtonPaddingX || '8px'
      setFormData((prev) => ({
        ...prev,
        sendButtonPaddingTop: y,
        sendButtonPaddingRight: x,
        sendButtonPaddingBottom: y,
        sendButtonPaddingLeft: x,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Migrate sendButtonRounded to border radius if needed
  useEffect(() => {
    if (formData.sendButtonRounded && !formData.sendButtonBorderRadius &&
      !formData.sendButtonBorderRadiusTopLeft && !formData.sendButtonBorderRadiusTopRight &&
      !formData.sendButtonBorderRadiusBottomRight && !formData.sendButtonBorderRadiusBottomLeft) {
      setFormData((prev) => ({
        ...prev,
        sendButtonBorderRadius: '9999px',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Customize the input area and footer of the chat widget, including button styles and field appearance.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="bg-padding">
        <AccordionSectionGroup id="bg-padding" title="Background & Padding" icon={Box} defaultOpen>
          <FormSection>
            <FormRow label="Background" description="Footer area background color">
              <ColorInput
                value={formData.footerBgColor || formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, footerBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Padding" description="Padding around the footer area">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="footerPadding"
                defaultValue="16px"
                type="sides"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Footer Borders" icon={Square}>
          <FormSection>
            <FormRow label="Border Color" description="Color of the footer border">
              <ColorInput
                value={formData.footerBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, footerBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Width of the footer border">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="footerBorderWidth"
                defaultValue={formData.borderWidth || '1px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Roundness of footer corners">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="footerBorderRadius"
                defaultValue="0px"
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="input-styling" title="Input Field Styling" icon={Type}>
          <FormSection>
            <FormRow label="Background" description="Background of input field">
              <ColorInput
                value={formData.footerInputBgColor || formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, footerInputBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Text color in input field">
              <ColorInput
                value={formData.footerInputFontColor || formData.fontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, footerInputFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Color" description="Color of input border">
              <ColorInput
                value={formData.footerInputBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, footerInputBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Width of input border">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="footerInputBorderWidth"
                defaultValue={formData.borderWidth || '1px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Roundness of input corners">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="footerInputBorderRadius"
                defaultValue={formData.borderRadius || '8px'}
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="send-button" title="Send Button Styling" icon={Send}>
          <FormSection>
            <FormRow label="Button Icon" description="Icon on send button">
              <Select
                value={formData.sendButtonIcon || 'Send'}
                onValueChange={(v) => setFormData({ ...formData, sendButtonIcon: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {['Send', 'ArrowRight', 'PaperPlane', 'Zap', 'Check', 'ArrowUp', 'ChevronRight'].map((iconName) => {
                    const IconComponent = (Icons as any)[iconName] || Icons.Send
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
            <FormRow label="Background" description="Button background color">
              <ColorInput
                value={formData.sendButtonBgColor || formData.primaryColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, sendButtonBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Icon Color" description="Color of send icon">
              <ColorInput
                value={formData.sendButtonIconColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, sendButtonIconColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Width" description="Standard is matched to height">
              <Input
                type="text"
                value={formData.sendButtonWidth || ''}
                onChange={(e) => setFormData({ ...formData, sendButtonWidth: e.target.value })}
                placeholder="40px"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Height" description="Standard is 40px">
              <Input
                type="text"
                value={formData.sendButtonHeight || ''}
                onChange={(e) => setFormData({ ...formData, sendButtonHeight: e.target.value })}
                placeholder="40px"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Position" description="Relation to input field">
              <Select
                value={formData.sendButtonPosition || 'outside'}
                onValueChange={(v: string) => setFormData({ ...formData, sendButtonPosition: v as 'inside' | 'outside' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside">Outside Input</SelectItem>
                  <SelectItem value="inside">Inside Input</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Border Radius" description="Roundness of button corners">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="sendButtonBorderRadius"
                defaultValue={
                  formData.sendButtonRounded
                    ? '9999px'
                    : formData.sendButtonBorderRadius || '8px'
                }
                type="corners"
              />
            </FormRow>
            <FormRow label="Shadow Color" description="Color of button shadow">
              <ColorInput
                value={formData.sendButtonShadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, sendButtonShadowColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Shadow Blur" description="Blur amount for shadow">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.sendButtonShadowBlur || '0px')}
                  onChange={(e) => setFormData({ ...formData, sendButtonShadowBlur: ensurePx(e.target.value) })}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="layout" title="File Upload Layout" icon={Layout}>
          <FormSection>
            <FormRow label="Button Order" description="Order of attach, input, and send">
              <Select
                value={formData.fileUploadLayout || 'attach-first'}
                onValueChange={(v: string) => setFormData({ ...formData, fileUploadLayout: v as 'attach-first' | 'input-first' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attach-first">[Attach] [Input] [Send]</SelectItem>
                  <SelectItem value="input-first">[Input] [Attach] [Send]</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
