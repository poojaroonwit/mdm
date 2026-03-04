'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Palette, Bot, Maximize, Square, Sun, Tag, Move, Settings, Bell } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { SectionProps } from './types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'
import { ChevronsUpDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { FormRow, FormSection } from '../components/FormRow'

export function WidgetSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const [openItem, setOpenItem] = useState('appearance')

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the widget button that appears when using popover or popup-center deployment types.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(val) => setOpenItem(val as string)}
      >
        <AccordionItem value="appearance" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Avatar Style" description="Shape of the widget button">
                <Select
                  value={formData.widgetAvatarStyle || 'circle'}
                  onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarStyle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="circle-with-label">Label</SelectItem>
                    <SelectItem value="custom">Custom / Image Only</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Widget Position" description="Screen position of the widget">
                <Select
                  value={formData.widgetPosition || 'bottom-right'}
                  onValueChange={(v: any) => setFormData({ ...formData, widgetPosition: v })}
                >
                  <SelectTrigger>
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
              <FormRow label="Popover Position" description="Position of chat relative to widget">
                <Select
                  value={(formData as any).popoverPosition || 'left'}
                  onValueChange={(v: any) => setFormData({ ...formData, popoverPosition: v } as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left of Widget</SelectItem>
                    <SelectItem value="top">Top of Widget</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Popover Margin" description="Spacing between widget and popover">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetPopoverMargin)}
                    onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                    placeholder="10"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="behavior" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Behavior
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Entrance Animation" description="Animation when widget appears">
                <Select
                  value={formData.widgetAnimationEntry || (formData.widgetAnimation === 'none' ? undefined : formData.widgetAnimation === 'slide' ? 'slide-up' : formData.widgetAnimation === 'bounce' ? 'scale' : formData.widgetAnimation || 'fade') || 'fade'}
                  onValueChange={(v: any) => {
                    const updates: any = { widgetAnimationEntry: v }
                    // Clear old widgetAnimation field if it exists
                    if (formData.widgetAnimation) {
                      updates.widgetAnimation = undefined
                    }
                    setFormData({ ...formData, ...updates })
                  }}
                >
                  <SelectTrigger>
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
              <FormRow label="Z-Index" description="Stacking order on page">
                <Input
                  type="number"
                  value={formData.widgetZIndex || 9999}
                  onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 })}
                  placeholder="9999"
                />
              </FormRow>
              <FormRow label="Auto Open Desktop" description="Auto-open chat on desktop">
                <Switch
                  checked={formData.widgetAutoShowDesktop !== undefined ? formData.widgetAutoShowDesktop : (formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true)}
                  onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShowDesktop: checked, widgetAutoShow: checked })}
                />
              </FormRow>
              <FormRow label="Auto Open Mobile" description="Auto-open chat on mobile">
                <Switch
                  checked={formData.widgetAutoShowMobile || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShowMobile: checked })}
                />
              </FormRow>
              {formData.widgetAutoShow && (
                <FormRow label="Auto Open Delay" description="Seconds before auto-opening">
                  <Input
                    type="number"
                    value={formData.widgetAutoShowDelay || 0}
                    onChange={(e) => setFormData({ ...formData, widgetAutoShowDelay: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min={0}
                  />
                </FormRow>
              )}
              <FormRow label="Notification Badge" description="Show unread message count">
                <Switch
                  checked={formData.showNotificationBadge || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
                />
              </FormRow>
              {formData.showNotificationBadge && (
                <FormRow label="Badge Color" description="Color of notification badge">
                  <ColorInput
                    value={formData.notificationBadgeColor || '#ef4444'}
                    onChange={(color) => setFormData({ ...formData, notificationBadgeColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ef4444"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
              )}
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="avatar-icon" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Avatar/Icon
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <div className="mb-6 space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Avatar (Closed State)</h4>
                <FormRow label="Type" description="Icon or custom image">
                  <Select
                    value={(formData as any).widgetAvatarType || formData.avatarType || 'icon'}
                    onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarType: v } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">Icon</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                
                {((formData as any).widgetAvatarType === 'icon' || (!(formData as any).widgetAvatarType && formData.avatarType !== 'image')) ? (
                  <FormRow label="Icon" description="Shown when chat is closed">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {(() => {
                            const iconName = (formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot';
                            const IconComp = (Icons as any)[iconName] || Icons.Bot;
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
                  <FormRow label="Image" description="Shown when chat is closed">
                    <div className="flex gap-4 items-start w-full">
                      {((formData as any).widgetAvatarImageUrl || formData.avatarImageUrl) && (
                        <div className="relative group shrink-0">
                          <img
                            src={(formData as any).widgetAvatarImageUrl || formData.avatarImageUrl}
                            alt="Widget avatar preview"
                            className="h-20 w-20 object-cover border rounded-full bg-white shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, widgetAvatarImageUrl: '' } as any)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icons.X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2 min-w-0">
                        <Input
                          value={(formData as any).widgetAvatarImageUrl || formData.avatarImageUrl || ''}
                          onChange={(e) => setFormData({ ...formData, widgetAvatarImageUrl: e.target.value } as any)}
                          placeholder="https://example.com/avatar.png"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            id="widget-avatar-upload-main"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const formDataUpload = new FormData()
                              formDataUpload.append('image', file)
                              try {
                                const response = await fetch('/api/upload/widget-avatar', {
                                  method: 'POST',
                                  body: formDataUpload,
                                })
                                if (response.ok) {
                                  const data = await response.json()
                                  setFormData({ ...formData, widgetAvatarImageUrl: data.url } as any)
                                }
                              } catch (err) {
                                console.error('Upload failed', err)
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={() => document.getElementById('widget-avatar-upload-main')?.click()}
                          >
                            <Icons.Upload className="h-3.5 w-3.5 mr-1.5" />
                            Upload Image
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Recommended size: 256x256px
                        </p>
                      </div>
                    </div>
                  </FormRow>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Close Avatar (Open State)</h4>
                <FormRow label="Type" description="Icon or custom image">
                  <Select
                    value={(formData as any).widgetCloseAvatarType || 'icon'}
                    onValueChange={(v: any) => setFormData({ ...formData, widgetCloseAvatarType: v } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">Icon</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>

                {((formData as any).widgetCloseAvatarType === 'icon' || !(formData as any).widgetCloseAvatarType) ? (
                  <FormRow label="Icon" description="Shown when chat is open">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {(() => {
                            const iconName = (formData as any).widgetCloseAvatarIcon || 'X';
                            const IconComp = (Icons as any)[iconName] || Icons.X;
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
                          value={(formData as any).widgetCloseAvatarIcon || 'X'}
                          onChange={(v) => setFormData({ ...formData, widgetCloseAvatarIcon: v } as any)}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormRow>
                ) : (
                  <FormRow label="Image" description="Shown when chat is open">
                    <div className="flex gap-4 items-start w-full">
                      {(formData as any).widgetCloseImageUrl && (
                        <div className="relative group shrink-0">
                          <img
                            src={(formData as any).widgetCloseImageUrl}
                            alt="Widget close preview"
                            className="h-20 w-20 object-cover border rounded-full bg-white shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, widgetCloseImageUrl: '' } as any)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icons.X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2 min-w-0">
                        <Input
                          value={(formData as any).widgetCloseImageUrl || ''}
                          onChange={(e) => setFormData({ ...formData, widgetCloseImageUrl: e.target.value } as any)}
                          placeholder="https://example.com/close-avatar.png"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            id="widget-close-upload-main"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const formDataUpload = new FormData()
                              formDataUpload.append('image', file)
                              try {
                                const response = await fetch('/api/upload/widget-avatar', {
                                  method: 'POST',
                                  body: formDataUpload,
                                })
                                if (response.ok) {
                                  const data = await response.json()
                                  setFormData({ ...formData, widgetCloseImageUrl: data.url } as any)
                                }
                              } catch (err) {
                                console.error('Upload failed', err)
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={() => document.getElementById('widget-close-upload-main')?.click()}
                          >
                            <Icons.Upload className="h-3.5 w-3.5 mr-1.5" />
                            Upload Close Image
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Recommended size: 256x256px
                        </p>
                      </div>
                    </div>
                  </FormRow>
                )}
              </div>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="size-colors" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              Size & Colors
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Widget Size" description="Size of the widget button">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.widgetSize)}
                    onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
                    placeholder="60"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Background" description="Color or image for the widget">
                <ColorInput
                  value={formData.widgetBackgroundColor || '#3b82f6'}
                  onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
                  allowImageVideo={true}
                  className="relative"
                  placeholder="#3b82f6"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Background Blur" description="Glassmorphism blur effect (0-100%)">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={(formData as any).widgetBackgroundBlur ?? 0}
                    onChange={(e) => setFormData({ ...formData, widgetBackgroundBlur: parseInt(e.target.value) || 0 } as any)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                </div>
              </FormRow>
              <FormRow label="Background Opacity" description="Background transparency (0-100%)">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={(formData as any).widgetBackgroundOpacity ?? 100}
                    onChange={(e) => setFormData({ ...formData, widgetBackgroundOpacity: parseInt(e.target.value) || 100 } as any)}
                    placeholder="100"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="borders" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Borders
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Border Color" description="Color of the widget border">
                <ColorInput
                  value={formData.widgetBorderColor || '#ffffff'}
                  onChange={(color) => setFormData({ ...formData, widgetBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Border Width" description="Width of widget border">
                <MultiSideInput
                  formData={formData}
                  setFormData={setFormData}
                  label=""
                  baseKey="widgetBorderWidth"
                  defaultValue="2px"
                  type="sides"
                />
              </FormRow>
              <FormRow label="Border Radius" description="Roundness of widget corners">
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shadow" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Shadow
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Shadow Color" description="Color of widget shadow">
                <ColorInput
                  value={formData.widgetShadowColor || '#000000'}
                  onChange={(color) => setFormData({ ...formData, widgetShadowColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Shadow Blur" description="Blur radius of the shadow">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.widgetShadowBlur)}
                    onChange={(e) => setFormData({ ...formData, widgetShadowBlur: ensurePx(e.target.value) })}
                    placeholder="8"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Offset X" description="Horizontal shadow offset">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetShadowX || '0px')}
                    onChange={(e) => setFormData({ ...formData, widgetShadowX: ensurePx(e.target.value) } as any)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Offset Y" description="Vertical shadow offset">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetShadowY || '0px')}
                    onChange={(e) => setFormData({ ...formData, widgetShadowY: ensurePx(e.target.value) } as any)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Shadow Spread" description="Shadow spread radius">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetShadowSpread || '0px')}
                    onChange={(e) => setFormData({ ...formData, widgetShadowSpread: ensurePx(e.target.value) } as any)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <AccordionItem value="label" className="border-b px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Label
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <FormSection className="pt-2 pb-4">
                <FormRow label="Label Text" description="">
                  <Input
                    value={formData.widgetLabelText}
                    onChange={(e) => setFormData({ ...formData, widgetLabelText: e.target.value })}
                    placeholder="Chat"
                  />
                </FormRow>
                <FormRow label="Label Color" description="">
                  <ColorInput
                    value={formData.widgetLabelColor || '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, widgetLabelColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-8 text-xs pl-7"
                  />
                </FormRow>
                <FormRow label="Show Icon" description="Display icon next to the label text">
                  <Switch
                    checked={formData.widgetLabelShowIcon !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, widgetLabelShowIcon: checked })}
                  />
                </FormRow>
                {formData.widgetLabelShowIcon !== false && (
                  <FormRow label="Icon Position" description="">
                    <Select
                      value={formData.widgetLabelIconPosition || 'left'}
                      onValueChange={(v: any) => setFormData({ ...formData, widgetLabelIconPosition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left of Label</SelectItem>
                        <SelectItem value="right">Right of Label</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormRow>
                )}
                <FormRow label="Widget Shape" description="">
                  <Select
                    value={(formData as any).widgetLabelShape || 'rounded'}
                    onValueChange={(v: any) => {
                      const shapeValues: Record<string, string> = {
                        'rectangular': '0px',
                        'rounded': '8px',
                        'pill': '9999px',
                        'circle': '50%',
                        'custom': (formData as any).widgetLabelBorderRadius || '8px'
                      }
                      setFormData({
                        ...formData,
                        widgetLabelShape: v,
                        widgetLabelBorderRadius: shapeValues[v]
                      } as any)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangular">Rectangular</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="pill">Pill (Full Rounded)</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                {((formData as any).widgetLabelShape === 'custom' || (formData as any).widgetLabelShape === 'rounded') && (
                  <FormRow label="Border Radius" description="">
                    <div className="relative">
                      <Input
                        type="number"
                        value={extractNumericValue((formData as any).widgetLabelBorderRadius || '8px')}
                        onChange={(e) => setFormData({ ...formData, widgetLabelBorderRadius: ensurePx(e.target.value) } as any)}
                        placeholder="8"
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
                    </div>
                  </FormRow>
                )}
              </FormSection>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="position" className="border-b-0 px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Offset X" description="Horizontal offset from position">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.widgetOffsetX)}
                    onChange={(e) => setFormData({ ...formData, widgetOffsetX: ensurePx(e.target.value) })}
                    placeholder="20"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
                </div>
              </FormRow>
              <FormRow label="Offset Y" description="Vertical offset from position">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.widgetOffsetY)}
                    onChange={(e) => setFormData({ ...formData, widgetOffsetY: ensurePx(e.target.value) })}
                    placeholder="20"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
