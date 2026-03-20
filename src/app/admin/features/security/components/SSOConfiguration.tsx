'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Key,
  Globe,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SSOConfig } from '../types'

interface SSOConfigurationProps {
  hideHeader?: boolean
}

export const SSOConfiguration = forwardRef<{ saveConfig: () => Promise<void> }, SSOConfigurationProps>((props, ref) => {
  const { hideHeader = false } = props
  const [config, setConfig] = useState<SSOConfig>({
    googleEnabled: false,
    azureEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    azureTenantId: '',
    azureClientId: '',
    azureClientSecret: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGuide, setShowGuide] = useState<'google' | 'azure' | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/sso-config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig({
            googleEnabled: data.config.googleEnabled || false,
            azureEnabled: data.config.azureEnabled || false,
            googleClientId: data.config.googleClientId || '',
            googleClientSecret: data.config.googleClientSecret || '',
            azureTenantId: data.config.azureTenantId || '',
            azureClientId: data.config.azureClientId || '',
            azureClientSecret: data.config.azureClientSecret || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading SSO config:', error)
      toast.error('Failed to load SSO configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/sso-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      })

      if (response.ok) {
        toast.success('SSO configuration saved successfully')
        // Reload to get updated config
        await loadConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save SSO configuration')
      }
    } catch (error) {
      console.error('Error saving SSO config:', error)
      toast.error('Failed to save SSO configuration')
    } finally {
      setIsSaving(false)
    }
  }

  // Expose the saveConfig method to parent components
  useImperativeHandle(ref, () => ({
    saveConfig
  }))

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading SSO configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              SSO Configuration
            </h2>
            <p className="text-muted-foreground">
              Configure Single Sign-On (SSO) providers for authentication
            </p>
          </div>
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      )}

      {/* Google SSO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Google SSO
              </CardTitle>
              <CardDescription>
                Configure Google OAuth authentication
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuide(showGuide === 'google' ? null : 'google')}
                className="text-muted-foreground"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Setup Guide
                {showGuide === 'google' ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
              <Switch
                checked={config.googleEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, googleEnabled: checked })
                }
              />
            </div>
          </div>
        </CardHeader>
        {showGuide === 'google' && (
          <CardContent className="border-t bg-muted/30">
            <div className="space-y-4 py-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                How to set up Google OAuth
              </h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
                  <span>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a> and select or create a project.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
                  <span>Navigate to <strong>APIs &amp; Services → OAuth consent screen</strong>. Set the app as <strong>Internal</strong> (for org users) or <strong>External</strong>, then fill in the required fields.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
                  <span>Go to <strong>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</strong>. Choose <strong>Web application</strong> as the type.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">4</span>
                  <div className="space-y-1">
                    <p>Under <strong>Authorized redirect URIs</strong>, add your callback URL:</p>
                    <div className="flex items-center gap-2 bg-background border rounded px-3 py-1.5 font-mono text-xs">
                      <span className="flex-1">{'{your-domain}'}/api/auth/callback/google</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => copyToClipboard('/api/auth/callback/google')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">5</span>
                  <span>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> from the created credential and paste them in the fields below.</span>
                </li>
              </ol>
            </div>
          </CardContent>
        )}
        {config.googleEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="googleClientId">Client ID</Label>
                <Input
                  id="googleClientId"
                  value={config.googleClientId}
                  onChange={(e) =>
                    setConfig({ ...config, googleClientId: e.target.value })
                  }
                  placeholder="your-google-client-id.apps.googleusercontent.com"
                />
              </div>
              <div>
                <Label htmlFor="googleClientSecret">Client Secret</Label>
                <Input
                  id="googleClientSecret"
                  type="password"
                  value={config.googleClientSecret}
                  onChange={(e) =>
                    setConfig({ ...config, googleClientSecret: e.target.value })
                  }
                  placeholder="GOCSPX-..."
                />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, Google SSO will appear on all login pages.
                Users can only log in if their email exists in the platform or space.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Azure AD SSO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Azure AD SSO
              </CardTitle>
              <CardDescription>
                Configure Microsoft Azure Active Directory authentication
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuide(showGuide === 'azure' ? null : 'azure')}
                className="text-muted-foreground"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Setup Guide
                {showGuide === 'azure' ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
              <Switch
                checked={config.azureEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, azureEnabled: checked })
                }
              />
            </div>
          </div>
        </CardHeader>
        {showGuide === 'azure' && (
          <CardContent className="border-t bg-muted/30">
            <div className="space-y-4 py-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                How to set up Azure AD OAuth
              </h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
                  <span>Go to <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Azure Portal <ExternalLink className="h-3 w-3" /></a> and navigate to <strong>Azure Active Directory → App registrations → New registration</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
                  <div className="space-y-1">
                    <p>Set the name, select supported account types, and add the redirect URI:</p>
                    <div className="flex items-center gap-2 bg-background border rounded px-3 py-1.5 font-mono text-xs">
                      <span className="flex-1">{'{your-domain}'}/api/auth/callback/azure-ad</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => copyToClipboard('/api/auth/callback/azure-ad')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
                  <span>After registration, copy the <strong>Application (client) ID</strong> — this is your <strong>Client ID</strong>. Copy the <strong>Directory (tenant) ID</strong> — this is your <strong>Tenant ID</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">4</span>
                  <span>Go to <strong>Certificates &amp; secrets → New client secret</strong>. Set a description and expiry, then click <strong>Add</strong>. Copy the secret <strong>Value</strong> immediately — it won&apos;t be shown again.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">5</span>
                  <span>Go to <strong>API permissions → Add a permission → Microsoft Graph → Delegated</strong> and add <strong>email</strong>, <strong>openid</strong>, and <strong>profile</strong> permissions. Click <strong>Grant admin consent</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">6</span>
                  <span>Paste the Tenant ID, Client ID, and Client Secret into the fields below.</span>
                </li>
              </ol>
            </div>
          </CardContent>
        )}
        {config.azureEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="azureTenantId">Tenant ID</Label>
                <Input
                  id="azureTenantId"
                  value={config.azureTenantId}
                  onChange={(e) =>
                    setConfig({ ...config, azureTenantId: e.target.value })
                  }
                  placeholder="your-tenant-id"
                />
              </div>
              <div>
                <Label htmlFor="azureClientId">Client ID (Application ID)</Label>
                <Input
                  id="azureClientId"
                  value={config.azureClientId}
                  onChange={(e) =>
                    setConfig({ ...config, azureClientId: e.target.value })
                  }
                  placeholder="your-azure-client-id"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="azureClientSecret">Client Secret</Label>
              <Input
                id="azureClientSecret"
                type="password"
                value={config.azureClientSecret}
                onChange={(e) =>
                  setConfig({ ...config, azureClientSecret: e.target.value })
                }
                placeholder="your-azure-client-secret"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, Azure AD SSO will appear on all login pages.
                Users can only log in if their email exists in the platform or space.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

    </div>
  )
})

SSOConfiguration.displayName = 'SSOConfiguration'
