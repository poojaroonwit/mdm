'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  User,
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle
} from 'lucide-react'
import { ModuleDetail } from './ModuleDetail'
import { ModuleFormDialog } from './ModuleFormDialog'
import { showError, showSuccess } from '@/lib/toast-utils'
import { format } from 'date-fns'

export interface Module {
  id: string
  name: string
  description?: string | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate?: string | null
  targetDate?: string | null
  progress?: number
  totalTickets?: number
  completedTickets?: number
  creator: {
    id: string
    name: string | null
    email: string
    avatar?: string | null
  }
  lead?: {
    id: string
    name: string | null
    email: string
    avatar?: string | null
  } | null
  project: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface ModuleListProps {
  projectId: string
  spaceId: string
  onModuleClick?: (module: Module) => void
}

export interface ModuleFormData {
  name: string
  description: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  targetDate: string
  leadId: string
}

const statusConfig = {
  PLANNED: {
    label: 'Planned',
    icon: Clock,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300'
  }
}

export function ModuleList({ projectId, spaceId, onModuleClick }: ModuleListProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string; avatar?: string | null }>>([])

  const [formData, setFormData] = useState<ModuleFormData>({
    name: '',
    description: '',
    status: 'PLANNED',
    startDate: '',
    targetDate: '',
    leadId: ''
  })

  useEffect(() => {
    loadModules()
    loadUsers()
  }, [projectId])

  const loadModules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modules?project_id=${projectId}`)
      if (!response.ok) throw new Error('Failed to load modules')
      const data = await response.json()
      setModules(data.modules || [])
    } catch (error) {
      console.error('Error loading modules:', error)
      showError('Failed to load modules')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch(`/api/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData,
          leadId: formData.leadId || null,
          startDate: formData.startDate || null,
          targetDate: formData.targetDate || null
        })
      })

      if (!response.ok) throw new Error('Failed to create module')
      
      showSuccess('Module created successfully')
      
      setIsCreateDialogOpen(false)
      resetForm()
      loadModules()
    } catch (error) {
      showError('Failed to create module')
    }
  }

  const handleUpdate = async () => {
    if (!editingModule) return

    try {
      const response = await fetch(`/api/modules/${editingModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          leadId: formData.leadId || null,
          startDate: formData.startDate || null,
          targetDate: formData.targetDate || null
        })
      })

      if (!response.ok) throw new Error('Failed to update module')
      
      showSuccess('Module updated successfully')
      
      setEditingModule(null)
      resetForm()
      loadModules()
    } catch (error) {
      showError('Failed to update module')
    }
  }

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return

    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete module')
      
      showSuccess('Module deleted successfully')
      
      loadModules()
    } catch (error) {
      showError('Failed to delete module')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'PLANNED',
      startDate: '',
      targetDate: '',
      leadId: ''
    })
  }

  const openEditDialog = (module: Module) => {
    setEditingModule(module)
    setFormData({
      name: module.name,
      description: module.description || '',
      status: module.status,
      startDate: module.startDate ? format(new Date(module.startDate), "yyyy-MM-dd'T'HH:mm") : '',
      targetDate: module.targetDate ? format(new Date(module.targetDate), "yyyy-MM-dd'T'HH:mm") : '',
      leadId: module.lead?.id || ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    )
  }

  if (selectedModule) {
    return (
      <ModuleDetail
        moduleId={selectedModule.id}
        onBack={() => setSelectedModule(null)}
        onTicketClick={(ticketId) => {
          // Could open ticket detail modal
          console.log('View ticket:', ticketId)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Modules
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your project into manageable modules
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Module
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first module to organize your project work
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const statusInfo = statusConfig[module.status]
            const StatusIcon = statusInfo.icon

            return (
              <Card
                key={module.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedModule(module)
                  onModuleClick?.(module)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{module.name}</CardTitle>
                      {module.description && (
                        <CardDescription className="line-clamp-2">
                          {module.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(module)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(module.id)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Progress */}
                  {module.totalTickets !== undefined && module.totalTickets > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {module.completedTickets || 0} / {module.totalTickets}
                        </span>
                      </div>
                      <Progress value={module.progress || 0} className="h-2" />
                    </div>
                  )}

                  {/* Dates */}
                  {(module.startDate || module.targetDate) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {module.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {format(new Date(module.startDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {module.targetDate && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Target: {format(new Date(module.targetDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lead */}
                  {module.lead && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={module.lead.avatar || undefined} />
                        <AvatarFallback>
                          {module.lead.name?.[0] || module.lead.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        {module.lead.name || module.lead.email}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ModuleFormDialog
        open={isCreateDialogOpen || editingModule !== null}
        editingModule={editingModule}
        formData={formData}
        users={users}
        onOpenChange={setIsCreateDialogOpen}
        onFormDataChange={setFormData}
        onReset={resetForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onClearEditingModule={() => setEditingModule(null)}
      />
    </div>
  )
}

