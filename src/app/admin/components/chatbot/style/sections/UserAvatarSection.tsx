'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../../types'
import { FormRow, FormSection } from '../components/FormRow'

interface UserAvatarSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function UserAvatarSection({ formData, setFormData }: UserAvatarSectionProps) {
  return (
    <AccordionItem value="user-avatar" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        User Avatar
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <FormSection>
          <FormRow label="Show User Avatar" description="Display avatar for user messages">
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
                  <SelectTrigger>
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
                  <FormRow label="User Icon" description="Select icon for user avatar">
                    <Select
                      value={formData.userAvatarIcon || 'User'}
                      onValueChange={(v) => setFormData({ ...formData, userAvatarIcon: v })}
                    >
                      <SelectTrigger>
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
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </FormRow>
                  <FormRow label="Background Color" description="Avatar background color">
                    <ColorInput
                      value={formData.userAvatarBackgroundColor || '#e5e7eb'}
                      onChange={(color) => setFormData({ ...formData, userAvatarBackgroundColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </FormRow>
                </>
              ) : (
                <FormRow label="Avatar Image" description="Custom user avatar image">
                  <div className="space-y-2">
                    {formData.userAvatarImageUrl && (
                      <div className="relative group w-fit">
                        <img
                          src={formData.userAvatarImageUrl}
                          alt="User avatar preview"
                          className="h-12 w-12 object-cover border rounded-full bg-white shadow-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, userAvatarImageUrl: '' })}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icons.X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      id="user-avatar-upload"
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
                            setFormData({ ...formData, userAvatarImageUrl: data.url })
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
                      onClick={() => document.getElementById('user-avatar-upload')?.click()}
                    >
                      <Icons.Upload className="h-4 w-4 mr-2" />
                      Upload Avatar
                    </Button>
                  </div>
                </FormRow>
              )}
            </>
          )}
        </FormSection>
      </AccordionContent>
    </AccordionItem>
  )
}

