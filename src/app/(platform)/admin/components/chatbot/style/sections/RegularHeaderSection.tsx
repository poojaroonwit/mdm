'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { ChevronsUpDown, Layout, Image, Palette, Square, Box, Settings, Upload, X, Bot } from 'lucide-react'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { FormRow, FormSection } from '../components/FormRow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'

interface RegularHeaderSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  chatkitOptions?: any
}

export function RegularHeaderSection({ formData, setFormData }: RegularHeaderSectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the main header area of the chat widget, including titles, logos, and actions.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="title">
        <AccordionSectionGroup id="title" title="Title & Description" icon={Layout} defaultOpen>
          <FormSection>
            <FormRow label="Show Title" description="Display title in header">
              <Switch
                checked={formData.headerShowTitle !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowTitle: checked })}
              />
            </FormRow>
            {formData.headerShowTitle !== false && (
              <FormRow label="Title" description="Text displayed in header">
                <Input
                  value={formData.headerTitle || ''}
                  onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
                  placeholder="Chat Assistant"
                  className="h-8 text-xs font-medium"
                />
              </FormRow>
            )}
            <FormRow label="Description" description="Subtitle text below title">
              <Input
                value={formData.headerDescription || ''}
                onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                placeholder="How can I help you?"
                className="h-8 text-xs"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="logo" title="Logo & Avatar" icon={Image}>
          <FormSection>
            <FormRow label="Show Logo" description="Display logo in header">
              <Switch
                checked={formData.headerShowLogo || false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowLogo: checked })}
              />
            </FormRow>
            {formData.headerShowLogo && (
              <FormRow label="Logo Image" description="Header logo image">
                <div className="space-y-2">
                  {formData.headerLogo && (
                    <div className="relative group w-fit">
                      <img
                        src={formData.headerLogo}
                        alt="Logo preview"
                        className="h-10 object-contain border rounded bg-white shadow-sm px-2"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, headerLogo: '' })}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    id="header-logo-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const loadingToast = toast.loading('Uploading logo...')
                      const fd = new FormData()
                      fd.append('logo', file)
                      try {
                        const res = await fetch('/api/upload/logo', { method: 'POST', body: fd })
                        if (res.ok) {
                          const data = await res.json()
                          setFormData({ ...formData, headerLogo: data.url })
                          toast.success('Logo uploaded', { id: loadingToast })
                        } else {
                          toast.error('Upload failed', { id: loadingToast })
                        }
                      } catch {
                        toast.error('Upload failed', { id: loadingToast })
                      } finally {
                        e.target.value = ''
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-dashed"
                    onClick={() => document.getElementById('header-logo-upload')?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </FormRow>
            )}
            <FormRow label="Show Avatar" description="Display avatar in header">
              <Switch
                checked={formData.headerShowAvatar || false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowAvatar: checked })}
              />
            </FormRow>
            {formData.headerShowAvatar && (
              <>
                <FormRow label="Avatar Type" description="Icon or custom image">
                  <Select
                    value={formData.headerAvatarType || 'icon'}
                    onValueChange={(v: any) => setFormData({ ...formData, headerAvatarType: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">Icon</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                {formData.headerAvatarType === 'image' ? (
                  <FormRow label="Avatar Image" description="Header avatar image">
                    <div className="space-y-2">
                      {formData.headerAvatarImageUrl && (
                        <div className="relative group w-fit">
                          <img
                            src={formData.headerAvatarImageUrl}
                            alt="Avatar preview"
                            className="h-12 w-12 object-cover border rounded-full bg-white shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, headerAvatarImageUrl: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        id="header-avatar-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const loadingToast = toast.loading('Uploading avatar...')
                          const fd = new FormData()
                          fd.append('image', file)
                          try {
                            const res = await fetch('/api/upload/widget-avatar', { method: 'POST', body: fd })
                            if (res.ok) {
                              const data = await res.json()
                              setFormData({ ...formData, headerAvatarImageUrl: data.url })
                              toast.success('Avatar uploaded', { id: loadingToast })
                            } else {
                              toast.error('Upload failed', { id: loadingToast })
                            }
                          } catch {
                            toast.error('Upload failed', { id: loadingToast })
                          } finally {
                            e.target.value = ''
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-dashed"
                        onClick={() => document.getElementById('header-avatar-upload')?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        Upload Avatar
                      </Button>
                    </div>
                  </FormRow>
                ) : (
                  <>
                    <FormRow label="Avatar Icon" description="Icon for header avatar">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between h-8 text-xs">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const iconName = formData.headerAvatarIcon || 'Bot'
                                const Icon = (Icons as any)[iconName] || Bot
                                return <Icon className="h-4 w-4" />
                              })()}
                              <span>{formData.headerAvatarIcon || 'Bot'}</span>
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-4" align="start">
                          <IconPicker
                            value={formData.headerAvatarIcon || 'Bot'}
                            onChange={(v) => setFormData({ ...formData, headerAvatarIcon: v })}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormRow>
                    <FormRow label="Icon Color" description="Color of avatar icon">
                      <ColorInput
                        value={formData.headerAvatarIconColor || '#ffffff'}
                        onChange={(color) => setFormData({ ...formData, headerAvatarIconColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#ffffff"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </FormRow>
                    <FormRow label="Avatar Background" description="Background of avatar">
                      <ColorInput
                        value={formData.headerAvatarBackgroundColor || '#1e40af'}
                        onChange={(color) => setFormData({ ...formData, headerAvatarBackgroundColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#1e40af"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </FormRow>
                  </>
                )}
              </>
            )}
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="colors" title="Colors & Font" icon={Palette}>
          <FormSection>
            <FormRow label="Background" description="Background color of header">
              <ColorInput
                value={formData.headerBgColor || '#1e40af'}
                onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Text color in header">
              <ColorInput
                value={formData.headerFontColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, headerFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Family" description="Font family for header text">
              <Select
                value={formData.headerFontFamily || 'inherit'}
                onValueChange={(v) => setFormData({ ...formData, headerFontFamily: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Inherit (Default)</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="border" title="Border" icon={Square}>
          <FormSection>
            <FormRow label="Show Border" description="Display bottom border on header">
              <Switch
                checked={formData.headerBorderEnabled || false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerBorderEnabled: checked })}
              />
            </FormRow>
            {formData.headerBorderEnabled && (
              <FormRow label="Border Color" description="Color of header border">
                <ColorInput
                  value={formData.headerBorderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, headerBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="padding" title="Padding" icon={Box}>
          <FormSection>
            <FormRow label="Header Padding" description="Internal spacing of header">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="headerPadding"
                defaultValue="16px"
                type="sides"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="buttons" title="Buttons" icon={Settings}>
          <FormSection>
            <FormRow label="Show Close Button" description="Display close button">
              <Switch
                checked={formData.headerShowCloseButton !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowCloseButton: checked })}
              />
            </FormRow>
            <FormRow label="Show Clear Session" description="Display clear session button">
              <Switch
                checked={formData.headerShowClearSession || false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowClearSession: checked })}
              />
            </FormRow>
            {formData.headerShowCloseButton !== false && (
              <>
                <FormRow label="Button Bg" description="Background of close button">
                  <ColorInput
                    value={formData.headerCloseButtonBackgroundColor || 'transparent'}
                    onChange={(color) => setFormData({ ...formData, headerCloseButtonBackgroundColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="transparent"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Icon Color" description="Color of close icon">
                  <ColorInput
                    value={formData.headerCloseButtonIconColor || '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, headerCloseButtonIconColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Hover Bg" description="Hover background color">
                  <ColorInput
                    value={formData.headerCloseButtonHoverBackgroundColor || 'rgba(255,255,255,0.2)'}
                    onChange={(color) => setFormData({ ...formData, headerCloseButtonHoverBackgroundColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="rgba(255,255,255,0.2)"
                    inputClassName="h-7 text-xs pl-7 w-full"
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
