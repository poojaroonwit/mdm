'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Maximize2, Palette, Square, Sun, Move, Layers, Upload, X } from 'lucide-react'

import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { FormRow, FormSection } from '../components/FormRow'

interface ChatWindowSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatWindowSection({ formData, setFormData }: ChatWindowSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Chat Window</h3>
      </div>
      <AccordionSectionWrapper defaultValue="size">
        <AccordionSectionGroup id="size" title="Size" icon={Maximize2} defaultOpen>
          <FormSection>
            <FormRow label="Width" description="Width of the chat window">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowWidth)}
                  onChange={(e) => setFormData({ ...formData, chatWindowWidth: ensurePx(e.target.value) })}
                  placeholder="380"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Height" description="Height of the chat window">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowHeight)}
                  onChange={(e) => setFormData({ ...formData, chatWindowHeight: ensurePx(e.target.value) })}
                  placeholder="600"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="background" title="Background & Colors" icon={Palette}>
          <FormSection>
            <FormRow label="Background" description="Background color or image for the chat window">
              <ColorInput
                value={formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, messageBoxColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Header Logo" description="Logo shown in the chat window header">
              <div className="space-y-2">
                {(formData as any).logo && (
                  <div className="relative group w-fit">
                    <img
                      src={(formData as any).logo}
                      alt="Logo preview"
                      className="h-10 object-contain border rounded bg-white shadow-sm px-2"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' } as any)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  id="chat-window-logo-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const loadingToast = toast.loading('Uploading logo...')
                    const fd = new FormData()
                    fd.append('image', file)
                    try {
                      const res = await fetch('/api/upload/logo', { method: 'POST', body: fd })
                      if (res.ok) {
                        const data = await res.json()
                        setFormData({ ...formData, logo: data.url } as any)
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
                  onClick={() => document.getElementById('chat-window-logo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </FormRow>
            <FormRow label="Background Blur" description="Glassmorphism blur effect (0-100%)">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={(formData as any).chatWindowBackgroundBlur ?? 0}
                  onChange={(e) => setFormData({ ...formData, chatWindowBackgroundBlur: parseInt(e.target.value) || 0 } as any)}
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
                  value={(formData as any).chatWindowBackgroundOpacity ?? 100}
                  onChange={(e) => setFormData({ ...formData, chatWindowBackgroundOpacity: parseInt(e.target.value) || 100 } as any)}
                  placeholder="100"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders" icon={Square}>
          <FormSection>
            <FormRow label="Border Color" description="Color of the window border">
              <ColorInput
                value={formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, chatWindowBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Width of the window border">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="chatWindowBorderWidth"
                defaultValue={formData.borderWidth || '1px'}
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Roundness of window corners">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="chatWindowBorderRadius"
                defaultValue={formData.borderRadius || '8px'}
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="shadow" title="Shadow" icon={Sun}>
          <FormSection>
            <FormRow label="Shadow Color" description="Color of the window shadow">
              <ColorInput
                value={formData.chatWindowShadowColor || formData.shadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, chatWindowShadowColor: color })}
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
                  value={extractNumericValue(formData.chatWindowShadowBlur || formData.shadowBlur)}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowBlur: ensurePx(e.target.value) })}
                  placeholder="4"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="padding" title="Padding" icon={Move}>
          <FormSection>
            <FormRow label="Window Padding" description="Inner padding of the chat window">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="chatWindowPadding"
                defaultValue="0px"
                type="sides"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="overlay" title="Overlay (When Chat is Open)" icon={Layers}>
          <FormSection>
            <FormRow label="Enable Overlay" description="Show an overlay behind the chat window when open">
              <Switch
                checked={(formData as any).overlayEnabled ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, overlayEnabled: checked } as any)}
              />
            </FormRow>
            {(formData as any).overlayEnabled && (
              <>
                <FormRow label="Overlay Color" description="Background color of the overlay">
                  <ColorInput
                    value={(formData as any).overlayColor || '#000000'}
                    onChange={(color) => setFormData({ ...formData, overlayColor: color } as any)}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#000000"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </FormRow>
                <FormRow label="Overlay Opacity" description="Overlay transparency (0-100%)">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={(formData as any).overlayOpacity ?? 50}
                      onChange={(e) => setFormData({ ...formData, overlayOpacity: parseInt(e.target.value) || 50 } as any)}
                      placeholder="50"
                      className="pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                </FormRow>
                <FormRow label="Overlay Blur" description="Glassmorphism blur effect (0-100%)">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={(formData as any).overlayBlur ?? 0}
                      onChange={(e) => setFormData({ ...formData, overlayBlur: parseInt(e.target.value) || 0 } as any)}
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                </FormRow>
              </>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
