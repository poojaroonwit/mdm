'use client'

import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail } from 'lucide-react'
import type { SystemSettings as SystemSettingsType } from '../types'
import { EmailTemplates } from './EmailTemplates'

interface SystemEmailSettingsTabProps {
  activeEmailTab: string
  emailTemplatesRef: RefObject<{ handleSave: () => Promise<void> } | null>
  getTestIcon: (type: string) => ReactNode
  settings: SystemSettingsType
  setActiveEmailTab: (tab: string) => void
  setSettings: Dispatch<SetStateAction<SystemSettingsType>>
  testResults: Record<string, 'success' | 'error' | 'pending' | null>
  onTestConnection: (type: 'database' | 'email') => void
}

export function SystemEmailSettingsTab({
  activeEmailTab,
  emailTemplatesRef,
  getTestIcon,
  settings,
  setActiveEmailTab,
  setSettings,
  testResults,
  onTestConnection,
}: SystemEmailSettingsTabProps) {
  return (
    <Tabs defaultValue="config" value={activeEmailTab} onValueChange={setActiveEmailTab} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="config">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              SMTP settings for email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(event) => setSettings({ ...settings, smtpHost: event.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(event) => setSettings({ ...settings, smtpPort: parseInt(event.target.value) })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpUser">Username</Label>
                <Input
                  id="smtpUser"
                  value={settings.smtpUser}
                  onChange={(event) => setSettings({ ...settings, smtpUser: event.target.value })}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(event) => setSettings({ ...settings, smtpPassword: event.target.value })}
                  placeholder="App password"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="smtpSecure"
                checked={settings.smtpSecure}
                onCheckedChange={(checked) => setSettings({ ...settings, smtpSecure: checked })}
              />
              <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
            </div>

            <div>
              <Label htmlFor="wsProxyUrl">Realtime Voice WebSocket URL</Label>
              <Input
                id="wsProxyUrl"
                value={settings.wsProxyUrl}
                onChange={(event) => setSettings({ ...settings, wsProxyUrl: event.target.value })}
                placeholder="ws://localhost:3002/api/openai-realtime"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used by OpenAI Realtime voice clients. The standalone proxy server port still comes from `WS_PROXY_PORT`.
              </p>
            </div>

            <div>
              <Label htmlFor="minioPublicUrl">MinIO Public URL</Label>
              <Input
                id="minioPublicUrl"
                value={settings.minioPublicUrl}
                onChange={(event) => setSettings({ ...settings, minioPublicUrl: event.target.value })}
                placeholder="https://storage.example.com"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used for public asset proxying and rewriting legacy direct MinIO image URLs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onTestConnection('email')}
                disabled={testResults.email === 'pending'}
              >
                {getTestIcon('email')}
                <span className="ml-2">Test Email</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <Card>
          <CardContent className="p-6">
            <EmailTemplates ref={emailTemplatesRef} hideHeader={true} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
