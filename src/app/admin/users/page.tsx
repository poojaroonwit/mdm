'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserManagement, UserGroupManagement } from '@/app/admin/features/users'
import { Users, FolderTree } from 'lucide-react'

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="px-8 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Groups
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="m-0">
          <UserManagement />
        </TabsContent>

        <TabsContent value="groups" className="m-0">
          <UserGroupManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
