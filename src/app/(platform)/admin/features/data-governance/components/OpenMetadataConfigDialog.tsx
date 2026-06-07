import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw } from 'lucide-react'

import type { OpenMetadataConfig } from '../types'

interface OpenMetadataConfigDialogProps {
  open: boolean
  isLoading: boolean
  newConfig: Partial<OpenMetadataConfig>
  onOpenChange: (open: boolean) => void
  onSave: () => void
  setNewConfig: (config: Partial<OpenMetadataConfig>) => void
}

export function OpenMetadataConfigDialog({
  open,
  isLoading,
  newConfig,
  onOpenChange,
  onSave,
  setNewConfig
}: OpenMetadataConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>OpenMetadata Configuration</DialogTitle>
          <DialogDescription>Configure connection to your OpenMetadata instance</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 p-6 pt-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="host">OpenMetadata Host</Label>
            <Input
              id="host"
              value={newConfig.host || ''}
              onChange={(event) => setNewConfig({ ...newConfig, host: event.target.value })}
              placeholder="https://openmetadata.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiVersion">API Version</Label>
            <Select
              value={newConfig.apiVersion || 'v1'}
              onValueChange={(apiVersion) => setNewConfig({ ...newConfig, apiVersion })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">v1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="authProvider">Authentication Provider</Label>
            <Select
              value={newConfig.authProvider || 'basic'}
              onValueChange={(authProvider: any) => setNewConfig({ ...newConfig, authProvider })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="jwt">JWT Token</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
                <SelectItem value="saml">SAML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newConfig.authProvider === 'basic' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newConfig.authConfig?.username || ''}
                  onChange={(event) => setNewConfig({
                    ...newConfig,
                    authConfig: { ...newConfig.authConfig, username: event.target.value }
                  })}
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newConfig.authConfig?.password || ''}
                  onChange={(event) => setNewConfig({
                    ...newConfig,
                    authConfig: { ...newConfig.authConfig, password: event.target.value }
                  })}
                  placeholder="password"
                />
              </div>
            </>
          )}
          {newConfig.authProvider === 'jwt' && (
            <div className="space-y-2">
              <Label htmlFor="jwtToken">JWT Token</Label>
              <Textarea
                id="jwtToken"
                value={newConfig.authConfig?.jwtToken || ''}
                onChange={(event) => setNewConfig({
                  ...newConfig,
                  authConfig: { ...newConfig.authConfig, jwtToken: event.target.value }
                })}
                placeholder="Enter JWT token"
                rows={3}
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={newConfig.isEnabled || false}
              onCheckedChange={(isEnabled) => setNewConfig({ ...newConfig, isEnabled })}
            />
            <Label htmlFor="enabled">Enable Integration</Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
