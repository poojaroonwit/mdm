'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield } from 'lucide-react'
import { UserManagement, RoleManagement } from '@/app/admin/features/users'
import { MainLayout } from '@/components/layout/main-layout'

export default function UserRolesPage() {
    return (
        <MainLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Users className="h-7 w-7 text-primary" />
                        <span>Users & Roles</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage user accounts, roles, and permissions across your organization
                    </p>
                </div>

                {/* Horizontal Tabs */}
                <Tabs defaultValue="users" className="w-full">
                    <div className="border-b border-border mb-6">
                        <TabsList className="w-full h-auto p-0 bg-transparent justify-start gap-0">
                            <TabsTrigger
                                value="users"
                                className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent hover:bg-muted/50 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <span className="font-medium">User Management</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="roles"
                                className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent hover:bg-muted/50 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    <span className="font-medium">Roles & Permissions</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab Content */}
                    <TabsContent value="users" className="mt-0">
                        <UserManagement />
                    </TabsContent>

                    <TabsContent value="roles" className="mt-0">
                        <RoleManagement />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}
