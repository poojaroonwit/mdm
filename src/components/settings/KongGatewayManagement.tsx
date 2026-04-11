'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Network,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  TestTube,
  Eye,
  EyeOff,
  Server,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface KongInstance {
  id: string
  name: string
  adminUrl: string
  adminApiKey?: string | null
  description?: string | null
  isActive: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: string | null
  metadata?: any
  createdAt: string
  updatedAt: string
}

export function KongGatewayManagement() {
  const [instances, setInstances] = useState<KongInstance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<KongInstance | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    adminUrl: '',
    adminApiKey: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    loadInstances()
  }, [])

  const loadInstances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/kong-instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances || [])
      } else {
        toast.error('Failed to load Kong instances')
      }
    } catch (error) {
      console.error('Error loading Kong instances:', error)
      toast.error('Failed to load Kong instances')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (instance?: KongInstance) => {
    if (instance) {
      setSelectedInstance(instance)
      setFormData({
        name: instance.name,
        adminUrl: instance.adminUrl,
        adminApiKey: instance.adminApiKey || '',
        description: instance.description || '',
        isActive: instance.isActive,
      })
    } else {
      setSelectedInstance(null)
      setFormData({
        name: '',
        adminUrl: '',
        adminApiKey: '',
        description: '',
        isActive: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedInstance(null)
    setFormData({
      name: '',
      adminUrl: '',
      adminApiKey: '',
      description: '',
      isActive: true,
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.adminUrl) {
      toast.error('Name and Admin URL are required')
      return
    }

    try {
      const url = selectedInstance
        ? `/api/admin/kong-instances/${selectedInstance.id}`
        : '/api/admin/kong-instances'
      const method = selectedInstance ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          adminUrl: formData.adminUrl,
          adminApiKey: formData.adminApiKey || null,
          description: formData.description || null,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast.success(
          selectedInstance
            ? 'Kong instance updated successfully'
            : 'Kong instance created successfully'
        )
        handleCloseDialog()
        loadInstances()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save Kong instance')
      }
    } catch (error) {
      console.error('Error saving Kong instance:', error)
      toast.error('Failed to save Kong instance')
    }
  }

  const handleDelete = async () => {
    if (!selectedInstance) return

    try {
      const response = await fetch(
        `/api/admin/kong-instances/${selectedInstance.id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Kong instance deleted successfully')
        setIsDeleteDialogOpen(false)
        setSelectedInstance(null)
        loadInstances()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete Kong instance')
      }
    } catch (error) {
      console.error('Error deleting Kong instance:', error)
      toast.error('Failed to delete Kong instance')
    }
  }

  const handleTestConnection = async (instance: KongInstance) => {
    setIsTesting(instance.id)
    try {
      const response = await fetch(
        `/api/admin/kong-instances/${instance.id}/test`,
        {
          method: 'POST',
        }
      )

      const data = await response.json()

      if (data.connected) {
        toast.success('Successfully connected to Kong')
        loadInstances()
      } else {
        toast.error(data.error || 'Failed to connect to Kong')
      }
    } catch (error) {
      console.error('Error testing Kong connection:', error)
      toast.error('Failed to test Kong connection')
    } finally {
      setIsTesting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        )
    }
  }

  const maskApiKey = (key: string | null | undefined) => {
    if (!key) return 'Not set'
    if (key.length <= 8) return '••••••••'
    return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <Network className="h-6 w-6 text-primary" />
              <span>Kong Gateway Management</span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Manage Kong Gateway instances and connect to remote Kong servers
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={loadInstances} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Instance
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && instances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Loading instances...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-8">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No Kong instances configured</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Instance
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Server className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-lg">{instance.name}</div>
                        {instance.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {instance.description}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(instance.status)}
                      {!instance.isActive && (
                        <Badge variant="outline" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Admin URL:</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {instance.adminUrl}
                        </code>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">API Key:</span>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {showApiKey[instance.id]
                              ? instance.adminApiKey || 'Not set'
                              : maskApiKey(instance.adminApiKey)}
                          </code>
                          {instance.adminApiKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() =>
                                setShowApiKey((prev) => ({
                                  ...prev,
                                  [instance.id]: !prev[instance.id],
                                }))
                              }
                            >
                              {showApiKey[instance.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      {instance.lastConnected && (
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">Last Connected:</span>
                          <span>{new Date(instance.lastConnected).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(instance)}
                      disabled={isTesting === instance.id}
                    >
                      <TestTube
                        className={`h-4 w-4 mr-2 ${isTesting === instance.id ? 'animate-spin' : ''}`}
                      />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(instance)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedInstance(instance)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Kong Gateway Management
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>
                  Connect to Kong Gateway instances running on remote servers. The Admin API URL
                  should point to your Kong Admin API endpoint (typically on port 8001).
                </p>
                <p>
                  If your Kong instance requires authentication, provide an Admin API key. The API
                  key will be securely stored using your configured secrets management backend.
                </p>
                <p className="mt-2 font-medium">
                  Example Admin URL: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">http://kong-server:8001</code> or <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">https://kong.example.com:8001</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInstance ? 'Edit Kong Instance' : 'Add Kong Instance'}
            </DialogTitle>
            <DialogDescription>
              Configure connection to a Kong Gateway Admin API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production Kong"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminUrl">Admin API URL *</Label>
              <Input
                id="adminUrl"
                value={formData.adminUrl}
                onChange={(e) => setFormData({ ...formData, adminUrl: e.target.value })}
                placeholder="http://kong-server:8001"
              />
              <p className="text-xs text-muted-foreground">
                The URL of your Kong Admin API endpoint
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminApiKey">Admin API Key (Optional)</Label>
              <Input
                id="adminApiKey"
                type="password"
                value={formData.adminApiKey}
                onChange={(e) => setFormData({ ...formData, adminApiKey: e.target.value })}
                placeholder="Leave empty if no authentication required"
              />
              <p className="text-xs text-muted-foreground">
                API key for Kong Admin API authentication (if enabled)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Production Kong Gateway instance"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this instance
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedInstance ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the Kong instance
              configuration. The Kong Gateway server itself will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

