'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  HardDrive,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StorageProviderType } from '@/lib/storage-config'
import { StorageConnectionDialog } from './StorageConnectionDialog'
import { STORAGE_TYPES, StorageConnectionFormData } from './StorageConnectionForm'

interface StorageConnection {
  id: string
  name: string
  type: StorageProviderType
  config: any
  isActive: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastTested: string | null
  lastError: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

interface StorageConnectionsProps {
  hideHeader?: boolean
}

export function StorageConnections({ hideHeader = false }: StorageConnectionsProps) {
  const [connections, setConnections] = useState<StorageConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingConnection, setEditingConnection] = useState<StorageConnection | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/storage/connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error loading connections:', error)
      toast.error('Failed to load storage connections')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: StorageConnectionFormData) => {
    try {
      const payload = {
        name: data.name,
        type: data.type,
        description: data.description,
        isActive: data.isActive,
        config: data.config,
      }

      if (editingConnection) {
        const response = await fetch(`/api/admin/storage/connections/${editingConnection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Failed to update')
        toast.success('Storage connection updated successfully')
      } else {
        const response = await fetch('/api/admin/storage/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Failed to create')
        toast.success('Storage connection created successfully')
      }

      setShowDialog(false)
      loadConnections()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save storage connection')
      throw error
    }
  }

  const handleDelete = async (connection: StorageConnection) => {
    if (!confirm(`Are you sure you want to delete ${connection.name}?`)) return

    try {
      const response = await fetch(`/api/admin/storage/connections/${connection.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Storage connection deleted successfully')
      loadConnections()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete storage connection')
    }
  }

  const handleTest = async (connection: StorageConnection) => {
    setTestingId(connection.id)
    try {
      const response = await fetch(`/api/admin/storage/connections/${connection.id}/test`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Connection test successful')
      } else {
        toast.error(data.error || 'Connection test failed')
      }
      loadConnections()
    } catch (error: any) {
      toast.error('Failed to test connection')
    } finally {
      setTestingId(null)
    }
  }

  const openEdit = (connection: StorageConnection) => {
    setEditingConnection(connection)
    setShowDialog(true)
  }

  const openCreate = () => {
    setEditingConnection(null)
    setShowDialog(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <HardDrive className="h-6 w-6" />
              Storage Connections
            </h2>
            <p className="text-muted-foreground">
              Manage storage connections for MinIO, S3, SFTP, OneDrive, and Google Drive
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Storage Connections</CardTitle>
          <CardDescription>
            Configure and manage your storage provider connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No storage connections found. Click "Add Connection" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Tested</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => {
                  const typeInfo = STORAGE_TYPES.find((t) => t.value === connection.type)
                  const TypeIcon = typeInfo?.icon || HardDrive
                  return (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium">{connection.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          {typeInfo?.label || connection.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connection.status)}
                          <Badge
                            variant={
                              connection.status === 'connected'
                                ? 'default'
                                : connection.status === 'error'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {connection.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {connection.lastTested
                          ? new Date(connection.lastTested).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {connection.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(connection)}
                            disabled={testingId === connection.id}
                          >
                            {testingId === connection.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(connection)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(connection)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StorageConnectionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        initialData={editingConnection ? {
          name: editingConnection.name,
          type: editingConnection.type,
          description: editingConnection.description || '',
          isActive: editingConnection.isActive,
          config: editingConnection.config,
        } : undefined}
        onSubmit={handleSave}
        title={editingConnection ? 'Edit Storage Connection' : 'Create Storage Connection'}
        description={editingConnection ? 'Update storage connection settings' : 'Configure a new storage connection'}
      />
    </div>
  )
}
