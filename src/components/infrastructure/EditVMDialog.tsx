'use client'

import { useState, useEffect, Fragment } from 'react'
import { InfrastructureInstance, InstanceService } from '@/features/infrastructure/types'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Settings, RefreshCw, Trash2, MoreVertical, ExternalLink, Edit } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast-utils'
import { ServiceManagement } from '@/features/infrastructure/components/ServiceManagement'

interface EditVMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vm: InfrastructureInstance | null
  onSuccess?: () => void
}

export function EditVMDialog({ open, onOpenChange, vm, onSuccess }: EditVMDialogProps) {
  const [name, setName] = useState('')
  const [port, setPort] = useState<number>(22)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [terminalTheme, setTerminalTheme] = useState('default')
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<InstanceService[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceType, setNewServiceType] = useState<'docker_container' | 'systemd_service' | 'application'>('docker_container')
  const [addingService, setAddingService] = useState(false)
  const [selectedService, setSelectedService] = useState<InstanceService | null>(null)
  const [showServiceConfig, setShowServiceConfig] = useState(false)
  const [configuringService, setConfiguringService] = useState<InstanceService | null>(null)

  useEffect(() => {
    if (vm) {
      setName(vm.name || '')
      setPort(vm.port || 22)
      setUsername(vm.connectionConfig?.username || '')
      setPassword('') // Don't pre-fill password for security
      setTerminalTheme(vm.connectionConfig?.terminalTheme || 'default')
      fetchServices()
    }
  }, [vm, open])

  const fetchServices = async () => {
    if (!vm) return
    setLoadingServices(true)
    try {
      const response = await fetch(`/api/infrastructure/instances/${vm.id}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoadingServices(false)
    }
  }

  const handleAddService = async () => {
    if (!vm || !newServiceName) return

    setAddingService(true)
    try {
      const response = await fetch(`/api/infrastructure/instances/${vm.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceName,
          type: newServiceType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add service')
      }

      showSuccess('Service added successfully')
      setNewServiceName('')
      setShowAddService(false)
      fetchServices()
    } catch (error) {
      console.error('Error adding service:', error)
      showError('Failed to add service')
    } finally {
      setAddingService(false)
    }
  }

  const handleRemoveService = async (serviceId: string) => {
    if (!vm || !confirm('Are you sure you want to remove this service?')) return

    try {
      const response = await fetch(`/api/infrastructure/services/${serviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove service')
      }

      showSuccess('Service removed successfully')
      fetchServices()
    } catch (error) {
      console.error('Error removing service:', error)
      showError('Failed to remove service')
    }
  }

  const handleServiceClick = (service: InstanceService) => {
    setSelectedService(service)
  }

  const handleOpenServiceManagement = (service: InstanceService) => {
    setSelectedService(service)
  }

  const handleConfigureService = (service: InstanceService) => {
    setConfiguringService(service)
    setShowServiceConfig(true)
  }

  const handleUpdateServiceConfig = async (serviceId: string, updates: { name?: string; serviceConfig?: Record<string, any> }) => {
    if (!vm) return

    try {
      const response = await fetch(`/api/infrastructure/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update service')
      }

      showSuccess('Service updated successfully')
      setShowServiceConfig(false)
      setConfiguringService(null)
      fetchServices()
    } catch (error) {
      console.error('Error updating service:', error)
      showError('Failed to update service')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vm) return

    setLoading(true)
    try {
      const response = await fetch(`/api/infrastructure/instances/${vm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          port,
          connectionConfig: {
            ...vm.connectionConfig,
            username,
            password: password || undefined, // Only send if changed
            terminalTheme,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update VM')
      }

      showSuccess('VM updated successfully')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating VM:', error)
      showError('Failed to update VM')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Fragment>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit VM</DialogTitle>
          <DialogDescription>
            Update VM settings including name, port, credentials, terminal theme, and associated services.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VM Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 22)}
              placeholder="22"
              min={1}
              max={65535}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="SSH Username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty to keep current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terminalTheme">Terminal Theme</Label>
            <Select value={terminalTheme} onValueChange={setTerminalTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select terminal theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="monokai">Monokai</SelectItem>
                <SelectItem value="solarized">Solarized</SelectItem>
              </SelectContent>
            </Select>
          </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Associated Services</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchServices}
                  disabled={loadingServices}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingServices ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAddService(!showAddService)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </Button>
              </div>
            </div>

            {/* Add Service Form */}
            {showAddService && (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name</Label>
                  <Input
                    id="serviceName"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Enter service name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={newServiceType} onValueChange={(value: any) => setNewServiceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docker_container">Docker Container</SelectItem>
                      <SelectItem value="systemd_service">Systemd Service</SelectItem>
                      <SelectItem value="application">Application</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddService}
                    disabled={!newServiceName || addingService}
                    size="sm"
                  >
                    {addingService ? 'Adding...' : 'Add Service'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddService(false)
                      setNewServiceName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Services List */}
            {loadingServices ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services associated with this VM.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Management Plugin</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow 
                        key={service.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleServiceClick(service)}
                      >
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={service.status} />
                        </TableCell>
                        <TableCell>
                          {service.managementPluginId ? (
                            <Badge variant="secondary">Assigned</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenServiceManagement(service)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Service Management
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConfigureService(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Configurable
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveService(service.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Service Management Dialog - Rendered outside EditVMDialog */}
    {selectedService && vm && (
      <ServiceManagement
        service={selectedService}
        instance={vm}
        onClose={() => setSelectedService(null)}
      />
    )}

    {/* Service Configuration Dialog */}
    {showServiceConfig && configuringService && (
      <ServiceConfigDialog
        open={showServiceConfig}
        onOpenChange={setShowServiceConfig}
        service={configuringService}
        onSave={(updates) => handleUpdateServiceConfig(configuringService.id, updates)}
      />
    )}
    </Fragment>
  )
}

// Service Configuration Dialog Component
interface ServiceConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: InstanceService
  onSave: (updates: { name?: string; serviceConfig?: Record<string, any> }) => void
}

function ServiceConfigDialog({ open, onOpenChange, service, onSave }: ServiceConfigDialogProps) {
  const [name, setName] = useState(service.name)
  const [serviceConfig, setServiceConfig] = useState<Record<string, any>>(service.serviceConfig || {})
  const [configJson, setConfigJson] = useState(JSON.stringify(service.serviceConfig || {}, null, 2))
  const [saving, setSaving] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(service.name)
      setServiceConfig(service.serviceConfig || {})
      setConfigJson(JSON.stringify(service.serviceConfig || {}, null, 2))
      setConfigError(null)
    }
  }, [open, service])

  const handleSave = () => {
    setConfigError(null)
    let parsedConfig = serviceConfig

    // Try to parse JSON if it's a string
    try {
      parsedConfig = JSON.parse(configJson)
      setServiceConfig(parsedConfig)
    } catch (e) {
      setConfigError('Invalid JSON format')
      return
    }

    setSaving(true)
    onSave({
      name: name !== service.name ? name : undefined,
      serviceConfig: parsedConfig,
    })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Service</DialogTitle>
          <DialogDescription>
            Rename the service or update its configuration (e.g., client keys, endpoints, etc.)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceConfig">Service Configuration (JSON)</Label>
            <textarea
              id="serviceConfig"
              value={configJson}
              onChange={(e) => {
                setConfigJson(e.target.value)
                setConfigError(null)
              }}
              className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
              placeholder='{"clientKey": "value", "endpoint": "url", ...}'
            />
            {configError && (
              <p className="text-sm text-destructive">{configError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !!configError}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

