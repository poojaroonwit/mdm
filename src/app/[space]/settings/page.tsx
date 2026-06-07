"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout, Settings } from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'
import { useSpace } from '@/contexts/space-context'
import { useSpacesEditor } from '@/hooks/use-space-studio'
import { SpaceSettingsSidebar } from '@/components/space-management/SpaceSettingsSidebar'
import { SpaceSettingsHeader } from '@/components/space-management/SpaceSettingsHeader'
import { LoginPageSettingsPanel } from '@/components/space-management/LoginPageSettingsPanel'
import { SpaceBasicInformationPanel } from '@/components/space-management/SpaceBasicInformationPanel'
import { SpaceMembersTabs } from '@/components/space-management/SpaceMembersTabs'
import { SpaceDangerZone } from '@/components/space-management/SpaceDangerZone'
import { DataSyncManagement } from '@/components/data-sync/DataSyncManagement'
import { AttachmentBrowser } from '@/components/attachment-storage/AttachmentBrowser'
import { DataModelBrowser } from '@/components/data-model/DataModelBrowser'
import {
  DEFAULT_LOGIN_PAGE_CONFIG,
  normalizeLoginPageConfig,
  type LoginPageConfig,
} from '@/lib/login-page-config'

function EffectRedirect({ to }: { to: string }) {
  const router = useRouter()
  useEffect(() => {
    router.push(to)
  }, [router, to])
  return null
}

export default function SpaceSettingsPage() {
  const router = useRouter()
  const params = useParams() as { space: string }
  const searchParams = useSearchParams()
  const allowedTabs = ['details', 'members', 'data-model', 'data-sync', 'attachments', 'danger']
  const initialTabRaw = (searchParams.get('tab') as string) || 'details'
  const initialTab = allowedTabs.includes(initialTabRaw) ? initialTabRaw : 'details'
  const fromDataManagement = searchParams.get('from') === 'data-management'
  const fromSpaceSidebar = searchParams.get('from') === 'space-sidebar'
  const { spaces, currentSpace, refreshSpaces } = useSpace()

  // Spaces Editor: pages/templates management for this space
  const {
    pages: editorPages,
    templates: editorTemplates,
    createPage: createEditorPage,
    updatePage: updateEditorPage,
    deletePage: deleteEditorPage,
    assignTemplateToPage: assignTemplateToEditorPage,
    refreshConfig: refreshEditorConfig
  } = useSpacesEditor(currentSpace?.id || '')

  // Reset all pages function
  const handleResetPages = async () => {
    try {
      const { SpacesEditorManager } = await import('@/lib/space-studio-manager')
      await SpacesEditorManager.clearSpacesEditorConfig(currentSpace?.id || '')
      await refreshEditorConfig()
      showSuccess('All pages have been removed')
    } catch (error) {
      console.error('Failed to reset pages:', error)
      showError('Failed to reset pages')
    }
  }

  const homepage = useMemo(() => {
    if (!editorPages || editorPages.length === 0) return null
    const byOrder = [...editorPages]
      .filter(p => p.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    return byOrder[0] || null
  }, [editorPages])

  const selectedSpace = useMemo(() => {
    return (
      spaces.find((s: any) => s.id === params.space || s.slug === params.space) || currentSpace || null
    ) as any
  }, [spaces, currentSpace, params.space])

  const [tab, setTab] = useState<string>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  // Handle tab change and update URL to preserve from parameter
  const handleTabChange = (newTab: string) => {
    setTab(newTab)
    const queryParams = new URLSearchParams(searchParams?.toString() || '')
    queryParams.set('tab', newTab)
    // Preserve from parameter if it exists
    if (fromDataManagement) {
      queryParams.set('from', 'data-management')
    } else if (fromSpaceSidebar) {
      queryParams.set('from', 'space-sidebar')
    }
    router.push(`/${params.space}/settings?${queryParams.toString()}`)
  }

  const [members, setMembers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const canManageMembers = selectedSpace?.user_role === 'owner' || selectedSpace?.user_role === 'admin'

  // Handle user invitation
  const handleInviteUser = async (user: any, role: string) => {
    if (!selectedSpace?.id) return

    try {
      if (user.id) {
        // Existing user - add directly to space
        const res = await fetch(`/api/spaces/${selectedSpace.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, role })
        })

        if (res.ok) {
          showSuccess('User added to space')
          await loadMembers(selectedSpace.id)
        } else {
          const error = await res.json()
          showError(error.error || 'Failed to add user')
        }
      } else {
        // Create a real platform user first, then assign it to the space.
        const res = await fetch(`/api/spaces/${selectedSpace.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            create_user: {
              name: user.name,
              email: user.email,
              system_role: user.system_role || 'USER',
            },
          })
        })

        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          showSuccess(data.message || 'Platform user created and added to space')
          await loadMembers(selectedSpace.id)
        } else {
          const error = await res.json()
          showError(error.error || 'Failed to create platform user')
        }
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      showError('Failed to add user')
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, userIds: string[], data?: any) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, userIds, data })
      })

      if (res.ok) {
        await loadMembers(selectedSpace.id)
        showSuccess('Bulk operation completed successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to perform bulk operation')
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error)
      showError('Failed to perform bulk operation')
    }
  }

  // Handle member role update
  const handleUpdateRole = async (userId: string, role: string) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (res.ok) {
        await loadMembers(selectedSpace.id)
        showSuccess('Role updated successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      showError('Failed to update role')
    }
  }

  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadMembers(selectedSpace.id)
        showSuccess('Member removed successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      showError('Failed to remove member')
    }
  }

  // Handle permission updates
  const handleUpdatePermissions = async (userId: string, permissions: string[]) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })

      if (res.ok) {
        showSuccess('Permissions updated successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      showError('Failed to update permissions')
    }
  }

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!selectedSpace?.id) return

    try {
      setAuditLogsLoading(true)
      const res = await fetch(`/api/spaces/${selectedSpace.id}/audit-log`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.auditLogs || [])
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setAuditLogsLoading(false)
    }
  }

  const [loginPageConfig, setLoginPageConfig] = useState<LoginPageConfig>(DEFAULT_LOGIN_PAGE_CONFIG)
  const [savingLoginConfig, setSavingLoginConfig] = useState(false)
  useEffect(() => {
    const loadLoginConfig = async () => {
      if (!selectedSpace?.id) return
      try {
        const loginConfigRes = await fetch(`/api/spaces/${selectedSpace.id}/login-config`)
        const loginConfigJson = await loginConfigRes.json().catch(() => ({}))
        setLoginPageConfig(normalizeLoginPageConfig(loginConfigJson.loginPageConfig))
      } catch {
        setLoginPageConfig(DEFAULT_LOGIN_PAGE_CONFIG)
      }
    }
    loadLoginConfig()
  }, [selectedSpace?.id])



  useEffect(() => {
    if (tab === 'members' && selectedSpace?.id) {
      loadMembers(selectedSpace.id)
      loadAuditLogs()
    }
  }, [tab, selectedSpace?.id])

  const loadMembers = async (spaceId: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load members')
      }
      const json = await res.json()
      // Ensure we have a valid array
      const membersArray = Array.isArray(json.members) ? json.members : []
      setMembers(membersArray)
      if (membersArray.length === 0) {
        console.log('No members found for space:', spaceId)
      }
    } catch (e: any) {
      console.error('Error loading members:', e)
      showError(e.message || 'Failed to load members')
      setMembers([]) // Ensure members is always an array
    }
  }

  const saveLoginPageSettings = async () => {
    if (!selectedSpace?.id) return

    setSavingLoginConfig(true)
    try {
      const normalizedConfig = normalizeLoginPageConfig(loginPageConfig)
      const res = await fetch(`/api/spaces/${selectedSpace.id}/login-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginPageConfig: normalizedConfig }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save login page settings')
      }

      setLoginPageConfig(normalizedConfig)
      showSuccess('Login page customization saved')
    } catch (error: any) {
      console.error('Error saving login page settings:', error)
      showError(error.message || 'Failed to save login page settings')
    } finally {
      setSavingLoginConfig(false)
    }
  }

  if (!selectedSpace) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Space Settings</CardTitle>
            <CardDescription>Space not found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Only show header if NOT accessed from data management (where breadcrumbs show the info) */}
      {!fromDataManagement && !fromSpaceSidebar && (
        <SpaceSettingsHeader
          spaceName={selectedSpace?.name || 'Space Settings'}
          spaceDescription={selectedSpace?.description}
          isActive={selectedSpace?.is_active}
          homepage={homepage}
          spaceSlug={selectedSpace?.slug}
          spaceId={selectedSpace?.id}
        />
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Tabs value={tab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 w-full">
          {/* Only show sidebar in body if NOT accessed from data management (where it's shown in secondary sidebar) */}
          {!fromDataManagement && !fromSpaceSidebar && (
            <SpaceSettingsSidebar
              activeTab={tab}
              onTabChange={handleTabChange}
              showAllTabs={true}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-h-full space-y-6 px-6 py-6">
              <TabsContent value="details" className="mt-0 space-y-6 w-full">
                {/* Space Detail Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Space Detail</h2>
                  {selectedSpace?.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedSpace.description}
                    </p>
                  )}
                </div>

                {/* Details Sub-tabs */}
                <div className="w-full">
                  <Tabs defaultValue="basic">
                    <TabsList className="flex gap-2 justify-start">
                      <TabsTrigger value="basic" className="flex items-center gap-2 justify-start">
                        <Settings className="h-4 w-4" />
                        Basic Information
                      </TabsTrigger>
                      <TabsTrigger value="login" className="flex items-center gap-2 justify-start">
                        <Layout className="h-4 w-4" />
                        Login Page
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6 mt-6">
                      <SpaceBasicInformationPanel
                        space={selectedSpace}
                        onRefreshSpaces={refreshSpaces}
                      />
                    </TabsContent>

                    <TabsContent value="login" className="space-y-6 mt-6">
                      <LoginPageSettingsPanel
                        config={loginPageConfig}
                        loginPageUrl={`/${selectedSpace?.slug || selectedSpace?.id}/auth/signin`}
                        saving={savingLoginConfig}
                        setConfig={setLoginPageConfig}
                        onSave={saveLoginPageSettings}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="members" className="mt-0 space-y-6 w-full">
                {/* Members Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Members</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Manage team members, permissions, and access control for this space
                  </p>
                </div>

                {/* Members Sub-tabs */}
                <div className="w-full">
                  <SpaceMembersTabs
                    spaceId={selectedSpace.id}
                    members={members}
                    auditLogs={auditLogs}
                    auditLogsLoading={auditLogsLoading}
                    canManageMembers={canManageMembers}
                    onInvite={handleInviteUser}
                    onUpdateRole={handleUpdateRole}
                    onRemoveMember={handleRemoveMember}
                    onBulkOperation={handleBulkOperation}
                    onUpdatePermissions={handleUpdatePermissions}
                  />
                </div>
              </TabsContent>

              <TabsContent value="data-model" className="mt-0 space-y-6 w-full min-h-full">
                <DataModelBrowser spaceId={selectedSpace?.id || ''} />
              </TabsContent>
              <TabsContent value="data-sync" className="mt-0 space-y-6 w-full min-h-full">
                <DataSyncManagement spaceId={selectedSpace?.id || ''} />
              </TabsContent>

              <TabsContent value="attachments" className="mt-0 space-y-6 w-full min-h-full">
                <AttachmentBrowser spaceId={selectedSpace?.id || ''} />
              </TabsContent>

              <TabsContent value="danger" className="mt-0 space-y-6 w-full">
                <SpaceDangerZone
                  selectedSpace={selectedSpace}
                  spaces={spaces}
                  onRefreshSpaces={refreshSpaces}
                />
              </TabsContent>
            </div>
          </div>
          {/* <style jsx>{`
              
              :global(input:not([class*="border"])) { 
                border: 1px solid hsl(var(--border)) !important; 
                background-color: hsl(var(--background)) !important; 
              }
              :global(textarea:not([class*="border"])) { 
                border: 1px solid hsl(var(--border)) !important; 
                background-color: hsl(var(--background)) !important; 
              }
              :global([data-state="active"]) { 
                border-bottom: none !important; 
              }
              :global(.tabs-trigger) { 
                border-bottom: none !important; 
              }
            `}</style> */}
        </Tabs>
      </div>

    </div>
  )
}



