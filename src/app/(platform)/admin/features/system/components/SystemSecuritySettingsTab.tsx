'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield } from 'lucide-react'
import type { SystemSettings as SystemSettingsType } from '../types'

interface SystemSecuritySettingsTabProps {
  settings: SystemSettingsType
  setSettings: Dispatch<SetStateAction<SystemSettingsType>>
}

export function SystemSecuritySettingsTab({
  settings,
  setSettings,
}: SystemSecuritySettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Security and authentication configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(event) => setSettings({ ...settings, sessionTimeout: parseInt(event.target.value) })}
              placeholder="24"
            />
          </div>
          <div>
            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(event) => setSettings({ ...settings, maxLoginAttempts: parseInt(event.target.value) })}
              placeholder="5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
          <Input
            id="passwordMinLength"
            type="number"
            value={settings.passwordMinLength}
            onChange={(event) => setSettings({ ...settings, passwordMinLength: parseInt(event.target.value) })}
            placeholder="8"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="requireTwoFactor"
            checked={settings.requireTwoFactor}
            onCheckedChange={(checked) => setSettings({ ...settings, requireTwoFactor: checked })}
          />
          <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="enableLoginAlert"
            checked={settings.enableLoginAlert}
            onCheckedChange={(checked) => setSettings({ ...settings, enableLoginAlert: checked })}
          />
          <Label htmlFor="enableLoginAlert">Enable Login Email Alerts</Label>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-4">UI Protection</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="uiProtectionEnabled">UI Security Protection</Label>
                <p className="text-sm text-muted-foreground">
                  Disable DevTools (F12), right-click, and view-source throughout the application
                </p>
              </div>
              <Switch
                id="uiProtectionEnabled"
                checked={settings.uiProtectionEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, uiProtectionEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify their email address before access is granted
                </p>
              </div>
              <Switch
                id="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-4">Automation & Webhooks</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cronApiKey">Import/Export Cron API Key</Label>
              <Input
                id="cronApiKey"
                type="password"
                value={settings.cronApiKey}
                onChange={(event) => setSettings({ ...settings, cronApiKey: event.target.value })}
                placeholder="Optional API key for the import/export cron route"
              />
            </div>
            <div>
              <Label htmlFor="schedulerApiKey">Unified Scheduler API Key</Label>
              <Input
                id="schedulerApiKey"
                type="password"
                value={settings.schedulerApiKey}
                onChange={(event) => setSettings({ ...settings, schedulerApiKey: event.target.value })}
                placeholder="Optional API key for the unified scheduler"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <Label htmlFor="serviceDeskWebhookSecret">ServiceDesk Webhook Secret</Label>
              <Input
                id="serviceDeskWebhookSecret"
                type="password"
                value={settings.serviceDeskWebhookSecret}
                onChange={(event) => setSettings({ ...settings, serviceDeskWebhookSecret: event.target.value })}
                placeholder="Secret used to verify ServiceDesk webhooks"
              />
            </div>
            <div>
              <Label htmlFor="gitWebhookSecret">Git Webhook Secret</Label>
              <Input
                id="gitWebhookSecret"
                type="password"
                value={settings.gitWebhookSecret}
                onChange={(event) => setSettings({ ...settings, gitWebhookSecret: event.target.value })}
                placeholder="Secret used to verify GitHub or GitLab webhooks"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
