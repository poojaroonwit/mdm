'use client'

import { useState } from 'react'
import { PluginDefinition } from '../types'
import {
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export interface InstallationWizardProps {
  plugin: PluginDefinition
  spaceId: string | null // Allow null for global installations
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (
    plugin: PluginDefinition,
    config: Record<string, any>,
    credentials?: Record<string, any>
  ) => Promise<void>
}

export function InstallationWizard({
  plugin,
  spaceId,
  open,
  onOpenChange,
  onComplete,
}: InstallationWizardProps) {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [credentials, setCredentials] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInstall = async () => {
    setLoading(true)
    setError(null)
    try {
      await onComplete(plugin, config, credentials)
    } catch (error) {
      console.error('Installation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to install plugin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Install {plugin.name}</DialogTitle>
          <DialogDescription>
            Configure the plugin for your space
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto pt-4">
          <div className="w-full space-y-6">
            {error && (
              <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50/50 text-rose-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            <Tabs defaultValue="config" className="w-full">
              <TabsList className="w-full flex justify-start gap-2 bg-zinc-100/50 dark:bg-zinc-800/50 p-1 rounded-xl mb-6">
                <TabsTrigger value="config" className="rounded-lg">Configuration</TabsTrigger>
                {plugin.apiAuthType && plugin.apiAuthType !== 'none' && (
                  <TabsTrigger value="credentials" className="rounded-lg">Credentials</TabsTrigger>
                )}
                <TabsTrigger value="review" className="rounded-lg">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Plugin Name</Label>
                    <Input value={plugin.name} disabled className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Version</Label>
                    <Input value={plugin.version} disabled className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Provider</Label>
                  <Input value={plugin.provider} disabled className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60" />
                </div>
                {plugin.uiConfig?.configFields && (
                  <div className="space-y-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    {Object.entries(plugin.uiConfig.configFields).map(([key, field]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">{field.label || key}</Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={config[key] || ''}
                            onChange={(e) =>
                              setConfig({ ...config, [key]: e.target.value })
                            }
                            placeholder={field.placeholder}
                            className="rounded-xl min-h-[100px]"
                          />
                        ) : (
                          <Input
                            type={field.type || 'text'}
                            value={config[key] || ''}
                            onChange={(e) =>
                              setConfig({ ...config, [key]: e.target.value })
                            }
                            placeholder={field.placeholder}
                            className="h-11 rounded-xl"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {plugin.apiAuthType && plugin.apiAuthType !== 'none' && (
                <TabsContent value="credentials" className="space-y-5 mt-0">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Authentication Type</Label>
                    <Input value={plugin.apiAuthType} disabled className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60" />
                  </div>
                  {plugin.apiAuthType === 'api_key' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">API Key</Label>
                      <Input
                        type="password"
                        value={credentials.apiKey || ''}
                        onChange={(e) =>
                          setCredentials({ ...credentials, apiKey: e.target.value })
                        }
                        placeholder="Enter API key"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  )}
                  {plugin.apiAuthType === 'oauth2' && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Client ID</Label>
                        <Input
                          value={credentials.clientId || ''}
                          onChange={(e) =>
                            setCredentials({ ...credentials, clientId: e.target.value })
                          }
                          placeholder="Enter client ID"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Client Secret</Label>
                        <Input
                          type="password"
                          value={credentials.clientSecret || ''}
                          onChange={(e) =>
                            setCredentials({ ...credentials, clientSecret: e.target.value })
                          }
                          placeholder="Enter client secret"
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="review" className="space-y-6 mt-0">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Plugin Summary</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm font-medium">
                    <div className="text-zinc-500">Name</div>
                    <div className="text-zinc-900 dark:text-zinc-100">{plugin.name}</div>
                    <div className="text-zinc-500">Version</div>
                    <div className="text-zinc-900 dark:text-zinc-100">{plugin.version}</div>
                    <div className="text-zinc-500">Provider</div>
                    <div className="text-zinc-900 dark:text-zinc-100">{plugin.provider}</div>
                    <div className="text-zinc-500">Category</div>
                    <div className="text-zinc-900 dark:text-zinc-100">{plugin.category}</div>
                  </div>
                </div>
                {Object.keys(config).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Configuration Review</Label>
                    <pre className="bg-zinc-950 text-zinc-400 p-4 rounded-2xl text-[10px] font-mono overflow-auto leading-relaxed border border-zinc-800">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogBody>

        <DialogFooter className="flex-shrink-0 border-t-0 p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 h-11 rounded-xl font-bold">
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={loading} className="px-8 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold">
            {loading ? 'Installing...' : 'Confirm Installation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

