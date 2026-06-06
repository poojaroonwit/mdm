'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberAuditLog } from '@/components/space-management/MemberAuditLog'
import { MemberManagementPanel } from '@/components/space-management/MemberManagementPanel'
import { MemberPermissionsPanel } from '@/components/space-management/MemberPermissionsPanel'
import { Archive, Folder, Lock, Shield, Users } from 'lucide-react'

interface SpaceMembersTabsProps {
  spaceId: string
  members: any[]
  auditLogs: any[]
  auditLogsLoading: boolean
  canManageMembers: boolean
  onInvite: (user: any, role: string) => Promise<void>
  onUpdateRole: (userId: string, role: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onBulkOperation: (operation: string, userIds: string[], data?: any) => Promise<void>
  onUpdatePermissions: (userId: string, permissions: string[]) => Promise<void>
}

export function SpaceMembersTabs({
  spaceId,
  members,
  auditLogs,
  auditLogsLoading,
  canManageMembers,
  onInvite,
  onUpdateRole,
  onRemoveMember,
  onBulkOperation,
  onUpdatePermissions,
}: SpaceMembersTabsProps) {
  return (
    <Tabs defaultValue="members">
      <TabsList className="flex gap-2 justify-start flex-wrap">
        <TabsTrigger value="members" className="justify-start flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members
        </TabsTrigger>
        <TabsTrigger value="groups" className="justify-start flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Groups
        </TabsTrigger>
        <TabsTrigger value="roles" className="justify-start flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Roles
        </TabsTrigger>
        <TabsTrigger value="permissions" className="justify-start flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Permissions
        </TabsTrigger>
        <TabsTrigger value="audit" className="justify-start flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-6 mt-6">
        <MemberManagementPanel
          spaceId={spaceId}
          members={members}
          onInvite={onInvite}
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
          onBulkOperation={onBulkOperation}
          canManageMembers={canManageMembers}
          loading={false}
        />
      </TabsContent>

      <TabsContent value="groups" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Manage member groups and group assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Group management coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="roles" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Manage role definitions and role assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Role management coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="permissions" className="space-y-6 mt-6">
        <MemberPermissionsPanel
          spaceId={spaceId}
          members={members}
          onUpdatePermissions={onUpdatePermissions}
          canManagePermissions={canManageMembers}
        />
      </TabsContent>

      <TabsContent value="audit" className="space-y-6 mt-6">
        <MemberAuditLog
          spaceId={spaceId}
          auditLogs={auditLogs}
          loading={auditLogsLoading}
        />
      </TabsContent>
    </Tabs>
  )
}
