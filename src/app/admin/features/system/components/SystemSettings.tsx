'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Database,
  Mail,
  Shield,
  Server,
  Key,
  Globe,
  Bell,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Palette,
  UserPlus,
  Users,
  UserCheck,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SSOConfiguration } from '../../security'
import { SystemSettings as SystemSettingsType } from '../types'
import { StorageConnections } from './StorageConnections'
import { SystemIntegrations } from './SystemIntegrations'
import { EmailTemplates } from './EmailTemplates'

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsType>({
    // General
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    logoUrl: '',
    faviconUrl: '',
    supportEmail: '',

    // Organization
    orgName: '',
    orgDescription: '',
    orgAddress: '',
    orgPhone: '',
    orgEmail: '',
    orgWebsite: '',

    // Database
    dbHost: '',
    dbPort: 5432,
    dbName: '',
    dbUser: '',
    dbPassword: '',

    // Email
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,

    // Security
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    enableLoginAlert: false,

    // UI Protection
    uiProtectionEnabled: false,

    // Features
    enableUserRegistration: true,
    enableGuestAccess: false,
    enableNotifications: true,
    enableAnalytics: false,
    requireAdminApproval: false,
    requireEmailVerification: true,
    enableAuditTrail: true,
    deletePolicyDays: 30,

    // Storage
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    storageProvider: 'local'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'pending' | null>>({})
  const [activeTab, setActiveTab] = useState('general')
  const [activeEmailTab, setActiveEmailTab] = useState('config')

  // Refs for child components
  const ssoRef = useRef<{ saveConfig: () => Promise<void> }>(null)
  const emailTemplatesRef = useRef<{ handleSave: () => Promise<void> }>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          // Expect flat key/value map from API
          sessionTimeout: data.sessionTimeout ? Number(data.sessionTimeout) : prev.sessionTimeout,
          faviconUrl: data.faviconUrl || prev.faviconUrl,
          logoUrl: data.logoUrl || prev.logoUrl,
          orgName: data.orgName || prev.orgName,
          orgDescription: data.orgDescription || prev.orgDescription,
          orgAddress: data.orgAddress || prev.orgAddress,
          orgPhone: data.orgPhone || prev.orgPhone,
          orgEmail: data.orgEmail || prev.orgEmail,
          orgWebsite: data.orgWebsite || prev.orgWebsite,
          uiProtectionEnabled: data.uiProtectionEnabled !== undefined 
            ? (data.uiProtectionEnabled === true || data.uiProtectionEnabled === 'true')
            : (data.disableRightClick !== undefined ? (data.disableRightClick === true || data.disableRightClick === 'true') : prev.uiProtectionEnabled),
          enableUserRegistration: data.enableUserRegistration !== undefined ? data.enableUserRegistration === 'true' || data.enableUserRegistration === true : prev.enableUserRegistration,
          enableGuestAccess: data.enableGuestAccess !== undefined ? data.enableGuestAccess === 'true' || data.enableGuestAccess === true : prev.enableGuestAccess,
          enableNotifications: data.enableNotifications !== undefined ? data.enableNotifications === 'true' || data.enableNotifications === true : prev.enableNotifications,
          enableAnalytics: data.enableAnalytics !== undefined ? data.enableAnalytics === 'true' || data.enableAnalytics === true : prev.enableAnalytics,
          requireAdminApproval: data.requireAdminApproval !== undefined ? data.requireAdminApproval === 'true' || data.requireAdminApproval === true : prev.requireAdminApproval,
          enableLoginAlert: data.enableLoginAlert !== undefined ? data.enableLoginAlert === 'true' || data.enableLoginAlert === true : prev.enableLoginAlert,
          requireEmailVerification: data.requireEmailVerification !== undefined ? data.requireEmailVerification === 'true' || data.requireEmailVerification === true : prev.requireEmailVerification,
          enableAuditTrail: data.enableAuditTrail !== undefined ? data.enableAuditTrail === 'true' || data.enableAuditTrail === true : prev.enableAuditTrail,
          deletePolicyDays: data.deletePolicyDays !== undefined ? Number(data.deletePolicyDays) : prev.deletePolicyDays,
          siteName: data.siteName || prev.siteName,
          siteDescription: data.siteDescription || prev.siteDescription,
          siteUrl: data.siteUrl || prev.siteUrl,
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            sessionTimeout: String(settings.sessionTimeout),
            faviconUrl: settings.faviconUrl,
            logoUrl: settings.logoUrl,
            orgName: settings.orgName,
            orgDescription: settings.orgDescription,
            orgAddress: settings.orgAddress,
            orgPhone: settings.orgPhone,
            orgEmail: settings.orgEmail,
            orgWebsite: settings.orgWebsite,
            enableUserRegistration: settings.enableUserRegistration,
            enableGuestAccess: settings.enableGuestAccess,
            enableNotifications: settings.enableNotifications,
            enableAnalytics: settings.enableAnalytics,
            requireAdminApproval: settings.requireAdminApproval,
            uiProtectionEnabled: settings.uiProtectionEnabled,
            requireTwoFactor: settings.requireTwoFactor,
            enableLoginAlert: settings.enableLoginAlert,
            siteName: settings.siteName,
            siteDescription: settings.siteDescription,
            siteUrl: settings.siteUrl,
            requireEmailVerification: settings.requireEmailVerification,
            enableAuditTrail: settings.enableAuditTrail,
            deletePolicyDays: settings.deletePolicyDays,
          }
        }),
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGlobalSave = async () => {
    if (activeTab === 'sso') {
      if (ssoRef.current) {
        setIsSaving(true)
        try {
          await ssoRef.current.saveConfig()
        } finally {
          setIsSaving(false)
        }
      }
    } else if (activeTab === 'email' && activeEmailTab === 'templates') {
      if (emailTemplatesRef.current) {
        setIsSaving(true)
        try {
          await emailTemplatesRef.current.handleSave()
        } finally {
          setIsSaving(false)
        }
      }
    } else if (['general', 'appearance', 'database', 'email', 'security', 'features'].includes(activeTab)) {
      // For email tab, if on 'config' sub-tab, it's part of general settings in this UI
      // For integrations and storage, they have their own save buttons in dialogs/rows
      await saveSettings()
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    const formData = new FormData()
    formData.append('logo', file)

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings({ ...settings, logoUrl: data.url })
        toast.success('Logo uploaded successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Failed to upload logo')
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Favicon size must be less than 1MB')
      return
    }

    const formData = new FormData()
    formData.append('favicon', file)

    try {
      const response = await fetch('/api/upload/favicon', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings({ ...settings, faviconUrl: data.url })
        toast.success('Favicon uploaded successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload favicon')
      }
    } catch (error) {
      console.error('Error uploading favicon:', error)
      toast.error('Failed to upload favicon')
    }
  }

  const testConnection = async (type: 'database' | 'email') => {
    setTestResults({ ...testResults, [type]: 'pending' })

    try {
      const response = await fetch(`/api/admin/test-connection/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setTestResults({ ...testResults, [type]: 'success' })
        toast.success(`${type} connection test successful`)
      } else {
        setTestResults({ ...testResults, [type]: 'error' })
        const error = await response.json()
        toast.error(error.error || `${type} connection test failed`)
      }
    } catch (error) {
      console.error(`Error testing ${type} connection:`, error)
      setTestResults({ ...testResults, [type]: 'error' })
      toast.error(`${type} connection test failed`)
    }
  }

  const getTestIcon = (type: string) => {
    const result = testResults[type]
    switch (result) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </h2>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Button onClick={handleGlobalSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="w-full">
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex h-auto w-auto justify-start bg-transparent border-b border-border p-0 gap-6">
            <TabsTrigger
              value="general"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="database"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="sso"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Key className="h-4 w-4" />
              SSO
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Bell className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Server className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="storage"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Database className="h-4 w-4" />
              Storage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
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
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
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
                            onChange={(e) => setSettings({ ...settings, deletePolicyDays: parseInt(e.target.value) || 0 })}
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
                      onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                      placeholder="My Organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgWebsite">Website</Label>
                    <Input
                      id="orgWebsite"
                      value={settings.orgWebsite}
                      onChange={(e) => setSettings({ ...settings, orgWebsite: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, orgEmail: e.target.value })}
                      placeholder="contact@organization.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgPhone">Phone Number</Label>
                    <Input
                      id="orgPhone"
                      value={settings.orgPhone}
                      onChange={(e) => setSettings({ ...settings, orgPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orgAddress">Address</Label>
                  <Input
                    id="orgAddress"
                    value={settings.orgAddress}
                    onChange={(e) => setSettings({ ...settings, orgAddress: e.target.value })}
                    placeholder="123 Business St, City, Country"
                  />
                </div>

                <div>
                  <Label htmlFor="orgDescription">Organization Description</Label>
                  <Textarea
                    id="orgDescription"
                    value={settings.orgDescription}
                    onChange={(e) => setSettings({ ...settings, orgDescription: e.target.value })}
                    placeholder="A brief description of your organization"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance & Branding
                </CardTitle>
                <CardDescription>
                  Customize your application's look and feel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Application Name</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      placeholder="My Application"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteUrl">Application URL</Label>
                    <Input
                      id="siteUrl"
                      value={settings.siteUrl}
                      onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                      placeholder="https://myapp.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <Label htmlFor="logoUpload">Application Logo</Label>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="h-32 w-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 overflow-hidden relative group">
                        {settings.logoUrl ? (
                          <>
                            <img
                              src={settings.logoUrl}
                              alt="App Logo"
                              className="max-h-full max-w-full object-contain p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => document.getElementById('logoUpload')?.click()}
                              >
                                Change Logo
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            className="h-full w-full flex flex-col gap-2 text-muted-foreground hover:bg-transparent"
                            onClick={() => document.getElementById('logoUpload')?.click()}
                          >
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Globe className="h-5 w-5 opacity-40" />
                            </div>
                            <span className="text-xs">Upload Logo</span>
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recommended size: 200x50px. Max 2MB.
                      </div>
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="faviconUpload">Favicon</Label>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="h-32 w-32 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 overflow-hidden relative group">
                        {settings.faviconUrl ? (
                          <>
                            <img
                              src={settings.faviconUrl}
                              alt="Favicon"
                              className="h-16 w-16 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => document.getElementById('faviconUpload')?.click()}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            className="h-full w-full flex flex-col gap-2 text-muted-foreground hover:bg-transparent"
                            onClick={() => document.getElementById('faviconUpload')?.click()}
                          >
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Globe className="h-5 w-5 opacity-40" />
                            </div>
                            <span className="text-[10px]">Upload</span>
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recommended size: 32x32px. Max 1MB.
                      </div>
                      <Input
                        id="faviconUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFaviconUpload}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="siteDescription">Application Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    placeholder="Brief description of your application"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
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
                      onChange={(e) => setSettings({ ...settings, dbHost: e.target.value })}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbPort">Port</Label>
                    <Input
                      id="dbPort"
                      type="number"
                      value={settings.dbPort}
                      onChange={(e) => setSettings({ ...settings, dbPort: parseInt(e.target.value) })}
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
                      onChange={(e) => setSettings({ ...settings, dbName: e.target.value })}
                      placeholder="myapp_db"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbUser">Username</Label>
                    <Input
                      id="dbUser"
                      value={settings.dbUser}
                      onChange={(e) => setSettings({ ...settings, dbUser: e.target.value })}
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
                    onChange={(e) => setSettings({ ...settings, dbPassword: e.target.value })}
                    placeholder="Database password"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => testConnection('database')}
                    disabled={testResults.database === 'pending'}
                  >
                    {getTestIcon('database')}
                    <span className="ml-2">Test Connection</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
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
                    {/* SMTP settings content */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={settings.smtpHost}
                          onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
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
                          onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                          placeholder="your-email@gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPassword">Password</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          value={settings.smtpPassword}
                          onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
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

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => testConnection('email')}
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
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
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
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
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
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sso" className="space-y-6">
            <SSOConfiguration ref={ssoRef} hideHeader={true} />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <SystemIntegrations hideHeader={true} />
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            <StorageConnections hideHeader={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
