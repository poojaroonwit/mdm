'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { Palette, Bot, Maximize, Square, Sun, Move, Settings, Bell, X as IconsX, Upload as IconsUpload, ChevronsUpDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { SectionProps } from './types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'
import { Switch } from '@/components/ui/switch'
import { FormRow, FormSection } from '../components/FormRow'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

export function WidgetSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the floating widget button and its behavior, including positioning, animations, and auto-open settings.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="appearance">
        <AccordionSectionGroup id="appearance" title="Appearance" icon={Palette} defaultOpen>
          <FormSection>
            <FormRow label="Avatar Style" description="Shape of the widget button">
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
                  <SelectItem value="circle-with-label">Label</SelectItem>
                  <SelectItem value="custom">Custom / Image Only</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Popover Location" description="Position relative to widget">
              <Select
                value={(formData as any).popoverPosition || 'left'}
                onValueChange={(v: any) => setFormData({ ...formData, popoverPosition: v } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left of Button</SelectItem>
                  <SelectItem value="top">Top of Button</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Window Margin" description="Gap between button and chat">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMargin)}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                  placeholder="10"
                  className="pr-8 h-8 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="behavior" title="Behavior" icon={Settings}>
          <FormSection>
            <FormRow label="Entrance Effect" description="Animation when appearing">
              <Select
                value={formData.widgetAnimationEntry || (formData.widgetAnimation === 'none' ? undefined : formData.widgetAnimation === 'slide' ? 'slide-up' : formData.widgetAnimation === 'bounce' ? 'scale' : formData.widgetAnimation || 'fade') || 'fade'}
                onValueChange={(v: any) => {
                  const updates: any = { widgetAnimationEntry: v }
                  if (formData.widgetAnimation) updates.widgetAnimation = undefined
                  setFormData({ ...formData, ...updates })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide-up">Slide Up</SelectItem>
                  <SelectItem value="slide-side">Slide Side</SelectItem>
                  <SelectItem value="scale">Scale (Pop)</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Auto-Open" description="Open chat on page load">
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Desktop</span>
                  <Switch
                    checked={formData.widgetAutoShowDesktop !== undefined ? formData.widgetAutoShowDesktop : (formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true)}
                    onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShowDesktop: checked, widgetAutoShow: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Mobile</span>
                  <Switch
                    checked={formData.widgetAutoShowMobile || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShowMobile: checked })}
                  />
                </div>
              </div>
            </FormRow>
            {formData.widgetAutoShow && (
              <FormRow label="Open Delay" description="Seconds before auto-open">
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
            <FormRow label="Unread Badge" description="Show activity bubble">
              <Switch
                checked={formData.showNotificationBadge || false}
                onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="avatar-icon" title="Trigger Assets" icon={Bot}>
          <div className="px-4 pb-6 space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1">Closed State (Trigger)</h4>
              <FormSection>
                <FormRow label="Asset Type" description="">
                  <Select
                    value={(formData as any).widgetAvatarType || formData.avatarType || 'icon'}
                    onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarType: v } as any)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">Standard Icon</SelectItem>
                      <SelectItem value="image">Custom Image</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                
                {((formData as any).widgetAvatarType === 'icon' || (!(formData as any).widgetAvatarType && formData.avatarType !== 'image')) ? (
                  <FormRow label="Select Icon" description="">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-8 text-xs">
                          {(() => {
                            const iconName = (formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot';
                            const IconComp = (Icons as any)[iconName] || Bot;
                            return (
                              <div className="flex items-center gap-2">
                                <IconComp className="h-4 w-4" />
                                <span>{iconName}</span>
                              </div>
                            );
                          })()}
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
                ) : (
                  <FormRow label="Upload Image" description="">
                    <div className="flex gap-4 items-center">
                      {((formData as any).widgetAvatarImageUrl || formData.avatarImageUrl) && (
                        <div className="relative group shrink-0">
                          <img
                            src={(formData as any).widgetAvatarImageUrl || formData.avatarImageUrl}
                            alt="Trigger preview"
                            className="h-10 w-10 object-cover border rounded bg-white"
                          />
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full text-[10px] h-7 border-dashed" onClick={() => document.getElementById('widget-trigger-upload')?.click()}>
                        <IconsUpload className="h-3 w-3 mr-1.5" /> Upload Image
                      </Button>
                      <input type="file" id="widget-trigger-upload" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const ld = toast.loading('Uploading...');
                        const fd = new FormData(); fd.append('image', file);
                        try {
                          const res = await fetch('/api/upload/widget-avatar', { method: 'POST', body: fd });
                          if (res.ok) { const d = await res.json(); setFormData({ ...formData, widgetAvatarImageUrl: d.url } as any); toast.success('Uploaded', { id: ld }); }
                          else toast.error('Failed', { id: ld });
                        } catch { toast.error('Error', { id: ld }); }
                      }} />
                    </div>
                  </FormRow>
                )}
              </FormSection>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1">Open State (Close)</h4>
              <FormSection>
                <FormRow label="Asset Type" description="">
                  <Select
                    value={(formData as any).widgetCloseAvatarType || 'icon'}
                    onValueChange={(v: any) => setFormData({ ...formData, widgetCloseAvatarType: v } as any)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">Standard Icon</SelectItem>
                      <SelectItem value="image">Custom Image</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>

                {((formData as any).widgetCloseAvatarType === 'icon' || !(formData as any).widgetCloseAvatarType) ? (
                  <FormRow label="Select Icon" description="">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-8 text-xs font-mono">
                          {(() => {
                            const iconName = (formData as any).widgetCloseAvatarIcon || 'X';
                            const IconComp = (Icons as any)[iconName] || IconsX;
                            return (
                              <div className="flex items-center gap-2">
                                <IconComp className="h-3.5 w-3.5" />
                                <span>{iconName}</span>
                              </div>
                            );
                          })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-4" align="start">
                        <IconPicker
                          value={(formData as any).widgetCloseAvatarIcon || 'X'}
                          onChange={(v) => setFormData({ ...formData, widgetCloseAvatarIcon: v } as any)}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormRow>
                ) : (
                  <FormRow label="Upload Image" description="">
                    <div className="flex gap-4 items-center">
                      {(formData as any).widgetCloseImageUrl && (
                        <div className="relative group shrink-0">
                          <img src={(formData as any).widgetCloseImageUrl} alt="Close preview" className="h-10 w-10 object-cover border rounded bg-white" />
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full text-[10px] h-7 border-dashed" onClick={() => document.getElementById('widget-close-upload')?.click()}>
                        <IconsUpload className="h-3 w-3 mr-1.5" /> Upload Image
                      </Button>
                      <input type="file" id="widget-close-upload" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const ld = toast.loading('Uploading...');
                        const fd = new FormData(); fd.append('image', file);
                        try {
                          const res = await fetch('/api/upload/widget-avatar', { method: 'POST', body: fd });
                          if (res.ok) { const d = await res.json(); setFormData({ ...formData, widgetCloseImageUrl: d.url } as any); toast.success('Uploaded', { id: ld }); }
                          else toast.error('Failed', { id: ld });
                        } catch { toast.error('Error', { id: ld }); }
                      }} />
                    </div>
                  </FormRow>
                )}
              </FormSection>
            </div>
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="size-colors" title="Theming" icon={Maximize}>
          <FormSection>
            <FormRow label="Widget Size" description="Diameter in pixels">
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
            <FormRow label="Background" description="Button surface color">
              <ColorInput
                value={formData.widgetBackgroundColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Glass Effect" description="Blur and opacity controls">
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={(formData as any).widgetBackgroundBlur ?? 0}
                    onChange={(e) => setFormData({ ...formData, widgetBackgroundBlur: parseInt(e.target.value) || 0 } as any)}
                    placeholder="Blur"
                    className="pr-6 h-7 text-[10px]"
                  />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">B%</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={(formData as any).widgetBackgroundOpacity ?? 100}
                    onChange={(e) => setFormData({ ...formData, widgetBackgroundOpacity: parseInt(e.target.value) || 100 } as any)}
                    placeholder="Opacity"
                    className="pr-6 h-7 text-[10px]"
                  />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">O%</span>
                </div>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders" icon={Square}>
          <FormSection>
            <FormRow label="Border Color" description="">
              <ColorInput
                value={formData.widgetBorderColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, widgetBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="widgetBorderWidth"
                defaultValue="2px"
                type="sides"
              />
            </FormRow>
            <FormRow label="Corner Radius" description="">
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

        <AccordionSectionGroup id="shadow" title="Shadow" icon={Sun}>
          <FormSection>
            <FormRow label="Shadow Color" description="">
              <ColorInput
                value={formData.widgetShadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, widgetShadowColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Shadow Blur" description="">
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

        <AccordionSectionGroup id="screen-position" title="Screen Positioning" icon={Move}>
          <FormSection>
            <FormRow label="Offset X" description="Horizontal spacing">
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
            <FormRow label="Offset Y" description="Vertical spacing">
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
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
