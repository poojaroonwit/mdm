'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'

interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    accent: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    fontWeight: number
    lineHeight: number
  }
  spacing: {
    padding: number
    margin: number
    borderRadius: number
  }
  shadows: {
    enabled: boolean
    intensity: number
    color: string
  }
}

interface AdvancedStylingProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
  onThemeSave: (theme: Theme) => void
  onThemeReset: () => void
  onThemeExport: (theme: Theme) => void
  onThemeImport: (theme: Theme) => void
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light Theme',
    colors: {
      primary: '#1e40af',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      accent: '#f59e0b'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5
    },
    spacing: {
      padding: 16,
      margin: 8,
      borderRadius: 8
    },
    shadows: {
      enabled: true,
      intensity: 0.1,
      color: '#000000'
    }
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    colors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      accent: '#fbbf24'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5
    },
    spacing: {
      padding: 16,
      margin: 8,
      borderRadius: 8
    },
    shadows: {
      enabled: true,
      intensity: 0.3,
      color: '#000000'
    }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    colors: {
      primary: '#1e40af',
      secondary: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      accent: '#dc2626'
    },
    typography: {
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.4
    },
    spacing: {
      padding: 20,
      margin: 12,
      borderRadius: 4
    },
    shadows: {
      enabled: true,
      intensity: 0.05,
      color: '#000000'
    }
  }
]

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Nunito',
  'Raleway',
  'Ubuntu'
]

export function AdvancedStyling({
  currentTheme,
  onThemeChange,
  onThemeSave,
  onThemeReset,
  onThemeExport,
  onThemeImport
}: AdvancedStylingProps) {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const [activeTab, setActiveTab] = useState('colors')
  const [customCSS, setCustomCSS] = useState('')

  const handleThemeUpdate = (updates: Partial<Theme>) => {
    const newTheme = { ...theme, ...updates }
    setTheme(newTheme)
    onThemeChange(newTheme)
  }

  const handleColorChange = (colorKey: keyof Theme['colors'], value: string) => {
    handleThemeUpdate({
      colors: {
        ...theme.colors,
        [colorKey]: value
      }
    })
  }

  const handleTypographyChange = (key: keyof Theme['typography'], value: any) => {
    handleThemeUpdate({
      typography: {
        ...theme.typography,
        [key]: value
      }
    })
  }

  const handleSpacingChange = (key: keyof Theme['spacing'], value: number) => {
    handleThemeUpdate({
      spacing: {
        ...theme.spacing,
        [key]: value
      }
    })
  }

  const handleShadowChange = (key: keyof Theme['shadows'], value: any) => {
    handleThemeUpdate({
      shadows: {
        ...theme.shadows,
        [key]: value
      }
    })
  }

  const applyPresetTheme = (presetTheme: Theme) => {
    setTheme(presetTheme)
    onThemeChange(presetTheme)
  }

  const generateCSS = () => {
    return `
:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-border: ${theme.colors.border};
  --color-accent: ${theme.colors.accent};
  
  --font-family: ${theme.typography.fontFamily};
  --font-size: ${theme.typography.fontSize}px;
  --font-weight: ${theme.typography.fontWeight};
  --line-height: ${theme.typography.lineHeight};
  
  --spacing-padding: ${theme.spacing.padding}px;
  --spacing-margin: ${theme.spacing.margin}px;
  --border-radius: ${theme.spacing.borderRadius}px;
  
  --shadow-enabled: ${theme.shadows.enabled ? '1' : '0'};
  --shadow-intensity: ${theme.shadows.intensity};
  --shadow-color: ${theme.shadows.color};
}

.dashboard-container {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  line-height: var(--line-height);
}

.dashboard-element {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-padding);
  margin: var(--spacing-margin);
  ${theme.shadows.enabled ? `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, ${theme.shadows.intensity});` : ''}
}

${customCSS}
    `.trim()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Advanced Styling</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onThemeReset()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => onThemeExport(theme)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => onThemeSave(theme)}>
            <Save className="h-4 w-4 mr-2" />
            Save Theme
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Theme Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="typography">Typography</TabsTrigger>
                  <TabsTrigger value="spacing">Spacing</TabsTrigger>
                  <TabsTrigger value="shadows">Shadows</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(theme.colors).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            value={value}
                            onChange={(e) => handleColorChange(key as keyof Theme['colors'], e.target.value)}
                            className="flex-1"
                          />
                          <div
                            className="w-8 h-8 border rounded cursor-pointer"
                            style={{ backgroundColor: value }}
                            onClick={() => {
                              // Color picker would open here
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Font Family</Label>
                      <Select
                        value={theme.typography.fontFamily}
                        onValueChange={(value) => handleTypographyChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map(font => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Font Size: {theme.typography.fontSize}px</Label>
                      <Slider
                        value={[theme.typography.fontSize]}
                        onValueChange={([value]) => handleTypographyChange('fontSize', value)}
                        min={10}
                        max={24}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Font Weight: {theme.typography.fontWeight}</Label>
                      <Slider
                        value={[theme.typography.fontWeight]}
                        onValueChange={([value]) => handleTypographyChange('fontWeight', value)}
                        min={300}
                        max={700}
                        step={100}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Line Height: {theme.typography.lineHeight}</Label>
                      <Slider
                        value={[theme.typography.lineHeight]}
                        onValueChange={([value]) => handleTypographyChange('lineHeight', value)}
                        min={1}
                        max={2}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="spacing" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Padding: {theme.spacing.padding}px</Label>
                      <Slider
                        value={[theme.spacing.padding]}
                        onValueChange={([value]) => handleSpacingChange('padding', value)}
                        min={0}
                        max={40}
                        step={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Margin: {theme.spacing.margin}px</Label>
                      <Slider
                        value={[theme.spacing.margin]}
                        onValueChange={([value]) => handleSpacingChange('margin', value)}
                        min={0}
                        max={30}
                        step={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Border Radius: {theme.spacing.borderRadius}px</Label>
                      <Slider
                        value={[theme.spacing.borderRadius]}
                        onValueChange={([value]) => handleSpacingChange('borderRadius', value)}
                        min={0}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="shadows" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={theme.shadows.enabled}
                        onCheckedChange={(checked) => handleShadowChange('enabled', checked)}
                      />
                      <Label>Enable Shadows</Label>
                    </div>
                    {theme.shadows.enabled && (
                      <>
                        <div>
                          <Label>Shadow Intensity: {theme.shadows.intensity}</Label>
                          <Slider
                            value={[theme.shadows.intensity]}
                            onValueChange={([value]) => handleShadowChange('intensity', value)}
                            min={0}
                            max={1}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Shadow Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              value={theme.shadows.color}
                              onChange={(e) => handleShadowChange('color', e.target.value)}
                              className="flex-1"
                            />
                            <div
                              className="w-8 h-8 border rounded cursor-pointer"
                              style={{ backgroundColor: theme.shadows.color }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preset Themes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PRESET_THEMES.map(preset => (
                <Button
                  key={preset.id}
                  variant={theme.id === preset.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => applyPresetTheme(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder="Add custom CSS here..."
                rows={8}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generateCSS()}
                readOnly
                rows={8}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(generateCSS())}
              >
                Copy CSS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
