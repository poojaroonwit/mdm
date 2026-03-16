'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Move, Maximize, Layers, Sun, Settings } from 'lucide-react'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'

export function PopoverSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const [openItem, setOpenItem] = useState('basic-settings')

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the popover container settings for popover deployment type.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(val) => setOpenItem(val as string)}
      >
        <AccordionItem value="position-spacing" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position & Spacing
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Position" description="Position relative to widget button">
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
              <FormRow label="Margin" description="Spacing between widget and popover">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetPopoverMargin || '10px')}
                    onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                    placeholder="10"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Left Margin" description="Extra space on the left side of the open popover window">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetPopoverMarginLeft || '0px')}
                    onChange={(e) => setFormData({ ...formData, widgetPopoverMarginLeft: ensurePx(e.target.value) } as any)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Right Margin" description="Extra space on the right side of the open popover window">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).widgetPopoverMarginRight || '0px')}
                    onChange={(e) => setFormData({ ...formData, widgetPopoverMarginRight: ensurePx(e.target.value) } as any)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="container-size" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              Container Size
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Width" description="Width of the popover chat window">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.chatWindowWidth || '380px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowWidth: ensurePx(e.target.value) })}
                    placeholder="380"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Height" description="Height of the popover chat window">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.chatWindowHeight || '600px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowHeight: ensurePx(e.target.value) })}
                    placeholder="600"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="container-border" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border border-current rounded-sm" />
              Border
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Border Width" description="Width of the container border">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.chatWindowBorderWidth || formData.borderWidth || '1px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowBorderWidth: ensurePx(e.target.value) })}
                    placeholder="1"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Border Radius" description="Roundness of container corners">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.chatWindowBorderRadius || formData.borderRadius || '12px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowBorderRadius: ensurePx(e.target.value) })}
                    placeholder="12"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Border Color" description="Color of the container border">
                <ColorInput
                  value={formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, chatWindowBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="z-index" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Z-Index
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Z-Index" description="Stacking order (higher = on top)">
                <div className="relative">
                  <Input
                    type="number"
                    value={(formData as any).widgetZIndex ?? 9999}
                    onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 } as any)}
                    placeholder="9999"
                  />
                </div>
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
              <FormRow label="Shadow Color" description="Color of the container shadow">
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
                    value={extractNumericValue(formData.chatWindowShadowBlur || formData.shadowBlur || '4px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowShadowBlur: ensurePx(e.target.value) })}
                    placeholder="4"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {/* Basic Theme Settings */}
        <AccordionItem value="basic-settings" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            Basic Settings
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Color Scheme" description="System auto-detects user's preference">
                <Select
                  value={chatkitOptions?.theme?.colorScheme || 'light'}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      theme: {
                        ...chatkitOptions?.theme,
                        colorScheme: v as 'light' | 'dark' | 'system'
                      }
                    }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System (Auto)</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Corner Radius" description="Roundness of UI elements">
                <Select
                  value={chatkitOptions?.theme?.radius || 'round'}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      theme: {
                        ...chatkitOptions?.theme,
                        radius: v as 'pill' | 'round' | 'soft' | 'sharp'
                      }
                    }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pill">Pill</SelectItem>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="sharp">Sharp</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Density" description="Spacing between elements">
                <Select
                  value={chatkitOptions?.theme?.density || 'normal'}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      theme: {
                        ...chatkitOptions?.theme,
                        density: v as 'compact' | 'normal' | 'spacious'
                      }
                    }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {/* Colors Section */}
        <AccordionItem value="colors" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            Colors
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Accent Color (Primary)" description="Primary accent color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.accent?.primary || chatkitOptions?.theme?.primaryColor || '#3b82f6'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            accent: {
                              ...theme.color?.accent,
                              primary: color
                            }
                          },
                          // Legacy support
                          primaryColor: color
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#3b82f6"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Accent Intensity" description="Controls the intensity (0 = subtle, 4 = vibrant)">
                <Input
                  type="number"
                  min="0"
                  max="4"
                  value={chatkitOptions?.theme?.color?.accent?.level ?? 2}
                  onChange={(e) => {
                    const theme = chatkitOptions?.theme || {}
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            accent: {
                              ...theme.color?.accent,
                              level: parseInt(e.target.value) || 2
                            }
                          }
                        }
                      }
                    } as any)
                  }}
                  placeholder="2"
                />
              </FormRow>
              <FormRow label="Background Color" description="Optional background color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.background || chatkitOptions?.theme?.backgroundColor || '#ffffff'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            background: color
                          },
                          backgroundColor: color
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Text Color" description="Optional text color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.text || chatkitOptions?.theme?.textColor || '#000000'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            text: color
                          },
                          textColor: color
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Secondary Color" description="Optional secondary color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.secondary || chatkitOptions?.theme?.secondaryColor || formData.secondaryColor || '#6b7280'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            secondary: color
                          },
                          secondaryColor: color
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#6b7280"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Border Color" description="Optional border color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.border || '#e5e7eb'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            border: color
                          }
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Surface Background" description="Optional surface background color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.surface?.background || (typeof chatkitOptions?.theme?.color?.surface === 'string' ? chatkitOptions.theme.color.surface : undefined) || formData.backgroundColor || formData.messageBoxColor || '#f9fafb'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    const currentSurface = theme.color?.surface
                    const surfaceObj = typeof currentSurface === 'string'
                      ? { background: currentSurface }
                      : (typeof currentSurface === 'object' && currentSurface ? currentSurface : {})

                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            surface: {
                              ...surfaceObj,
                              background: color
                            }
                          }
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#f9fafb"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Surface Foreground" description="Optional surface foreground color">
                <ColorInput
                  value={chatkitOptions?.theme?.color?.surface?.foreground || formData.fontColor || '#000000'}
                  onChange={(color) => {
                    const theme = chatkitOptions?.theme || {}
                    const currentSurface = theme.color?.surface
                    const surfaceObj = typeof currentSurface === 'string'
                      ? { background: currentSurface }
                      : (typeof currentSurface === 'object' && currentSurface ? currentSurface : {})

                    setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...theme,
                          color: {
                            ...theme.color,
                            surface: {
                              ...surfaceObj,
                              foreground: color
                            }
                          }
                        }
                      }
                    } as any)
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        {/* Typography Section */}
        <AccordionItem value="typography" className="border-b-0 px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            Typography
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Font Family" description="Select a font family for the chat interface">
                <Select
                  value={chatkitOptions?.theme?.typography?.fontFamily || 'Inter, sans-serif'}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      theme: {
                        ...chatkitOptions?.theme,
                        typography: {
                          ...chatkitOptions?.theme?.typography,
                          fontFamily: v
                        }
                      }
                    }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                    <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                    <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                    <SelectItem value="Nunito, sans-serif">Nunito</SelectItem>
                    <SelectItem value="Raleway, sans-serif">Raleway</SelectItem>
                    <SelectItem value="Ubuntu, sans-serif">Ubuntu</SelectItem>
                    <SelectItem value="Outfit, sans-serif">Outfit</SelectItem>
                    <SelectItem value="Work Sans, sans-serif">Work Sans</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Font Size" description="Optional font size">
                <div className="relative">
                  <Input
                    type="number"
                    value={chatkitOptions?.theme?.typography?.fontSize || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...chatkitOptions?.theme,
                          typography: {
                            ...chatkitOptions?.theme?.typography,
                            fontSize: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }
                      }
                    } as any)}
                    placeholder="16"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
                </div>
              </FormRow>
              <FormRow label="Font Weight" description="Optional font weight">
                <Select
                  value={chatkitOptions?.theme?.typography?.fontWeight
                    ? String(chatkitOptions.theme.typography.fontWeight)
                    : 'default'}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      theme: {
                        ...chatkitOptions?.theme,
                        typography: {
                          ...chatkitOptions?.theme?.typography,
                          fontWeight: v === 'default' ? undefined : (isNaN(Number(v)) ? v : Number(v))
                        }
                      }
                    }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="100">100 (Thin)</SelectItem>
                    <SelectItem value="200">200 (Extra Light)</SelectItem>
                    <SelectItem value="300">300 (Light)</SelectItem>
                    <SelectItem value="400">400 (Normal)</SelectItem>
                    <SelectItem value="500">500 (Medium)</SelectItem>
                    <SelectItem value="600">600 (Semi Bold)</SelectItem>
                    <SelectItem value="700">700 (Bold)</SelectItem>
                    <SelectItem value="800">800 (Extra Bold)</SelectItem>
                    <SelectItem value="900">900 (Black)</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Line Height" description="Optional line height">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={chatkitOptions?.theme?.typography?.lineHeight || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...chatkitOptions?.theme,
                          typography: {
                            ...chatkitOptions?.theme?.typography,
                            lineHeight: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }
                      }
                    } as any)}
                    placeholder="1.5"
                  />
                </div>
              </FormRow>
              <FormRow label="Letter Spacing" description="Optional letter spacing">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={chatkitOptions?.theme?.typography?.letterSpacing || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      chatkitOptions: {
                        ...chatkitOptions,
                        theme: {
                          ...chatkitOptions?.theme,
                          typography: {
                            ...chatkitOptions?.theme?.typography,
                            letterSpacing: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }
                      }
                    } as any)}
                    placeholder="0"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">em</span>
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
