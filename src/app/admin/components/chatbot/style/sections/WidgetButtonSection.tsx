'use client'

import toast from 'react-hot-toast'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Eye, Palette, Square, Sun, Tag, Settings, ChevronsUpDown, Upload } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Widget Button</h3>
      </div>
      <AccordionSectionWrapper defaultValue="appearance">
        <AccordionSectionGroup id="appearance" title="Appearance" icon={Eye} defaultOpen>
          <FormSection>
            <FormRow label="Avatar Style" description="Shape of the widget button container">
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
                <SelectTrigger>
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
              <FormRow label="Avatar Image" description="Upload a custom image for the widget button">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      {((formData as any).widgetAvatarImageUrl || formData.avatarImageUrl) && (
                        <div className="relative group">
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
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            id="avatar-upload"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return

                              // Show loading toast
                              const loadingToast = toast.loading('Uploading avatar...')

                              try {
                                const formDataUpload = new FormData()
                                formDataUpload.append('image', file)

                                const response = await fetch('/api/upload/widget-avatar', {
                                  method: 'POST',
                                  body: formDataUpload,
                                })

                                if (!response.ok) {
                                  throw new Error('Upload failed')
                                }

                                const data = await response.json()
                                
                                setFormData({ 
                                  ...formData, 
                                  widgetAvatarImageUrl: data.url 
                                } as any)
                                
                                toast.success('Avatar uploaded successfully', { id: loadingToast })
                              } catch (error) {
                                console.error('Upload error:', error)
                                toast.error('Failed to upload avatar', { id: loadingToast })
                              } finally {
                                // Reset input
                                e.target.value = ''
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                          >
                            <Icons.Upload className="h-4 w-4 mr-2" />
                            Upload Trigger Image
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Recommended size: 256x256px. Shown when the chat is <strong>closed</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Close State Image (shown when chat is open) */}
                    <div className="flex gap-4 items-start pt-2 border-t border-dashed">
                      {(formData as any).widgetCloseImageUrl && (
                        <div className="relative group">
                          <img
                            src={(formData as any).widgetCloseImageUrl}
                            alt="Widget close avatar preview"
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
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            id="close-avatar-upload"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return

                              const loadingToast = toast.loading('Uploading close avatar...')

                              try {
                                const formDataUpload = new FormData()
                                formDataUpload.append('image', file)

                                const response = await fetch('/api/upload/widget-avatar', {
                                  method: 'POST',
                                  body: formDataUpload,
                                })

                                if (!response.ok) throw new Error('Upload failed')

                                const data = await response.json()
                                
                                setFormData({ 
                                  ...formData, 
                                  widgetCloseImageUrl: data.url 
                                } as any)
                                
                                toast.success('Close avatar uploaded successfully', { id: loadingToast })
                              } catch (error) {
                                console.error('Upload error:', error)
                                toast.error('Failed to upload close avatar', { id: loadingToast })
                              } finally {
                                e.target.value = ''
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => document.getElementById('close-avatar-upload')?.click()}
                          >
                            <Icons.Upload className="h-4 w-4 mr-2" />
                            Upload Close Image
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Recommended size: 256x256px. Shown when the chat is <strong>open</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
              </FormRow>
            )}

            {formData.widgetAvatarStyle !== 'custom' && ((formData as any).widgetAvatarType === 'icon' || (!(formData as any).widgetAvatarType && (formData.avatarType === 'icon' || !formData.avatarType))) && (
              <FormRow label="Avatar Icon" description="Select bot avatar icon">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-8 text-xs">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const iconName = (formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot'
                          const Icon = (Icons as any)[iconName] || Icons.Bot
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


            <FormRow label="Widget Position" description="Where the widget appears on screen">
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
            <FormRow label="Popover Position" description="Position of chat window relative to widget button">
              <Select
                value={formData.popoverPosition || 'left'}
                onValueChange={(v: any) => setFormData({ ...formData, popoverPosition: v })}
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
            <FormRow label="Widget-Popover Margin" description="Spacing between widget button and popover window">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMargin)}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                  placeholder="10"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Popover Left Margin" description="Extra space on the left side of the open popover window">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMarginLeft || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMarginLeft: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Popover Right Margin" description="Extra space on the right side of the open popover window">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMarginRight || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMarginRight: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
        <AccordionSectionGroup id="size-colors" title="Size & Colors" icon={Palette}>
          <FormSection>
            <FormRow label="Widget Size" description="Size of the widget button">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetSize)}
                  onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
                  placeholder="60"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Widget Background (Closed)" description="Background color or image when chat is closed">
              <ColorInput
                value={formData.widgetBackgroundColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Widget Background (Open)" description="Background color or image when chat is open">
              <ColorInput
                value={formData.widgetOpenBackgroundColor || ''}
                onChange={(color) => setFormData({ ...formData, widgetOpenBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="Leave empty to use closed background"
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
            <FormRow label="Widget Padding" description="Internal spacing of the widget button">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="widgetPadding"
                defaultValue="0px"
                type="sides"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders" icon={Square}>
          <FormSection>
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
            <FormRow label="Border Width" description="Width of the widget border">
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
        </AccordionSectionGroup>

        <AccordionSectionGroup id="shadow" title="Shadow" icon={Sun}>
          <FormSection>
            <FormRow label="Shadow Color" description="Color of the widget shadow">
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
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Offset X" description="Horizontal shadow offset">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowX || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowX: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Offset Y" description="Vertical shadow offset">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowY || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowY: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Spread" description="Shadow spread radius (positive expands, negative contracts)">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowSpread || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowSpread: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <AccordionSectionGroup id="label" title="Label" icon={Tag}>
            <FormSection>
              <FormRow label="Label Text" description="Text displayed on the widget">
                <Input
                  value={formData.widgetLabelText}
                  onChange={(e) => setFormData({ ...formData, widgetLabelText: e.target.value })}
                  placeholder="Chat"
                />
              </FormRow>
              <FormRow label="Label Color" description="Text color of the label">
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
                <FormRow label="Icon Position" description="Position of icon relative to label">
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
              <FormRow label="Widget Shape" description="Shape of the label widget">
                <Select
                  value={(formData as any).widgetLabelShape || 'rounded'}
                  onValueChange={(v: any) => {
                    const shapeValues: Record<string, string> = {
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
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="pill">Pill (Full Rounded)</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              {(formData as any).widgetLabelShape === 'custom' && (
                <FormRow label="Custom Radius" description="Custom border radius value">
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
          </AccordionSectionGroup>
        )}

        <AccordionSectionGroup id="behavior" title="Widget Behavior" icon={Settings}>
          <FormSection>
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
            <FormRow label="Z-Index" description="Stack order of the widget">
              <Input
                type="number"
                value={formData.widgetZIndex || 9999}
                onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 })}
                placeholder="9999"
              />
            </FormRow>
            <FormRow label="Auto Open Chat" description="Automatically open chat window on page load">
              <Switch
                checked={formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true}
                onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShow: checked })}
              />
            </FormRow>
            {formData.widgetAutoShow && (
              <FormRow label="Auto Show Delay" description="Delay in seconds before auto-opening">
                <Input
                  type="number"
                  value={formData.widgetAutoShowDelay || 0}
                  onChange={(e) => setFormData({ ...formData, widgetAutoShowDelay: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min={0}
                />
              </FormRow>
            )}
            <FormRow label="Horizontal Offset" description="Distance from screen edge (X axis)">
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
            <FormRow label="Vertical Offset" description="Distance from screen edge (Y axis)">
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
            <FormRow label="Notification Badge" description="Display unread message count badge">
              <Switch
                checked={formData.showNotificationBadge || false}
                onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
              />
            </FormRow>
            {formData.showNotificationBadge && (
              <FormRow label="Badge Color" description="Color of the notification badge">
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
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
