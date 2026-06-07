'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link as LinkIcon, X, Users, User, Loader2, Search, Check } from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { cn } from '@/lib/utils'

interface EmbedReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    spaceId?: string
}

interface Category {
    id: string
    name: string
}

interface Folder {
    id: string
    name: string
}

interface UserItem {
    id: string
    name: string
    email: string
    avatar?: string
}

interface Role {
    id: string
    name: string
}

function getInitials(name: string): string {
    if (!name) return '?'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

export function EmbedReportDialog({
    open,
    onOpenChange,
    onSuccess,
    spaceId
}: EmbedReportDialogProps) {
    const [name, setName] = useState('')
    const [embedUrl, setEmbedUrl] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [folderId, setFolderId] = useState('')

    const [isPublic, setIsPublic] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])

    const [userSearch, setUserSearch] = useState('')
    const [roleSearch, setRoleSearch] = useState('')

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [folders, setFolders] = useState<Folder[]>([])
    const [users, setUsers] = useState<UserItem[]>([])
    const [roles, setRoles] = useState<Role[]>([])

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open])

    const loadData = async () => {
        try {
            const [categoriesRes, foldersRes, usersRes, rolesRes] = await Promise.all([
                fetch('/api/reports/categories'),
                fetch('/api/reports/folders'),
                fetch('/api/users'),
                fetch('/api/roles')
            ])

            if (categoriesRes.ok) {
                const data = await categoriesRes.json()
                setCategories(data.categories || [])
            }
            if (foldersRes.ok) {
                const data = await foldersRes.json()
                setFolders(data.folders || [])
            }
            if (usersRes.ok) {
                const data = await usersRes.json()
                setUsers(data.users || [])
            }
            if (rolesRes.ok) {
                const data = await rolesRes.json()
                setRoles(data.roles || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
    }

    const filteredUsers = useMemo(() => {
        if (!userSearch.trim()) return users
        const query = userSearch.toLowerCase()
        return users.filter(u =>
            (u.name?.toLowerCase().includes(query)) ||
            (u.email?.toLowerCase().includes(query))
        )
    }, [users, userSearch])

    const filteredRoles = useMemo(() => {
        if (!roleSearch.trim()) return roles
        const query = roleSearch.toLowerCase()
        return roles.filter(r => r.name?.toLowerCase().includes(query))
    }, [roles, roleSearch])

    const resetForm = () => {
        setName('')
        setEmbedUrl('')
        setDescription('')
        setCategoryId('')
        setFolderId('')
        setIsPublic(false)
        setSelectedUsers([])
        setSelectedRoles([])
        setUserSearch('')
        setRoleSearch('')
    }

    const handleSubmit = async () => {
        if (!name.trim()) {
            showError('Report name is required')
            return
        }
        if (!embedUrl.trim()) {
            showError('Embed URL is required')
            return
        }

        try {
            setLoading(true)

            const reportResponse = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    source: 'CUSTOM_EMBED_LINK',
                    embed_url: embedUrl.trim(),
                    category_id: categoryId || undefined,
                    folder_id: folderId || undefined,
                    space_ids: spaceId ? [spaceId] : [],
                    metadata: { is_public: isPublic }
                })
            })

            if (!reportResponse.ok) {
                const error = await reportResponse.json()
                throw new Error(error.message || 'Failed to create report')
            }

            const { report } = await reportResponse.json()

            // Add permissions
            const permissionPromises: Promise<Response>[] = []

            for (const userId of selectedUsers) {
                permissionPromises.push(
                    fetch(`/api/reports/${report.id}/permissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, permission: 'view' })
                    })
                )
            }

            for (const roleId of selectedRoles) {
                permissionPromises.push(
                    fetch(`/api/reports/${report.id}/permissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role_id: roleId, permission: 'view' })
                    })
                )
            }

            await Promise.all(permissionPromises)

            showSuccess('Report created successfully')
            resetForm()
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            showError(error.message || ToastMessages.CREATE_ERROR)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    const handleUserClick = useCallback((userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }, [])

    const handleRoleClick = useCallback((roleId: string) => {
        setSelectedRoles(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        )
    }, [])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        Embed Custom Report
                    </DialogTitle>
                    <DialogDescription>
                        Add an external report or dashboard by providing its embed URL
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Report Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter report name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="embedUrl">Embed URL <span className="text-destructive">*</span></Label>
                            <Input
                                id="embedUrl"
                                value={embedUrl}
                                onChange={(e) => setEmbedUrl(e.target.value)}
                                placeholder="https://example.com/embed/report"
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the embed URL from Power BI, Looker Studio, Grafana, or any other BI tool
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description for this report"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Folder</Label>
                                <Select value={folderId} onValueChange={setFolderId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select folder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {folders.map(folder => (
                                            <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-medium">Permissions</h3>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="public-access">Public Access</Label>
                                <p className="text-xs text-muted-foreground">
                                    Allow anyone to view this report
                                </p>
                            </div>
                            <Switch
                                id="public-access"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                        </div>

                        {!isPublic && (
                            <Tabs defaultValue="users" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="users" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Users {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                                    </TabsTrigger>
                                    <TabsTrigger value="roles" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Roles {selectedRoles.length > 0 && `(${selectedRoles.length})`}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="users" className="mt-4">
                                    <div className="space-y-3">
                                        <Label>Grant access to users</Label>

                                        {selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsers.map(userId => {
                                                    const user = users.find(u => u.id === userId)
                                                    return user ? (
                                                        <Badge
                                                            key={userId}
                                                            variant="secondary"
                                                            className="flex items-center gap-2 py-1 px-2 pr-1"
                                                        >
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                                <AvatarFallback className="text-[10px]">
                                                                    {getInitials(user.name || user.email)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="truncate max-w-[100px]">{user.name || user.email}</span>
                                                            <button
                                                                type="button"
                                                                className="h-5 w-5 rounded-sm hover:bg-destructive/20 flex items-center justify-center"
                                                                onClick={() => handleUserClick(userId)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ) : null
                                                })}
                                            </div>
                                        )}

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search users by name or email..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>

                                        <ScrollArea className="h-[200px] border rounded-md">
                                            <div className="p-2 space-y-1">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                                        No users found
                                                    </div>
                                                ) : (
                                                    filteredUsers.map(user => {
                                                        const isSelected = selectedUsers.includes(user.id)
                                                        return (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => handleUserClick(user.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                                                                    "hover:bg-accent cursor-pointer",
                                                                    isSelected && "bg-accent"
                                                                )}
                                                            >
                                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getInitials(user.name || user.email)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium truncate">{user.name || 'No name'}</div>
                                                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                                </div>
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4 flex-shrink-0",
                                                                        isSelected ? "opacity-100 text-primary" : "opacity-0"
                                                                    )}
                                                                />
                                                            </button>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </TabsContent>

                                <TabsContent value="roles" className="mt-4">
                                    <div className="space-y-3">
                                        <Label>Grant access to roles</Label>

                                        {selectedRoles.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRoles.map(roleId => {
                                                    const role = roles.find(r => r.id === roleId)
                                                    return role ? (
                                                        <Badge
                                                            key={roleId}
                                                            variant="secondary"
                                                            className="flex items-center gap-2 py-1 px-2 pr-1"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                            <span>{role.name}</span>
                                                            <button
                                                                type="button"
                                                                className="h-5 w-5 rounded-sm hover:bg-destructive/20 flex items-center justify-center"
                                                                onClick={() => handleRoleClick(roleId)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ) : null
                                                })}
                                            </div>
                                        )}

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search roles..."
                                                value={roleSearch}
                                                onChange={(e) => setRoleSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>

                                        <ScrollArea className="h-[200px] border rounded-md">
                                            <div className="p-2 space-y-1">
                                                {filteredRoles.length === 0 ? (
                                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                                        No roles found
                                                    </div>
                                                ) : (
                                                    filteredRoles.map(role => {
                                                        const isSelected = selectedRoles.includes(role.id)
                                                        return (
                                                            <button
                                                                key={role.id}
                                                                type="button"
                                                                onClick={() => handleRoleClick(role.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                                                                    "hover:bg-accent cursor-pointer",
                                                                    isSelected && "bg-accent"
                                                                )}
                                                            >
                                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium">{role.name}</div>
                                                                </div>
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4 flex-shrink-0",
                                                                        isSelected ? "opacity-100 text-primary" : "opacity-0"
                                                                    )}
                                                                />
                                                            </button>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Report'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
