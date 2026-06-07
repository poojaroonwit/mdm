'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BarChart3, Bell, UserCheck, UserPlus, Users } from 'lucide-react'
import type { SystemSettings as SystemSettingsType } from '../types'

interface SystemFeaturesSettingsTabProps {
  settings: SystemSettingsType
  setSettings: Dispatch<SetStateAction<SystemSettingsType>>
}

export function SystemFeaturesSettingsTab({
  settings,
  setSettings,
}: SystemFeaturesSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Feature Settings
        </CardTitle>
        <CardDescription>
          Enable or disable system features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableUserRegistration" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Allow User Registration
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to create accounts on the platform
              </p>
            </div>
            <Switch
              id="enableUserRegistration"
              checked={settings.enableUserRegistration}
              onCheckedChange={(checked) => setSettings({ ...settings, enableUserRegistration: checked })}
            />
          </div>

          {settings.enableUserRegistration && (
            <div className="flex items-center justify-between ml-6 pb-2 border-l-2 pl-4">
              <div>
                <Label htmlFor="requireAdminApproval" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Require Admin Approval
                </Label>
                <p className="text-sm text-muted-foreground">
                  New accounts must be approved by an administrator
                </p>
              </div>
              <Switch
                id="requireAdminApproval"
                checked={settings.requireAdminApproval}
                onCheckedChange={(checked) => setSettings({ ...settings, requireAdminApproval: checked })}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableGuestAccess" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Allow Guest Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow unauthenticated users to access public modules
              </p>
            </div>
            <Switch
              id="enableGuestAccess"
              checked={settings.enableGuestAccess}
              onCheckedChange={(checked) => setSettings({ ...settings, enableGuestAccess: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableNotifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable system-wide notification delivery
              </p>
            </div>
            <Switch
              id="enableNotifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableAnalytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Enable Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Collect and display system usage analytics
              </p>
            </div>
            <Switch
              id="enableAnalytics"
              checked={settings.enableAnalytics}
              onCheckedChange={(checked) => setSettings({ ...settings, enableAnalytics: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
