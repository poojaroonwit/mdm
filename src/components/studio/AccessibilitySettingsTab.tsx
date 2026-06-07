import type { ReactNode } from 'react'
import { Settings } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

import type { AccessibilitySettings } from './accessibility-manager-types'

interface AccessibilitySettingsTabProps {
  settings: AccessibilitySettings
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void
}

export function AccessibilitySettingsTab({ settings, onUpdateSettings }: AccessibilitySettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Visual Settings</h3>
            <div className="space-y-4">
              <SettingsSwitch
                label="High Contrast Mode"
                description="Increase contrast for better visibility"
                checked={settings.highContrast}
                onCheckedChange={(checked) => onUpdateSettings({ highContrast: checked })}
              />
              <SettingsSwitch
                label="Large Text"
                description="Increase text size for better readability"
                checked={settings.largeText}
                onCheckedChange={(checked) => onUpdateSettings({ largeText: checked })}
              />
              <SettingsSwitch
                label="Reduced Motion"
                description="Reduce animations and transitions"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => onUpdateSettings({ reducedMotion: checked })}
              />
              <div>
                <div className="mb-2 font-medium">Font Size: {settings.fontSize}px</div>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={(value) => onUpdateSettings({ fontSize: value[0] })}
                  min={12}
                  max={24}
                  step={1}
                />
              </div>
              <div>
                <div className="mb-2 font-medium">Contrast Ratio: {settings.contrastRatio}:1</div>
                <Slider
                  value={[settings.contrastRatio]}
                  onValueChange={(value) => onUpdateSettings({ contrastRatio: value[0] })}
                  min={3}
                  max={21}
                  step={1}
                />
              </div>
            </div>
          </div>

          <SettingsGroup title="Navigation Settings">
            <SettingsSwitch
              label="Keyboard Navigation"
              description="Enable keyboard-only navigation"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => onUpdateSettings({ keyboardNavigation: checked })}
            />
            <SettingsSwitch
              label="Focus Indicators"
              description="Show visible focus indicators"
              checked={settings.focusIndicators}
              onCheckedChange={(checked) => onUpdateSettings({ focusIndicators: checked })}
            />
            <SettingsSwitch
              label="Auto Focus"
              description="Automatically focus on important elements"
              checked={settings.autoFocus}
              onCheckedChange={(checked) => onUpdateSettings({ autoFocus: checked })}
            />
            <SettingsSwitch
              label="Skip Links"
              description="Provide skip links for main content"
              checked={settings.skipLinks}
              onCheckedChange={(checked) => onUpdateSettings({ skipLinks: checked })}
            />
          </SettingsGroup>

          <SettingsGroup title="Screen Reader Settings">
            <SettingsSwitch
              label="Screen Reader Support"
              description="Optimize for screen readers"
              checked={settings.screenReader}
              onCheckedChange={(checked) => onUpdateSettings({ screenReader: checked })}
            />
            <SettingsSwitch
              label="ARIA Labels"
              description="Add ARIA labels to interactive elements"
              checked={settings.ariaLabels}
              onCheckedChange={(checked) => onUpdateSettings({ ariaLabels: checked })}
            />
            <SettingsSwitch
              label="Semantic HTML"
              description="Use semantic HTML elements"
              checked={settings.semanticHTML}
              onCheckedChange={(checked) => onUpdateSettings({ semanticHTML: checked })}
            />
          </SettingsGroup>

          <SettingsGroup title="Audio Settings">
            <SettingsSwitch
              label="Sound Effects"
              description="Play sound effects for interactions"
              checked={settings.soundEffects}
              onCheckedChange={(checked) => onUpdateSettings({ soundEffects: checked })}
            />
            <SettingsSwitch
              label="Voice Navigation"
              description="Enable voice commands"
              checked={settings.voiceNavigation}
              onCheckedChange={(checked) => onUpdateSettings({ voiceNavigation: checked })}
            />
          </SettingsGroup>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SettingsSwitch({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
