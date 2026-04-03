'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Shield,
  Save,
  RefreshCw,
  Key,
  Globe,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AzureGroupRoleMapping, SSOConfig } from '../types'

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
    azureClientSecret: '',
    azureAllowedDomains: [],
    azureAllowSignup: false,
    azureRequireEmailVerified: true,
    azureDefaultRole: 'USER',
    azureGroupRoleMappings: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGuide, setShowGuide] = useState<'google' | 'azure' | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const parseDomains = (value: string) =>
    value
      .split(/[\n,]/)
      .map((item) => item.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean)

  const updateAzureMapping = (index: number, patch: Partial<AzureGroupRoleMapping>) => {
    setConfig((prev) => ({
      ...prev,
      azureGroupRoleMappings: prev.azureGroupRoleMappings.map((mapping, mappingIndex) =>
        mappingIndex === index ? { ...mapping, ...patch } : mapping
      ),
    }))
  }

  const addAzureMapping = () => {
    setConfig((prev) => ({
      ...prev,
      azureGroupRoleMappings: [
        ...prev.azureGroupRoleMappings,
        { groupId: '', name: '', role: 'USER' },
      ],
    }))
  }

  const removeAzureMapping = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      azureGroupRoleMappings: prev.azureGroupRoleMappings.filter((_, mappingIndex) => mappingIndex !== index),
    }))
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
            azureClientSecret: data.config.azureClientSecret || '',
            azureAllowedDomains: Array.isArray(data.config.azureAllowedDomains) ? data.config.azureAllowedDomains : [],
            azureAllowSignup: data.config.azureAllowSignup || false,
            azureRequireEmailVerified: data.config.azureRequireEmailVerified ?? true,
            azureDefaultRole: data.config.azureDefaultRole || 'USER',
            azureGroupRoleMappings: Array.isArray(data.config.azureGroupRoleMappings) ? data.config.azureGroupRoleMappings : [],
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="azure-default-role">Default Role for Auto-Provisioning</Label>
                <Select
                  value={config.azureDefaultRole || 'USER'}
                  onValueChange={(value) => setConfig({ ...config, azureDefaultRole: value })}
                >
                  <SelectTrigger id="azure-default-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="azure-allow-signup">Allow Just-in-Time Signup</Label>
                    <p className="text-xs text-muted-foreground">Create a platform user automatically on first Azure sign-in.</p>
                  </div>
                  <Switch
                    id="azure-allow-signup"
                    checked={config.azureAllowSignup}
                    onCheckedChange={(checked) => setConfig({ ...config, azureAllowSignup: checked })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="azure-email-verified">Require Verified Email Claim</Label>
                    <p className="text-xs text-muted-foreground">Reject sign-in only when Azure explicitly reports the email as unverified.</p>
                  </div>
                  <Switch
                    id="azure-email-verified"
                    checked={config.azureRequireEmailVerified}
                    onCheckedChange={(checked) => setConfig({ ...config, azureRequireEmailVerified: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="azure-allowed-domains">Allowed Email Domains</Label>
              <Textarea
                id="azure-allowed-domains"
                value={config.azureAllowedDomains.join('\n')}
                onChange={(e) => setConfig({ ...config, azureAllowedDomains: parseDomains(e.target.value) })}
                placeholder={'contoso.com\nsubsidiary.contoso.com'}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to allow any domain. Add one domain per line or separate with commas.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Azure Group-to-Role Mapping</Label>
                  <p className="text-xs text-muted-foreground">
                    Match Azure group IDs to platform roles during sign-in. Highest mapped role wins.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addAzureMapping}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Mapping
                </Button>
              </div>

              {config.azureGroupRoleMappings.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No group mappings configured yet. Users will keep their current role or use the default role above.
                </div>
              ) : (
                <div className="space-y-3">
                  {config.azureGroupRoleMappings.map((mapping, index) => (
                    <div key={`${mapping.groupId || 'new'}-${index}`} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor={`azure-group-id-${index}`}>Azure Group ID</Label>
                        <Input
                          id={`azure-group-id-${index}`}
                          value={mapping.groupId}
                          onChange={(e) => updateAzureMapping(index, { groupId: e.target.value })}
                          placeholder="00000000-0000-0000-0000-000000000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`azure-group-name-${index}`}>Label</Label>
                        <Input
                          id={`azure-group-name-${index}`}
                          value={mapping.name || ''}
                          onChange={(e) => updateAzureMapping(index, { name: e.target.value })}
                          placeholder="HR Managers"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={mapping.role} onValueChange={(value) => updateAzureMapping(index, { role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAzureMapping(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Best practice: configure Azure to emit group claims in the token. If not available, the platform will try Microsoft Graph group lookup when permission is granted.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, Azure AD SSO will appear on login pages, respect domain policy, enforce each user&apos;s allowed login methods, and optionally auto-provision users with mapped roles.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

    </div>
  )
})

SSOConfiguration.displayName = 'SSOConfiguration'
