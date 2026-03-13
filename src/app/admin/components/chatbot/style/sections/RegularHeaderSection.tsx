'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { ChevronsUpDown } from 'lucide-react'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { SectionGroup } from '../components/SectionGroup'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Header</h3>
      </div>
      <div className="pt-2">
        <SectionGroup title="Title & Description" isFirst>
          <FormSection>
            <FormRow label="Show Title" description="Display the title in the header">
              <Switch
                checked={formData.headerShowTitle !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowTitle: checked })}
              />
            </FormRow>
            {formData.headerShowTitle !== false && (
              <FormRow label="Title" description="Text displayed in the header">
                <Input
                  value={formData.headerTitle || ''}
                  onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
                  placeholder="Chat Assistant"
                />
              </FormRow>
            )}
            <FormRow label="Description" description="Subtitle text below the title">
              <Input
                value={formData.headerDescription || ''}
                onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                placeholder="How can I help you?"
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Logo & Avatar">
          <FormSection>
            <FormRow label="Show Logo" description="Display a logo in the header">
              <Switch
                checked={formData.headerShowLogo || false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerShowLogo: checked })}
              />
            </FormRow>
            {formData.headerShowLogo && (
              <FormRow label="Logo" description="Header logo image">
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
                        <Icons.X className="h-3 w-3" />
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
                    className="w-full"
                    onClick={() => document.getElementById('header-logo-upload')?.click()}
                  >
                    <Icons.Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </FormRow>
            )}
            <FormRow label="Show Avatar" description="Display an avatar in the header">
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
                    <SelectTrigger>
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
                            <Icons.X className="h-3 w-3" />
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
                        className="w-full"
                        onClick={() => document.getElementById('header-avatar-upload')?.click()}
                      >
                        <Icons.Upload className="h-4 w-4 mr-2" />
                        Upload Avatar
                      </Button>
                    </div>
                  </FormRow>
                ) : (
                  <>
                    <FormRow label="Avatar Icon" description="Icon for the header avatar">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between h-8 text-xs">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const iconName = formData.headerAvatarIcon || 'Bot'
                                const Icon = (Icons as any)[iconName] || Icons.Bot
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
                    <FormRow label="Icon Color" description="Color of the avatar icon">
                      <ColorInput
                        value={formData.headerAvatarIconColor || '#ffffff'}
                        onChange={(color) => setFormData({ ...formData, headerAvatarIconColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#ffffff"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </FormRow>
                    <FormRow label="Avatar Background" description="Background color of the avatar">
                      <ColorInput
                        value={formData.headerAvatarBackgroundColor || '#3b82f6'}
                        onChange={(color) => setFormData({ ...formData, headerAvatarBackgroundColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#3b82f6"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </FormRow>
                  </>
                )}
              </>
            )}
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Colors & Font">
          <FormSection>
            <FormRow label="Background Color" description="Background color of the header">
              <ColorInput
                value={formData.headerBgColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Text color in the header">
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
                <SelectTrigger>
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
        </SectionGroup>

        <SectionGroup title="Border">
          <FormSection>
            <FormRow label="Show Border" description="Display bottom border on header">
              <Switch
                checked={formData.headerBorderEnabled || false}
                onCheckedChange={(checked) => setFormData({ ...formData, headerBorderEnabled: checked })}
              />
            </FormRow>
            {formData.headerBorderEnabled && (
              <FormRow label="Border Color" description="Color of the header border">
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
        </SectionGroup>

        <SectionGroup title="Padding">
          <FormSection>
            <FormRow label="Header Padding" description="Internal spacing of the header">
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
        </SectionGroup>

        <SectionGroup title="Buttons">
          <FormSection>
            <FormRow label="Show Close Button" description="Display close button in header">
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
                <FormRow label="Close Button Background" description="Background color of close button">
                  <ColorInput
                    value={formData.headerCloseButtonBackgroundColor || 'transparent'}
                    onChange={(color) => setFormData({ ...formData, headerCloseButtonBackgroundColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="transparent"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Close Button Icon Color" description="Icon color of close button">
                  <ColorInput
                    value={formData.headerCloseButtonIconColor || '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, headerCloseButtonIconColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Close Button Hover Background" description="Hover background color">
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
        </SectionGroup>
      </div>
    </div>
  )
}
