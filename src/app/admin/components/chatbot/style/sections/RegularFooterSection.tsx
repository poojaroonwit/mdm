'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { useEffect } from 'react'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { SectionGroup } from '../components/SectionGroup'
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
  }, []) // Only run once on mount

  // Migrate sendButtonRounded to border radius if needed
  useEffect(() => {
    if (formData.sendButtonRounded && !formData.sendButtonBorderRadius &&
      !formData.sendButtonBorderRadiusTopLeft && !formData.sendButtonBorderRadiusTopRight &&
      !formData.sendButtonBorderRadiusBottomRight && !formData.sendButtonBorderRadiusBottomLeft) {
      setFormData((prev) => ({
        ...prev,
        sendButtonBorderRadius: '9999px', // Fully rounded
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Footer/Input Area</h3>
      </div>
      <div className="pt-2">
        <SectionGroup title="Background & Padding" isFirst>
          <FormSection>
            <FormRow label="Background Color" description="Background color of the footer area">
              <ColorInput
                value={formData.footerBgColor || formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, footerBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Footer Padding" description="Padding around the footer area">
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
        </SectionGroup>

        <SectionGroup title="Footer Borders">
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
        </SectionGroup>

        <SectionGroup title="Input Field Styling">
          <FormSection>
            <FormRow label="Background Color" description="Background of the input field">
              <ColorInput
                value={formData.footerInputBgColor || formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, footerInputBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Text color in the input field">
              <ColorInput
                value={formData.footerInputFontColor || formData.fontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, footerInputFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Color" description="Color of the input border">
              <ColorInput
                value={formData.footerInputBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, footerInputBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Width of the input border">
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
        </SectionGroup>

        <SectionGroup title="Send Button Styling">
          <FormSection>
            <FormRow label="Button Icon" description="Icon displayed on the send button">
              <Select
                value={formData.sendButtonIcon || 'Send'}
                onValueChange={(v) => setFormData({ ...formData, sendButtonIcon: v })}
              >
                <SelectTrigger>
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
            <FormRow label="Background Color" description="Button background color">
              <ColorInput
                value={formData.sendButtonBgColor || formData.primaryColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, sendButtonBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Icon Color" description="Color of the send icon">
              <ColorInput
                value={formData.sendButtonIconColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, sendButtonIconColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Width" description="Width of send button (defaults to match height)">
              <Input
                type="text"
                value={formData.sendButtonWidth || ''}
                onChange={(e) => setFormData({ ...formData, sendButtonWidth: e.target.value })}
                placeholder="40px"
              />
            </FormRow>
            <FormRow label="Height" description="Height of send button (defaults to 40px)">
              <Input
                type="text"
                value={formData.sendButtonHeight || ''}
                onChange={(e) => setFormData({ ...formData, sendButtonHeight: e.target.value })}
                placeholder="40px"
              />
            </FormRow>
            <FormRow label="Position" description="Position relative to input field">
              <Select
                value={formData.sendButtonPosition || 'outside'}
                onValueChange={(v: string) => setFormData({ ...formData, sendButtonPosition: v as 'inside' | 'outside' })}
              >
                <SelectTrigger>
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
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </FormRow>
            <FormRow label="Padding" description="Internal button padding">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="sendButtonPadding"
                defaultValue="8px"
                type="sides"
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="File Upload Layout">
          <FormSection>
            <FormRow label="Button Order" description="Order of attach, input, and send buttons">
              <Select
                value={formData.fileUploadLayout || 'attach-first'}
                onValueChange={(v: string) => setFormData({ ...formData, fileUploadLayout: v as 'attach-first' | 'input-first' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attach-first">[Attach] [Input] [Send]</SelectItem>
                  <SelectItem value="input-first">[Input] [Attach] [Send]</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </SectionGroup>
      </div>
    </div>
  )
}

