'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInfrastructureInstances } from '../hooks/useInfrastructureInstances'
import { useMarketplacePlugins } from '@/features/marketplace/hooks/useMarketplacePlugins'
import { PluginDefinition } from '@/features/marketplace/types'
import { InfrastructureInstance } from '../types'
import { showSuccess, showError } from '@/lib/toast-utils'
import { Loader, Search, Settings, ExternalLink, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId?: string | null
  onSuccess: () => void
}

export function AddServiceDialog({
  open,
  onOpenChange,
  spaceId,
  onSuccess,
}: AddServiceDialogProps) {
  const [step, setStep] = useState<'select-service' | 'configure'>('select-service')
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDefinition | null>(null)
  const [selectedVmId, setSelectedVmId] = useState<string>('')
  const [serviceName, setServiceName] = useState('')
  const [config, setConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Fetch only installed plugins with management UI (service-management category)
  const { plugins, loading: loadingPlugins } = useMarketplacePlugins({
    category: 'service-management',
    spaceId,
    filters: {
      status: 'approved',
      verified: true,
      installedOnly: true, // Only show installed plugins
    },
  })

  // Fetch VMs
  const { instances, loading: loadingVms } = useInfrastructureInstances({
    spaceId,
    filters: {
      type: 'vm',
    },
  })

  // Filter plugins that have management UI
  const pluginsWithManagementUI = plugins.filter(
    (plugin) => plugin.uiType === 'react_component' && plugin.uiConfig?.componentPath
  )

  // Filter plugins by search query
  const filteredPlugins = pluginsWithManagementUI.filter((plugin) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      plugin.name.toLowerCase().includes(query) ||
      plugin.description?.toLowerCase().includes(query) ||
      plugin.slug.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    if (open) {
      setStep('select-service')
      setSelectedPlugin(null)
      setSelectedVmId('')
      setServiceName('')
      setConfig({})
      setSearchQuery('')
    }
  }, [open])

  const handlePluginSelect = (plugin: PluginDefinition) => {
    setSelectedPlugin(plugin)
    setStep('configure')
    // Set default service name based on plugin
    if (!serviceName) {
      setServiceName(plugin.name.toLowerCase().replace(/\s+/g, '-'))
    }
  }

  const handleBack = () => {
    setStep('select-service')
    setSelectedPlugin(null)
    setConfig({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!serviceName) {
      showError('Please enter a service name')
      return
    }

    if (!selectedPlugin) {
      showError('Please select a service')
      return
    }

    // For remote services, endpoint is required
    if (!selectedVmId && !config.endpoint) {
      showError('Please enter a service endpoint for remote connections')
      return
    }

    setLoading(true)

    try {
      // Determine service type from plugin capabilities
      const serviceType = selectedPlugin.capabilities?.serviceType || 'docker_container'

      // Prepare service data
      const serviceData: any = {
        name: serviceName,
        type: serviceType,
        managementPluginId: selectedPlugin.id,
        managementConfig: {
          ...config,
          isRemote: !selectedVmId,
          remoteEndpoint: !selectedVmId ? config.endpoint : undefined,
        },
      }

      // Add endpoints if remote service
      if (!selectedVmId && config.endpoint) {
        try {
          const url = new URL(config.endpoint.startsWith('http') ? config.endpoint : `http://${config.endpoint}`)
          serviceData.endpoints = [{
            url: url.hostname,
            port: config.port || url.port || (url.protocol === 'https:' ? 443 : 80),
            protocol: url.protocol.replace(':', ''),
          }]
        } catch {
          // If URL parsing fails, use endpoint as-is
          serviceData.endpoints = [{
            url: config.endpoint,
            port: config.port,
            protocol: 'http',
          }]
        }
      }

      let response
      if (selectedVmId) {
        // Create service on VM
        response = await fetch(`/api/infrastructure/instances/${selectedVmId}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        })
      } else {
        // Create remote service (without VM)
        // We'll need to create a special endpoint or use a default VM
        // For now, we'll create it as a remote service that can be managed independently
        response = await fetch('/api/infrastructure/services/remote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...serviceData,
            spaceId: spaceId,
          }),
        })
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create service')
      }

      showSuccess(`Service "${serviceName}" added successfully. You can add more ${selectedPlugin.name} instances from different sources.`)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to create service')
    } finally {
      setLoading(false)
    }
  }

  const selectedVm = instances.find(vm => vm.id === selectedVmId)

  // Render configuration form based on plugin
  const renderConfigForm = () => {
    if (!selectedPlugin) return null

    // Determine if this is a remote service (no VM selected)
    const isRemoteService = !selectedVmId

    // Default configuration fields - endpoint is required for remote services
    const defaultFields = [
      { 
        key: 'endpoint', 
        label: 'Service Endpoint *', 
        type: 'text', 
        placeholder: 'http://kong.example.com:8001 or https://minio.example.com:9000',
        required: isRemoteService,
        helpText: isRemoteService ? 'Required for remote service connections' : 'Optional - defaults to VM host if not provided'
      },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API key if required', required: false },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Enter username if required', required: false },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password if required', required: false },
      { key: 'port', label: 'Port', type: 'number', placeholder: 'Optional port override', required: false },
    ]

    return (
      <div className="space-y-4">
        {isRemoteService && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Remote Service Connection:</strong> This service will connect to an external endpoint. 
              You can add multiple instances of {selectedPlugin.name} from different remote sources.
            </p>
          </div>
        )}
        {defaultFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.helpText && (
                <span className="text-xs text-muted-foreground ml-2">({field.helpText})</span>
              )}
            </Label>
            <Input
              id={field.key}
              type={field.type}
              value={config[field.key] || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-service' ? 'Add Service' : `Configure ${selectedPlugin?.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-service' 
              ? 'Select a service with management UI to add to your infrastructure'
              : 'Configure the service and select a VM to deploy it on'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-service' ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Plugin Cards */}
            {loadingPlugins ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPlugins.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="text-muted-foreground">
                  {searchQuery ? (
                    <p>No installed services found matching your search</p>
                  ) : (
                    <>
                      <p className="mb-2">No installed service management plugins available</p>
                      <p className="text-sm">Install plugins from the marketplace to use them here</p>
                    </>
                  )}
                </div>
                {!searchQuery && (
                  <Button
                    onClick={() => {
                      onOpenChange(false)
                      router.push('/marketplace?category=service-management')
                    }}
                    variant="default"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Browse Marketplace
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                {filteredPlugins.map((plugin) => (
                  <Card
                    key={plugin.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${plugin.isCompliance || plugin.securityAudit ? 'card-compliance' : ''}`}
                    onClick={() => handlePluginSelect(plugin)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {plugin.iconUrl && !failedIcons.has(plugin.id) ? (
                            <img
                              src={plugin.iconUrl}
                              alt={plugin.name}
                              className="w-6 h-6 rounded"
                              onError={() => setFailedIcons(prev => new Set(prev).add(plugin.id))}
                            />
                          ) : (
                            <Settings className="h-5 w-5" />
                          )}
                          {plugin.name}
                        </CardTitle>
                        {plugin.verified && (
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {plugin.description || 'Service management plugin'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {plugin.capabilities?.serviceType || 'docker_container'}
                        </Badge>
                        {plugin.version && (
                          <Badge variant="outline" className="text-xs">
                            v{plugin.version}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Selected Plugin Info */}
              {selectedPlugin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selectedPlugin.iconUrl && !failedIcons.has(selectedPlugin.id) ? (
                        <img
                          src={selectedPlugin.iconUrl}
                          alt={selectedPlugin.name}
                          className="w-5 h-5 rounded"
                          onError={() => setFailedIcons(prev => new Set(prev).add(selectedPlugin.id))}
                        />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                      {selectedPlugin.name}
                    </CardTitle>
                    <CardDescription>{selectedPlugin.description}</CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* VM Selection (Optional for remote services) */}
              <div className="space-y-2">
                <Label htmlFor="vm">VM (Optional - for remote services)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select a VM if the service runs on a managed VM, or leave empty for remote service connections
                </p>
                {loadingVms ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading VMs...
                  </div>
                ) : instances.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    No VMs available. You can still add remote services without a VM.
                  </div>
                ) : (
                  <Select value={selectedVmId} onValueChange={setSelectedVmId}>
                    <SelectTrigger id="vm">
                      <SelectValue placeholder="Select a VM (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Remote Service)</SelectItem>
                      {instances.map((vm) => (
                        <SelectItem key={vm.id} value={vm.id}>
                          {vm.name} ({vm.host}{vm.port ? `:${vm.port}` : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedVm && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedVm.name} - {selectedVm.host}
                  </p>
                )}
                {!selectedVmId && (
                  <p className="text-xs text-muted-foreground">
                    Remote service: Will connect to external service endpoint
                  </p>
                )}
              </div>

              {/* Service Name */}
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Enter service name"
                  required
                />
              </div>

              {/* Configuration Fields */}
              {renderConfigForm()}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !serviceName || (!selectedVmId && !config.endpoint)}
              >
                {loading ? 'Adding...' : 'Add Service'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'select-service' && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
