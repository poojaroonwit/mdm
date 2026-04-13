'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Eye, Palette, Square, Sun, Tag, Settings, ChevronsUpDown, Upload, X, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { MultiSideInput } from '../components/MultiSideInput'
import { FormRow, FormSection } from '../components/FormRow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'

interface WidgetButtonSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function WidgetButtonSection({ formData, setFormData }: WidgetButtonSectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the floating button that launches the chat, including custom icons, images, and positioning.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="appearance">
        <AccordionSectionGroup id="appearance" title="Appearance" icon={Eye} defaultOpen>
          <FormSection>
            <FormRow label="Avatar Style" description="Shape of the widget button container">
              <Select
                value={formData.widgetAvatarStyle || 'circle'}
                onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarStyle: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded-diagonal">Rounded Diagonal</SelectItem>
                  <SelectItem value="circle-with-label">Circle with Label</SelectItem>
                  <SelectItem value="custom">Custom / Image Only</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Avatar Type" description="Content of the widget button">
              <Select
                value={(formData as any).widgetAvatarType || formData.avatarType || 'icon'}
                onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarType: v } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icon">Icon</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>

            {((formData as any).widgetAvatarType === 'image' || (!(formData as any).widgetAvatarType && formData.avatarType === 'image')) && (
              <FormRow label="Button Images" description="Custom images for open/closed states">
                  <div className="space-y-4">
                    {/* Trigger (Closed) Image */}
                    <div className="flex gap-4 items-start">
                      {((formData as any).widgetAvatarImageUrl || formData.avatarImageUrl) && (
                        <div className="relative group shrink-0">
                          <img
                            src={(formData as any).widgetAvatarImageUrl || formData.avatarImageUrl}
                            alt="Widget trigger preview"
                            className="h-14 w-14 object-cover border rounded bg-white shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, widgetAvatarImageUrl: '' } as any)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full h-8 text-xs border-dashed"
                          onClick={() => document.getElementById('trigger-avatar-upload')?.click()}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Upload Trigger (Closed)
                        </Button>
                        <input type="file" id="trigger-avatar-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const loadingToast = toast.loading('Uploading trigger image...');
                          const fd = new FormData(); fd.append('image', file);
                          try {
                            const res = await fetch('/api/upload/widget-avatar', { method: 'POST', body: fd });
                            if (res.ok) { const data = await res.json(); setFormData({ ...formData, widgetAvatarImageUrl: data.url } as any); toast.success('Trigger uploaded', { id: loadingToast }); }
                            else toast.error('Upload failed', { id: loadingToast });
                          } catch { toast.error('Upload failed', { id: loadingToast }); }
                        }} />
                        <p className="text-[10px] text-muted-foreground mt-1">Shown when chat is closed</p>
                      </div>
                    </div>

                    {/* Close (Open) Image */}
                    <div className="flex gap-4 items-start pt-2 border-t border-dashed border-border/50">
                      {(formData as any).widgetCloseImageUrl && (
                        <div className="relative group shrink-0">
                          <img
                            src={(formData as any).widgetCloseImageUrl}
                            alt="Widget close preview"
                            className="h-14 w-14 object-cover border rounded bg-white shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, widgetCloseImageUrl: '' } as any)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full h-8 text-xs border-dashed"
                          onClick={() => document.getElementById('close-avatar-upload')?.click()}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Upload Close (Open)
                        </Button>
                        <input type="file" id="close-avatar-upload" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const loadingToast = toast.loading('Uploading close image...');
                          const fd = new FormData(); fd.append('image', file);
                          try {
                            const res = await fetch('/api/upload/widget-avatar', { method: 'POST', body: fd });
                            if (res.ok) { const data = await res.json(); setFormData({ ...formData, widgetCloseImageUrl: data.url } as any); toast.success('Close icon uploaded', { id: loadingToast }); }
                            else toast.error('Upload failed', { id: loadingToast });
                          } catch { toast.error('Upload failed', { id: loadingToast }); }
                        }} />
                        <p className="text-[10px] text-muted-foreground mt-1">Shown when chat is open</p>
                      </div>
                    </div>
                  </div>
              </FormRow>
            )}

            {formData.widgetAvatarStyle !== 'custom' && ((formData as any).widgetAvatarType === 'icon' || (!(formData as any).widgetAvatarType && (formData.avatarType === 'icon' || !formData.avatarType))) && (
              <FormRow label="Avatar Icon" description="Icon for the widget button">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-8 text-xs">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const iconName = (formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot'
                          const Icon = (Icons as any)[iconName] || Bot
                          return <Icon className="h-4 w-4" />
                        })()}
                        <span>{(formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot'}</span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-4" align="start">
                    <IconPicker
                      value={(formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot'}
                      onChange={(v) => setFormData({ ...formData, widgetAvatarIcon: v } as any)}
                    />
                  </PopoverContent>
                </Popover>
              </FormRow>
            )}

            <FormRow label="Position" description="Where the widget appears on screen">
              <Select
                value={formData.widgetPosition || 'bottom-right'}
                onValueChange={(v: any) => setFormData({ ...formData, widgetPosition: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="size-colors" title="Size & Colors" icon={Palette}>
          <FormSection>
            <FormRow label="Widget Size" description="Diameter of the button">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetSize)}
                  onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
                  placeholder="60"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Background" description="Button color or image (Closed)">
              <ColorInput
                value={formData.widgetBackgroundColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Active Background" description="Background color when open">
              <ColorInput
                value={formData.widgetOpenBackgroundColor || ''}
                onChange={(color) => setFormData({ ...formData, widgetOpenBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="Inherit from closed"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Glass Blur" description="Glassmorphism blur strength">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={(formData as any).widgetBackgroundBlur ?? 0}
                  onChange={(e) => setFormData({ ...formData, widgetBackgroundBlur: parseInt(e.target.value) || 0 } as any)}
                  placeholder="0"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders" icon={Square}>
          <FormSection>
            <FormRow label="Border Color" description="Color of the button border">
              <ColorInput
                value={formData.widgetBorderColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, widgetBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Thickness of the border">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="widgetBorderWidth"
                defaultValue="2px"
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Corner roundness">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="widgetBorderRadius"
                defaultValue="50px"
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="shadow" title="Shadow & Depth" icon={Sun}>
          <FormSection>
            <FormRow label="Shadow Color" description="Color of the button shadow">
              <ColorInput
                value={formData.widgetShadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, widgetShadowColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Shadow Blur" description="Radius of the shadow">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetShadowBlur)}
                  onChange={(e) => setFormData({ ...formData, widgetShadowBlur: ensurePx(e.target.value) })}
                  placeholder="8"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <AccordionSectionGroup id="label" title="Text Label" icon={Tag}>
            <FormSection>
              <FormRow label="Label Text" description="Text displayed on the button">
                <Input
                  value={formData.widgetLabelText}
                  onChange={(e) => setFormData({ ...formData, widgetLabelText: e.target.value })}
                  placeholder="Chat with us"
                  className="h-8 text-xs"
                />
              </FormRow>
              <FormRow label="Label Color" description="Color of the label text">
                <ColorInput
                  value={formData.widgetLabelColor || '#ffffff'}
                  onChange={(color) => setFormData({ ...formData, widgetLabelColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Show Icon" description="Display icon in label">
                <Switch
                  checked={formData.widgetLabelShowIcon !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, widgetLabelShowIcon: checked })}
                />
              </FormRow>
            </FormSection>
          </AccordionSectionGroup>
        )}

        <AccordionSectionGroup id="behavior" title="Widget Behavior" icon={Settings}>
          <FormSection>
            <FormRow label="Auto Open" description="Launch chat on page load">
              <Switch
                checked={formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true}
                onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShow: checked })}
              />
            </FormRow>
            {formData.widgetAutoShow && (
              <FormRow label="Open Delay" description="Seconds before auto-opening">
                <Input
                  type="number"
                  value={formData.widgetAutoShowDelay || 0}
                  onChange={(e) => setFormData({ ...formData, widgetAutoShowDelay: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="h-8 text-xs"
                  min={0}
                />
              </FormRow>
            )}
            <FormRow label="Screen X Offset" description="Distance from horizontal edge">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetX)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetX: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Screen Y Offset" description="Distance from vertical edge">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetY)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetY: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Unread Badge" description="Show unread message bubble">
              <Switch
                checked={formData.showNotificationBadge || false}
                onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
