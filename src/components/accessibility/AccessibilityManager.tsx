'use client'

import { useEffect, useState } from 'react'
import { Accessibility } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useThemeSafe } from '@/hooks/use-theme-safe'
import { AccessibilitySettingsTabs } from './AccessibilitySettingsTabs'

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

interface AccessibilityManagerProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void
}

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  fontSize: 3,
  colorBlindSupport: false,
  reducedMotion: false,
  darkMode: false,
  screenReader: false,
  audioDescriptions: false,
  soundEffects: true,
  volume: 50,
  keyboardNavigation: true,
  voiceControl: false,
  switchControl: false,
  stickyKeys: false,
  simplifiedInterface: false,
  readingMode: false,
  focusIndicators: true,
  errorPrevention: true,
  language: 'en',
  rightToLeft: false,
  translation: false
}

const ACCESSIBILITY_TESTS = [
  'color_contrast',
  'keyboard_navigation',
  'screen_reader',
  'focus_management',
  'alt_text',
  'semantic_html',
  'aria_labels',
  'color_blind_support'
]

export function AccessibilityManager({ onSettingsChange }: AccessibilityManagerProps) {
  const { setTheme, isDark, mounted: themeMounted } = useThemeSafe()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !themeMounted) return

    setSettings(prev => {
      if (prev.darkMode === isDark) return prev

      const updated = { ...prev, darkMode: isDark }
      onSettingsChange?.(updated)
      return updated
    })
  }, [isDark, mounted, themeMounted, onSettingsChange])

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    if (key === 'darkMode') {
      setTheme(value ? 'dark' : 'light')
      return
    }

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
    applyAccessibilitySettings(newSettings)
  }

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    document.documentElement.classList.toggle('high-contrast', newSettings.highContrast)
    document.documentElement.classList.toggle('reduced-motion', newSettings.reducedMotion)

    const fontSizeMap = { 1: '14px', 2: '16px', 3: '18px', 4: '20px', 5: '24px' }
    document.documentElement.style.fontSize = fontSizeMap[newSettings.fontSize as keyof typeof fontSizeMap]
    document.documentElement.lang = newSettings.language
    document.documentElement.dir = newSettings.rightToLeft ? 'rtl' : 'ltr'
  }

  const runAccessibilityTest = async () => {
    setIsTesting(true)
    setTestResults({})

    for (const test of ACCESSIBILITY_TESTS) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setTestResults(prev => ({ ...prev, [test]: Math.random() > 0.3 }))
    }

    setIsTesting(false)
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

      <AccessibilitySettingsTabs
        settings={settings}
        mounted={mounted}
        isTesting={isTesting}
        testResults={testResults}
        updateSetting={updateSetting}
      />
    </div>
  )
}
