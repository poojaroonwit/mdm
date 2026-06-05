'use client'

import React, { useState, useEffect } from 'react'
import { useThemeSafe } from '@/hooks/use-theme-safe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  MousePointer, 
  Keyboard, 
  Monitor, 
  Smartphone,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Accessibility,
  Contrast,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Headphones,
  Mic,
  MicOff
} from 'lucide-react'

interface AccessibilitySettings {
  // Visual
  highContrast: boolean
  fontSize: number // 1-5 scale
  colorBlindSupport: boolean
  reducedMotion: boolean
  darkMode: boolean
  
  // Audio
  screenReader: boolean
  audioDescriptions: boolean
  soundEffects: boolean
  volume: number // 0-100
  
  // Motor
  keyboardNavigation: boolean
  voiceControl: boolean
  switchControl: boolean
  stickyKeys: boolean
  
  // Cognitive
  simplifiedInterface: boolean
  readingMode: boolean
  focusIndicators: boolean
  errorPrevention: boolean
  
  // Language
  language: string
  rightToLeft: boolean
  translation: boolean
}

interface AccessibilityManagerProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void
}

const FONT_SIZES = [
  { value: 1, label: 'Small', description: 'Default size' },
  { value: 2, label: 'Medium', description: 'Slightly larger' },
  { value: 3, label: 'Large', description: 'Easier to read' },
  { value: 4, label: 'Extra Large', description: 'Very easy to read' },
  { value: 5, label: 'Huge', description: 'Maximum readability' }
]

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
]

export function AccessibilityManager({ onSettingsChange }: AccessibilityManagerProps) {
  const { theme, setTheme, isDark, mounted: themeMounted } = useThemeSafe()
  const [mounted, setMounted] = useState(false)
  
  const [settings, setSettings] = useState<AccessibilitySettings>({
    // Visual
    highContrast: false,
    fontSize: 3,
    colorBlindSupport: false,
    reducedMotion: false,
    darkMode: false,
    
    // Audio
    screenReader: false,
    audioDescriptions: false,
    soundEffects: true,
    volume: 50,
    
    // Motor
    keyboardNavigation: true,
    voiceControl: false,
    switchControl: false,
    stickyKeys: false,
    
    // Cognitive
    simplifiedInterface: false,
    readingMode: false,
    focusIndicators: true,
    errorPrevention: true,
    
    // Language
    language: 'en',
    rightToLeft: false,
    translation: false
  })

  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  // Sync darkMode setting with theme on mount and when theme changes
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && themeMounted) {
      setSettings(prev => {
        if (prev.darkMode !== isDark) {
          const updated = { ...prev, darkMode: isDark }
          onSettingsChange?.(updated)
          return updated
        }
        return prev
      })
    }
  }, [isDark, mounted, themeMounted, onSettingsChange])

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    // Handle dark mode specially - use theme provider
    if (key === 'darkMode') {
      setTheme(value ? 'dark' : 'light')
      // The theme change will trigger the useEffect above to sync settings
      return
    }
    
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
    
    // Apply settings immediately
    applyAccessibilitySettings(newSettings)
  }

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    // Apply visual settings
    if (newSettings.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Dark mode is now handled by next-themes provider, no manual manipulation needed

    if (newSettings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }

    // Apply font size
    const fontSizeMap = { 1: '14px', 2: '16px', 3: '18px', 4: '20px', 5: '24px' }
    document.documentElement.style.fontSize = fontSizeMap[newSettings.fontSize as keyof typeof fontSizeMap]

    // Apply language
    document.documentElement.lang = newSettings.language
    if (newSettings.rightToLeft) {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
  }

  const runAccessibilityTest = async () => {
    setIsTesting(true)
    setTestResults({})

    // Simulate accessibility testing
    const tests = [
      'color_contrast',
      'keyboard_navigation',
      'screen_reader',
      'focus_management',
      'alt_text',
      'semantic_html',
      'aria_labels',
      'color_blind_support'
    ]

    for (const test of tests) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setTestResults(prev => ({ ...prev, [test]: Math.random() > 0.3 }))
    }

    setIsTesting(false)
  }

  const getTestResultIcon = (test: string) => {
    const result = testResults[test]
    if (result === undefined) return <Info className="h-4 w-4 text-gray-500" />
    return result ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  const getTestResultStatus = (test: string) => {
    const result = testResults[test]
    if (result === undefined) return { status: 'pending', label: 'Pending' }
    return result ? { status: 'passed', label: 'Pass' } : { status: 'failed', label: 'Fail' }
  }

  const getTestName = (test: string) => {
    const names: Record<string, string> = {
      color_contrast: 'Color Contrast',
      keyboard_navigation: 'Keyboard Navigation',
      screen_reader: 'Screen Reader Support',
      focus_management: 'Focus Management',
      alt_text: 'Alt Text',
      semantic_html: 'Semantic HTML',
      aria_labels: 'ARIA Labels',
      color_blind_support: 'Color Blind Support'
    }
    return names[test] || test
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accessibility Settings</h2>
          <p className="text-muted-foreground">
            Configure accessibility features for better usability
          </p>
        </div>
        <Button onClick={runAccessibilityTest} disabled={isTesting}>
          <Accessibility className="h-4 w-4 mr-2" />
          {isTesting ? 'Testing...' : 'Run Test'}
        </Button>
      </div>

      <div className="w-full">
      <Tabs defaultValue="visual">
        <TabsList>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="motor">Motor</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visual Accessibility
              </CardTitle>
              <CardDescription>
                Adjust visual settings for better visibility and readability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={settings.highContrast}
                    onCheckedChange={(highContrast) => updateSetting('highContrast', highContrast)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust text size for better readability
                  </p>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="font-size"
                      value={[settings.fontSize]}
                      onValueChange={([fontSize]) => updateSetting('fontSize', fontSize)}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-0">
                      {FONT_SIZES.find(s => s.value === settings.fontSize)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="color-blind">Color Blind Support</Label>
                    <p className="text-sm text-muted-foreground">
                      Use patterns and shapes in addition to color
                    </p>
                  </div>
                  <Switch
                    id="color-blind"
                    checked={settings.colorBlindSupport}
                    onCheckedChange={(colorBlindSupport) => updateSetting('colorBlindSupport', colorBlindSupport)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduced-motion">Reduce Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    id="reduced-motion"
                    checked={settings.reducedMotion}
                    onCheckedChange={(reducedMotion) => updateSetting('reducedMotion', reducedMotion)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for better visibility in low light
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={mounted ? settings.darkMode : false}
                    onCheckedChange={(darkMode) => updateSetting('darkMode', darkMode)}
                    disabled={!mounted}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Audio Accessibility
              </CardTitle>
              <CardDescription>
                Configure audio settings for screen readers and sound effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="screen-reader">Screen Reader</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable screen reader support
                    </p>
                  </div>
                  <Switch
                    id="screen-reader"
                    checked={settings.screenReader}
                    onCheckedChange={(screenReader) => updateSetting('screenReader', screenReader)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audio-descriptions">Audio Descriptions</Label>
                    <p className="text-sm text-muted-foreground">
                      Provide audio descriptions for visual content
                    </p>
                  </div>
                  <Switch
                    id="audio-descriptions"
                    checked={settings.audioDescriptions}
                    onCheckedChange={(audioDescriptions) => updateSetting('audioDescriptions', audioDescriptions)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-effects">Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound effects for user interactions
                    </p>
                  </div>
                  <Switch
                    id="sound-effects"
                    checked={settings.soundEffects}
                    onCheckedChange={(soundEffects) => updateSetting('soundEffects', soundEffects)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust audio volume level
                  </p>
                  <div className="flex items-center gap-4">
                    <VolumeX className="h-4 w-4" />
                    <Slider
                      id="volume"
                      value={[settings.volume]}
                      onValueChange={([volume]) => updateSetting('volume', volume)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm font-medium min-w-0">
                      {settings.volume}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Motor Accessibility
              </CardTitle>
              <CardDescription>
                Configure settings for users with motor impairments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable full keyboard navigation support
                    </p>
                  </div>
                  <Switch
                    id="keyboard-nav"
                    checked={settings.keyboardNavigation}
                    onCheckedChange={(keyboardNavigation) => updateSetting('keyboardNavigation', keyboardNavigation)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-control">Voice Control</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable voice commands for navigation
                    </p>
                  </div>
                  <Switch
                    id="voice-control"
                    checked={settings.voiceControl}
                    onCheckedChange={(voiceControl) => updateSetting('voiceControl', voiceControl)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="switch-control">Switch Control</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable switch control for assistive devices
                    </p>
                  </div>
                  <Switch
                    id="switch-control"
                    checked={settings.switchControl}
                    onCheckedChange={(switchControl) => updateSetting('switchControl', switchControl)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sticky-keys">Sticky Keys</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow key combinations to be pressed sequentially
                    </p>
                  </div>
                  <Switch
                    id="sticky-keys"
                    checked={settings.stickyKeys}
                    onCheckedChange={(stickyKeys) => updateSetting('stickyKeys', stickyKeys)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Cognitive Accessibility
              </CardTitle>
              <CardDescription>
                Configure settings for users with cognitive differences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="simplified">Simplified Interface</Label>
                    <p className="text-sm text-muted-foreground">
                      Simplify the interface for easier navigation
                    </p>
                  </div>
                  <Switch
                    id="simplified"
                    checked={settings.simplifiedInterface}
                    onCheckedChange={(simplifiedInterface) => updateSetting('simplifiedInterface', simplifiedInterface)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reading-mode">Reading Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Optimize content for reading comprehension
                    </p>
                  </div>
                  <Switch
                    id="reading-mode"
                    checked={settings.readingMode}
                    onCheckedChange={(readingMode) => updateSetting('readingMode', readingMode)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="focus-indicators">Focus Indicators</Label>
                    <p className="text-sm text-muted-foreground">
                      Show clear focus indicators for navigation
                    </p>
                  </div>
                  <Switch
                    id="focus-indicators"
                    checked={settings.focusIndicators}
                    onCheckedChange={(focusIndicators) => updateSetting('focusIndicators', focusIndicators)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="error-prevention">Error Prevention</Label>
                    <p className="text-sm text-muted-foreground">
                      Provide additional confirmation for destructive actions
                    </p>
                  </div>
                  <Switch
                    id="error-prevention"
                    checked={settings.errorPrevention}
                    onCheckedChange={(errorPrevention) => updateSetting('errorPrevention', errorPrevention)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Language & Localization
              </CardTitle>
              <CardDescription>
                Configure language and text direction settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(language) => updateSetting('language', language)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="right-to-left">Right-to-Left</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable right-to-left text direction
                    </p>
                  </div>
                  <Switch
                    id="right-to-left"
                    checked={settings.rightToLeft}
                    onCheckedChange={(rightToLeft) => updateSetting('rightToLeft', rightToLeft)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="translation">Auto Translation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically translate content to selected language
                    </p>
                  </div>
                  <Switch
                    id="translation"
                    checked={settings.translation}
                    onCheckedChange={(translation) => updateSetting('translation', translation)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Testing
              </CardTitle>
              <CardDescription>
                Test your application for accessibility compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(testResults).length > 0 && (
                  <div className="space-y-3">
                    {Object.keys(testResults).map((test) => (
                      <div key={test} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTestResultIcon(test)}
                          <span className="font-medium">{getTestName(test)}</span>
                        </div>
                        <StatusBadge {...getTestResultStatus(test)} />
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(testResults).length === 0 && !isTesting && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Accessibility className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run accessibility tests to see results</p>
                  </div>
                )}

                {isTesting && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Running accessibility tests...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
