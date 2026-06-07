'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Globe } from 'lucide-react'
import type { SystemSettings as SystemSettingsType } from '../types'

interface SystemGeneralSettingsTabProps {
  settings: SystemSettingsType
  setSettings: Dispatch<SetStateAction<SystemSettingsType>>
}

export function SystemGeneralSettingsTab({
  settings,
  setSettings,
}: SystemGeneralSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic site configuration and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })}
              placeholder="support@myapp.com"
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-4 text-primary">Data Retention & Governance</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableAuditTrail">Enable Audit Trail</Label>
                  <p className="text-sm text-muted-foreground">
                    Record all administrative actions and system changes
                  </p>
                </div>
                <Switch
                  id="enableAuditTrail"
                  checked={settings.enableAuditTrail}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableAuditTrail: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deletePolicyDays">Audit Log Retention (Days)</Label>
                  <Input
                    id="deletePolicyDays"
                    type="number"
                    value={settings.deletePolicyDays}
                    onChange={(event) => setSettings({ ...settings, deletePolicyDays: parseInt(event.target.value) || 0 })}
                    placeholder="30"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Details about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={settings.orgName}
                onChange={(event) => setSettings({ ...settings, orgName: event.target.value })}
                placeholder="My Organization"
              />
            </div>
            <div>
              <Label htmlFor="orgWebsite">Website</Label>
              <Input
                id="orgWebsite"
                value={settings.orgWebsite}
                onChange={(event) => setSettings({ ...settings, orgWebsite: event.target.value })}
                placeholder="https://organization.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orgEmail">Organization Email</Label>
              <Input
                id="orgEmail"
                type="email"
                value={settings.orgEmail}
                onChange={(event) => setSettings({ ...settings, orgEmail: event.target.value })}
                placeholder="contact@organization.com"
              />
            </div>
            <div>
              <Label htmlFor="orgPhone">Phone Number</Label>
              <Input
                id="orgPhone"
                value={settings.orgPhone}
                onChange={(event) => setSettings({ ...settings, orgPhone: event.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="orgAddress">Address</Label>
            <Input
              id="orgAddress"
              value={settings.orgAddress}
              onChange={(event) => setSettings({ ...settings, orgAddress: event.target.value })}
              placeholder="123 Business St, City, Country"
            />
          </div>

          <div>
            <Label htmlFor="orgDescription">Organization Description</Label>
            <Textarea
              id="orgDescription"
              value={settings.orgDescription}
              onChange={(event) => setSettings({ ...settings, orgDescription: event.target.value })}
              placeholder="A brief description of your organization"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
