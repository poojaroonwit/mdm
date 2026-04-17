'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Settings, Palette, Type, Layout } from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import type { SectionProps } from './types'

export function ThemeSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const theme = chatkitOptions?.theme || {}

  const updateTheme = (updates: any) => {
    setFormData({
      ...formData,
      chatkitOptions: {
        ...chatkitOptions,
        theme: { ...theme, ...updates }
      }
    } as any)
  }

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Manage the global design system including color schemes, visual density, and specialized branding elements.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="basics">
        <AccordionSectionGroup id="basics" title="Global Styles" icon={Settings} defaultOpen>
          <FormSection>
            <FormRow label="Color Palette" description="System appearance mode">
              <Select
                value={theme.colorScheme || 'light'}
                onValueChange={(v: any) => updateTheme({ colorScheme: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="system">Follow System</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Visual Density" description="Size and spacing of elements">
              <Select
                value={theme.density || 'normal'}
                onValueChange={(v: any) => updateTheme({ density: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Standard</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Corner Style" description="Roundness of UI components">
              <Select
                value={theme.radius || 'round'}
                onValueChange={(v: any) => updateTheme({ radius: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pill">Pill (64px)</SelectItem>
                  <SelectItem value="round">Round (12px)</SelectItem>
                  <SelectItem value="soft">Soft (6px)</SelectItem>
                  <SelectItem value="sharp">Sharp (0px)</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="colors" title="Brand Colors" icon={Palette}>
          <FormSection>
            <FormRow label="Accent Color" description="Primary action and highlight color">
              <ColorInput
                value={theme.color?.accent?.primary || theme.primaryColor || '#1e40af'}
                onChange={(color) => updateTheme({ 
                  color: { ...theme.color, accent: { ...theme.color?.accent, primary: color } },
                  primaryColor: color 
                })}
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Intensity" description="Saturation level (0-4)">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="4"
                  value={theme.color?.accent?.level ?? 2}
                  onChange={(e) => updateTheme({ 
                    color: { ...theme.color, accent: { ...theme.color?.accent, level: parseInt(e.target.value) || 2 } } 
                  })}
                  placeholder="2"
                  className="h-8 text-xs pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground uppercase font-mono">Lvl</span>
              </div>
            </FormRow>
            <FormRow label="Surface background" description="Base page background color">
              <ColorInput
                value={theme.color?.background || theme.backgroundColor || '#ffffff'}
                onChange={(color) => updateTheme({ 
                  color: { ...theme.color, background: color },
                  backgroundColor: color 
                })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Primary Text" description="Default text color (high contrast)">
              <ColorInput
                value={theme.color?.text || theme.textColor || '#000000'}
                onChange={(color) => updateTheme({ 
                  color: { ...theme.color, text: color },
                  textColor: color 
                })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="typography" title="Typography" icon={Type}>
          <FormSection>
            <FormRow label="Primary Font" description="Used for headings and labels">
              <Input
                value={theme.typography?.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => updateTheme({ 
                  typography: { ...theme.typography, fontFamily: e.target.value } 
                })}
                placeholder="Inter, sans-serif"
                className="h-8 text-xs"
              />
            </FormRow>
            <FormRow label="Base Size" description="Default desktop font size">
              <div className="relative">
                <Input
                  type="number"
                  value={parseInt(theme.typography?.fontSize) || 14}
                  onChange={(e) => updateTheme({ 
                    typography: { ...theme.typography, fontSize: `${e.target.value}px` } 
                  })}
                  placeholder="14"
                  className="h-8 text-xs pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="layout" title="Structure" icon={Layout}>
          <FormSection>
            <FormRow label="Glassmorphism" description="Enable blur effects on containers">
              <Switch
                checked={theme.effects?.glassmorphism || false}
                onCheckedChange={(checked) => updateTheme({ 
                  effects: { ...theme.effects, glassmorphism: checked } 
                })}
              />
            </FormRow>
            <FormRow label="Animations" description="Enable smooth UI transitions">
              <Switch
                checked={theme.effects?.animations !== false}
                onCheckedChange={(checked) => updateTheme({ 
                  effects: { ...theme.effects, animations: checked } 
                })}
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
