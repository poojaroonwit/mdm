'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { ChevronsUpDown, User, Upload, X, Bot } from 'lucide-react'
import type { Chatbot } from '../../types'
import { FormRow, FormSection } from '../components/FormRow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

interface RegularAvatarSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularAvatarSection({ formData, setFormData }: RegularAvatarSectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Customize the bot's avatar appearance in the chat interface.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="avatar">
        <AccordionSectionGroup id="avatar" title="Bot Avatar" icon={User} defaultOpen>
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
                <FormRow label="Icon" description="Select bot avatar icon">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-8 text-xs">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const iconName = formData.avatarIcon || 'Bot'
                            const Icon = (Icons as any)[iconName] || Bot
                            return <Icon className="h-4 w-4" />
                          })()}
                          <span>{formData.avatarIcon || 'Bot'}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-4" align="start">
                      <IconPicker
                        value={formData.avatarIcon || 'Bot'}
                        onChange={(v) => setFormData({ ...formData, avatarIcon: v })}
                      />
                    </PopoverContent>
                  </Popover>
                </FormRow>

                <FormRow label="Icon Color" description="Avatar icon color">
                  <ColorInput
                    value={formData.avatarIconColor || '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, avatarIconColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Background" description="Avatar background color">
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
              <FormRow label="Avatar Image" description="Custom bot image">
                <div className="space-y-2">
                  <div className="flex gap-4 items-start">
                    {formData.avatarImageUrl && (
                      <div className="relative group shrink-0">
                        <img
                          src={formData.avatarImageUrl}
                          alt="Avatar preview"
                          className="h-16 w-16 object-cover border rounded-full bg-white shadow-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarImageUrl: '' })}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        id="regular-avatar-upload"
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
                              setFormData({ ...formData, avatarImageUrl: data.url })
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
                        onClick={() => document.getElementById('regular-avatar-upload')?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        Upload Image
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">Recommended: 256×256px</p>
                    </div>
                  </div>
                </div>
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
