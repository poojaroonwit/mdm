'use client'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Database } from 'lucide-react'
import type { SystemSettings as SystemSettingsType } from '../types'

interface SystemDatabaseSettingsTabProps {
  getTestIcon: (type: string) => ReactNode
  settings: SystemSettingsType
  setSettings: Dispatch<SetStateAction<SystemSettingsType>>
  testResults: Record<string, 'success' | 'error' | 'pending' | null>
  onTestConnection: (type: 'database' | 'email') => void
}

export function SystemDatabaseSettingsTab({
  getTestIcon,
  settings,
  setSettings,
  testResults,
  onTestConnection,
}: SystemDatabaseSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Configuration
        </CardTitle>
        <CardDescription>
          Database connection settings and configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dbHost">Database Host</Label>
            <Input
              id="dbHost"
              value={settings.dbHost}
              onChange={(event) => setSettings({ ...settings, dbHost: event.target.value })}
              placeholder="localhost"
            />
          </div>
          <div>
            <Label htmlFor="dbPort">Port</Label>
            <Input
              id="dbPort"
              type="number"
              value={settings.dbPort}
              onChange={(event) => setSettings({ ...settings, dbPort: parseInt(event.target.value) })}
              placeholder="5432"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dbName">Database Name</Label>
            <Input
              id="dbName"
              value={settings.dbName}
              onChange={(event) => setSettings({ ...settings, dbName: event.target.value })}
              placeholder="myapp_db"
            />
          </div>
          <div>
            <Label htmlFor="dbUser">Username</Label>
            <Input
              id="dbUser"
              value={settings.dbUser}
              onChange={(event) => setSettings({ ...settings, dbUser: event.target.value })}
              placeholder="postgres"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dbPassword">Password</Label>
          <Input
            id="dbPassword"
            type="password"
            value={settings.dbPassword}
            onChange={(event) => setSettings({ ...settings, dbPassword: event.target.value })}
            placeholder="Database password"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onTestConnection('database')}
            disabled={testResults.database === 'pending'}
          >
            {getTestIcon('database')}
            <span className="ml-2">Test Connection</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
