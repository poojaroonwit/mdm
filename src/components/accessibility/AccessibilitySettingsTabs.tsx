'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Accessibility, AlertTriangle, CheckCircle, Info, MousePointer, Type, Volume2, VolumeX, Eye } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AccessibilitySettings {
  highContrast: boolean
  fontSize: number
  colorBlindSupport: boolean
  reducedMotion: boolean
  darkMode: boolean
  screenReader: boolean
  audioDescriptions: boolean
  soundEffects: boolean
  volume: number
  keyboardNavigation: boolean
  voiceControl: boolean
  switchControl: boolean
  stickyKeys: boolean
  simplifiedInterface: boolean
  readingMode: boolean
  focusIndicators: boolean
  errorPrevention: boolean
  language: string
  rightToLeft: boolean
  translation: boolean
}

type SettingKey = keyof AccessibilitySettings

interface SettingToggleConfig {
  key: SettingKey
  label: string
  description: string
  disabled?: boolean
}

interface AccessibilitySettingsTabsProps {
  settings: AccessibilitySettings
  mounted: boolean
  isTesting: boolean
  testResults: Record<string, boolean>
  updateSetting: (key: SettingKey, value: any) => void
}

const FONT_SIZES = [
  { value: 1, label: 'Small' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Large' },
  { value: 4, label: 'Extra Large' },
  { value: 5, label: 'Huge' }
]

const LANGUAGES = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'zh', name: '中文', flag: 'CN' },
  { code: 'ja', name: '日本語', flag: 'JP' },
  { code: 'ar', name: 'العربية', flag: 'SA' }
]

const TEST_NAMES: Record<string, string> = {
  color_contrast: 'Color Contrast',
  keyboard_navigation: 'Keyboard Navigation',
  screen_reader: 'Screen Reader Support',
  focus_management: 'Focus Management',
  alt_text: 'Alt Text',
  semantic_html: 'Semantic HTML',
  aria_labels: 'ARIA Labels',
  color_blind_support: 'Color Blind Support'
}

function SettingSwitch({
  config,
  settings,
  updateSetting
}: {
  config: SettingToggleConfig
  settings: AccessibilitySettings
  updateSetting: (key: SettingKey, value: any) => void
}) {
  const checked = config.disabled ? false : Boolean(settings[config.key])

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={config.key}>{config.label}</Label>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
      <Switch
        id={config.key}
        checked={checked}
        onCheckedChange={(value) => updateSetting(config.key, value)}
        disabled={config.disabled}
      />
    </div>
  )
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

function getTestResultIcon(result: boolean | undefined) {
  if (result === undefined) return <Info className="h-4 w-4 text-gray-500" />
  return result
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : <AlertTriangle className="h-4 w-4 text-red-500" />
}

function getTestResultStatus(result: boolean | undefined) {
  if (result === undefined) return { status: 'pending', label: 'Pending' }
  return result ? { status: 'passed', label: 'Pass' } : { status: 'failed', label: 'Fail' }
}

export function AccessibilitySettingsTabs({
  settings,
  mounted,
  isTesting,
  testResults,
  updateSetting
}: AccessibilitySettingsTabsProps) {
  const visualToggles: SettingToggleConfig[] = [
    { key: 'highContrast', label: 'High Contrast', description: 'Increase contrast for better visibility' },
    { key: 'colorBlindSupport', label: 'Color Blind Support', description: 'Use patterns and shapes in addition to color' },
    { key: 'reducedMotion', label: 'Reduce Motion', description: 'Minimize animations and transitions' },
    { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme for better visibility in low light', disabled: !mounted }
  ]
  const audioToggles: SettingToggleConfig[] = [
    { key: 'screenReader', label: 'Screen Reader', description: 'Enable screen reader support' },
    { key: 'audioDescriptions', label: 'Audio Descriptions', description: 'Provide audio descriptions for visual content' },
    { key: 'soundEffects', label: 'Sound Effects', description: 'Play sound effects for user interactions' }
  ]
  const motorToggles: SettingToggleConfig[] = [
    { key: 'keyboardNavigation', label: 'Keyboard Navigation', description: 'Enable full keyboard navigation support' },
    { key: 'voiceControl', label: 'Voice Control', description: 'Enable voice commands for navigation' },
    { key: 'switchControl', label: 'Switch Control', description: 'Enable switch control for assistive devices' },
    { key: 'stickyKeys', label: 'Sticky Keys', description: 'Allow key combinations to be pressed sequentially' }
  ]
  const cognitiveToggles: SettingToggleConfig[] = [
    { key: 'simplifiedInterface', label: 'Simplified Interface', description: 'Simplify the interface for easier navigation' },
    { key: 'readingMode', label: 'Reading Mode', description: 'Optimize content for reading comprehension' },
    { key: 'focusIndicators', label: 'Focus Indicators', description: 'Show clear focus indicators for navigation' },
    { key: 'errorPrevention', label: 'Error Prevention', description: 'Provide additional confirmation for destructive actions' }
  ]
  const languageToggles: SettingToggleConfig[] = [
    { key: 'rightToLeft', label: 'Right-to-Left', description: 'Enable right-to-left text direction' },
    { key: 'translation', label: 'Auto Translation', description: 'Automatically translate content to selected language' }
  ]

  return (
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
          <SettingsCard icon={Eye} title="Visual Accessibility" description="Adjust visual settings for better visibility and readability">
            <div className="space-y-4">
              {visualToggles.map((config) => (
                <SettingSwitch key={config.key} config={config} settings={settings} updateSetting={updateSetting} />
              ))}
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <p className="text-sm text-muted-foreground">Adjust text size for better readability</p>
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
                    {FONT_SIZES.find(size => size.value === settings.fontSize)?.label}
                  </span>
                </div>
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <SettingsCard icon={Volume2} title="Audio Accessibility" description="Configure audio settings for screen readers and sound effects">
            <div className="space-y-4">
              {audioToggles.map((config) => (
                <SettingSwitch key={config.key} config={config} settings={settings} updateSetting={updateSetting} />
              ))}
              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <p className="text-sm text-muted-foreground">Adjust audio volume level</p>
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
                  <span className="text-sm font-medium min-w-0">{settings.volume}%</span>
                </div>
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="motor" className="space-y-6">
          <SettingsCard icon={MousePointer} title="Motor Accessibility" description="Configure settings for users with motor impairments">
            <div className="space-y-4">
              {motorToggles.map((config) => (
                <SettingSwitch key={config.key} config={config} settings={settings} updateSetting={updateSetting} />
              ))}
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          <SettingsCard icon={Type} title="Cognitive Accessibility" description="Configure settings for users with cognitive differences">
            <div className="space-y-4">
              {cognitiveToggles.map((config) => (
                <SettingSwitch key={config.key} config={config} settings={settings} updateSetting={updateSetting} />
              ))}
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <SettingsCard icon={Type} title="Language & Localization" description="Configure language and text direction settings">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(language) => updateSetting('language', language)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          <span>{language.flag}</span>
                          <span>{language.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {languageToggles.map((config) => (
                <SettingSwitch key={config.key} config={config} settings={settings} updateSetting={updateSetting} />
              ))}
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <SettingsCard icon={Accessibility} title="Accessibility Testing" description="Test your application for accessibility compliance">
            <div className="space-y-4">
              {Object.keys(testResults).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(testResults).map(([test, result]) => (
                    <div key={test} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTestResultIcon(result)}
                        <span className="font-medium">{TEST_NAMES[test] || test}</span>
                      </div>
                      <StatusBadge {...getTestResultStatus(result)} />
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p>Running accessibility tests...</p>
                </div>
              )}
            </div>
          </SettingsCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
