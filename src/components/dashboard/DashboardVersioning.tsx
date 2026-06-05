'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/date-formatters'
import { formatFileSize } from '@/lib/formatters'
import { 
  History, 
  Save, 
  RotateCcw, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  GitBranch,
  Clock,
  User,
  MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardVersion {
  id: string
  version: string
  name: string
  description: string
  created_at: string
  created_by: string
  is_current: boolean
  changes: string[]
  element_count: number
  size: number
}

interface DashboardVersioningProps {
  dashboardId: string
  currentDashboard: any
  onVersionSelect: (version: DashboardVersion) => void
  onVersionCreate: (version: Omit<DashboardVersion, 'id' | 'created_at' | 'created_by'>) => void
  onVersionRestore: (versionId: string) => void
  onVersionDelete: (versionId: string) => void
}

export function DashboardVersioning({
  dashboardId,
  currentDashboard,
  onVersionSelect,
  onVersionCreate,
  onVersionRestore,
  onVersionDelete
}: DashboardVersioningProps) {
  const [versions, setVersions] = useState<DashboardVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newVersion, setNewVersion] = useState({
    name: '',
    description: '',
    changes: ['']
  })

  // Mock versions for demonstration
  const mockVersions: DashboardVersion[] = [
    {
      id: '1',
      version: '1.0.0',
      name: 'Initial Dashboard',
      description: 'First version of the dashboard',
      created_at: '2024-01-15T10:00:00Z',
      created_by: 'John Doe',
      is_current: false,
      changes: ['Created initial dashboard layout', 'Added basic charts'],
      element_count: 5,
      size: 1024
    },
    {
      id: '2',
      version: '1.1.0',
      name: 'Added Sales Metrics',
      description: 'Added sales performance charts and KPIs',
      created_at: '2024-01-16T14:30:00Z',
      created_by: 'Jane Smith',
      is_current: false,
      changes: ['Added sales revenue chart', 'Added customer metrics', 'Updated color scheme'],
      element_count: 8,
      size: 1536
    },
    {
      id: '3',
      version: '1.2.0',
      name: 'Current Version',
      description: 'Latest version with all features',
      created_at: '2024-01-17T09:15:00Z',
      created_by: 'John Doe',
      is_current: true,
      changes: ['Added interactive filtering', 'Improved mobile responsiveness', 'Added export functionality'],
      element_count: 12,
      size: 2048
    }
  ]

  useEffect(() => {
    loadVersions()
  }, [dashboardId])

  const loadVersions = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setVersions(mockVersions)
    } catch (error) {
      toast.error('Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!newVersion.name.trim()) {
      toast.error('Version name is required')
      return
    }

    try {
      const versionData = {
        version: generateNextVersion(versions),
        name: newVersion.name,
        description: newVersion.description,
        is_current: false,
        changes: newVersion.changes.filter(change => change.trim()),
        element_count: currentDashboard?.elements?.length || 0,
        size: JSON.stringify(currentDashboard).length
      }

      onVersionCreate(versionData)
      setNewVersion({ name: '', description: '', changes: [''] })
      setShowCreateDialog(false)
      toast.success('Version created successfully')
    } catch (error) {
      toast.error('Failed to create version')
    }
  }

  const generateNextVersion = (existingVersions: DashboardVersion[]): string => {
    const latestVersion = existingVersions[0]?.version || '0.0.0'
    const [major, minor, patch] = latestVersion.split('.').map(Number)
    return `${major}.${minor + 1}.0`
  }


  const handleRestoreVersion = (versionId: string) => {
    onVersionRestore(versionId)
    toast.success('Version restored successfully')
  }

  const handleDeleteVersion = (versionId: string) => {
    onVersionDelete(versionId)
    toast.success('Version deleted successfully')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Dashboard Versions</h2>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Version
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Version History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Elements</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id} className={version.is_current ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={version.is_current ? 'current' : 'draft'} label={version.version} />
                      {version.is_current && (
                        <StatusBadge status="current" size="sm" className="text-xs" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{version.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {version.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(version.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <User className="h-3 w-3" />
                      <span>{version.created_by}</span>
                    </div>
                  </TableCell>
                  <TableCell>{version.element_count}</TableCell>
                  <TableCell>{formatFileSize(version.size)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{version.name} - {version.version}</DialogTitle>
                            <DialogDescription>
                              View details and changes for this dashboard version.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Description</Label>
                              <p className="text-sm text-muted-foreground">{version.description}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Changes</Label>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {version.changes.map((change, index) => (
                                  <li key={index}>{change}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="font-medium">Created</Label>
                                <p className="text-muted-foreground">{formatDateTime(version.created_at)}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Author</Label>
                                <p className="text-muted-foreground">{version.created_by}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {!version.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreVersion(version.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVersion(version.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of your dashboard to track changes and maintain version history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={newVersion.name}
                onChange={(e) => setNewVersion(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Added new charts"
              />
            </div>
            <div>
              <Label htmlFor="version-description">Description</Label>
              <Textarea
                id="version-description"
                value={newVersion.description}
                onChange={(e) => setNewVersion(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what changed in this version"
                rows={3}
              />
            </div>
            <div>
              <Label>Changes</Label>
              <div className="space-y-2">
                {newVersion.changes.map((change, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={change}
                      onChange={(e) => {
                        const newChanges = [...newVersion.changes]
                        newChanges[index] = e.target.value
                        setNewVersion(prev => ({ ...prev, changes: newChanges }))
                      }}
                      placeholder="Describe a change"
                    />
                    {newVersion.changes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newChanges = newVersion.changes.filter((_, i) => i !== index)
                          setNewVersion(prev => ({ ...prev, changes: newChanges }))
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewVersion(prev => ({ ...prev, changes: [...prev.changes, ''] }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Change
                </Button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVersion}>
                <Save className="h-4 w-4 mr-2" />
                Create Version
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
