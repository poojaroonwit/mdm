'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Palette
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SSOConfiguration } from '../../security'
import { SystemSettings as SystemSettingsType } from '../types'
import { StorageConnections } from './StorageConnections'
import { SystemIntegrations } from './SystemIntegrations'
import { Skeleton } from '@/components/ui/skeleton'
import { SystemAppearanceSettingsTab } from './SystemAppearanceSettingsTab'
import { SystemDatabaseSettingsTab } from './SystemDatabaseSettingsTab'
import { SystemEmailSettingsTab } from './SystemEmailSettingsTab'
import { SystemFeaturesSettingsTab } from './SystemFeaturesSettingsTab'
import { SystemGeneralSettingsTab } from './SystemGeneralSettingsTab'
import { SystemSecuritySettingsTab } from './SystemSecuritySettingsTab'

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
    wsProxyUrl: '',
    cronApiKey: '',
    schedulerApiKey: '',
    serviceDeskWebhookSecret: '',
    gitWebhookSecret: '',
    minioPublicUrl: '',

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
          smtpHost: data.smtpHost || prev.smtpHost,
          smtpPort: data.smtpPort !== undefined ? Number(data.smtpPort) : prev.smtpPort,
          smtpUser: data.smtpUser || prev.smtpUser,
          smtpPassword: data.smtpPassword || prev.smtpPassword,
          smtpSecure: data.smtpSecure !== undefined ? data.smtpSecure === 'true' || data.smtpSecure === true : prev.smtpSecure,
          wsProxyUrl: data.wsProxyUrl || prev.wsProxyUrl,
          cronApiKey: data.cronApiKey || prev.cronApiKey,
          schedulerApiKey: data.schedulerApiKey || prev.schedulerApiKey,
          serviceDeskWebhookSecret: data.serviceDeskWebhookSecret || prev.serviceDeskWebhookSecret,
          gitWebhookSecret: data.gitWebhookSecret || prev.gitWebhookSecret,
          minioPublicUrl: data.minioPublicUrl || prev.minioPublicUrl,
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
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUser: settings.smtpUser,
            smtpPassword: settings.smtpPassword,
            smtpSecure: settings.smtpSecure,
            wsProxyUrl: settings.wsProxyUrl,
            cronApiKey: settings.cronApiKey,
            schedulerApiKey: settings.schedulerApiKey,
            serviceDeskWebhookSecret: settings.serviceDeskWebhookSecret,
            gitWebhookSecret: settings.gitWebhookSecret,
            minioPublicUrl: settings.minioPublicUrl,
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
      <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
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
            <SystemGeneralSettingsTab
              settings={settings}
              setSettings={setSettings}
            />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <SystemAppearanceSettingsTab
              settings={settings}
              setSettings={setSettings}
              onFaviconUpload={handleFaviconUpload}
              onLogoUpload={handleLogoUpload}
            />
          </TabsContent>
          <TabsContent value="database" className="space-y-6">
            <SystemDatabaseSettingsTab
              getTestIcon={getTestIcon}
              settings={settings}
              setSettings={setSettings}
              testResults={testResults}
              onTestConnection={testConnection}
            />
          </TabsContent>
          <TabsContent value="email" className="space-y-6">
            <SystemEmailSettingsTab
              activeEmailTab={activeEmailTab}
              emailTemplatesRef={emailTemplatesRef}
              getTestIcon={getTestIcon}
              settings={settings}
              setActiveEmailTab={setActiveEmailTab}
              setSettings={setSettings}
              testResults={testResults}
              onTestConnection={testConnection}
            />
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
            <SystemSecuritySettingsTab
              settings={settings}
              setSettings={setSettings}
            />
          </TabsContent>
          <TabsContent value="sso" className="space-y-6">
            <SSOConfiguration ref={ssoRef} hideHeader={true} />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <SystemFeaturesSettingsTab
              settings={settings}
              setSettings={setSettings}
            />
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
