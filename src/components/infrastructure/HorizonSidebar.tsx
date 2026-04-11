'use client'

import { useState, useEffect, useMemo } from 'react'
import { useInfrastructureInstances } from '@/features/infrastructure/hooks/useInfrastructureInstances'
import { InfrastructureInstance, InstanceService } from '@/features/infrastructure/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Server, X, ChevronDown, ChevronRight, Settings, Activity, MoreVertical, Shield, Trash2, RotateCw, Edit, Terminal, Key, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HorizonSidebarProps {
  selectedVmId?: string | null
  onVmSelect?: (vm: InfrastructureInstance) => void
  selectedServiceId?: string | null
  onServiceSelect?: (service: InstanceService, instance: InfrastructureInstance) => void
  spaceId?: string | null
  onVmPermission?: (vm: InfrastructureInstance) => void
  onVmRemove?: (vm: InfrastructureInstance) => void
  onVmReboot?: (vm: InfrastructureInstance) => void
  onVmEdit?: (vm: InfrastructureInstance) => void
  onVmAccess?: (vm: InfrastructureInstance) => void
  onAddVm?: () => void
}

interface InstanceWithServices extends InfrastructureInstance {
  services: InstanceService[]
  servicesLoading: boolean
}

export function HorizonSidebar({
  selectedVmId,
  onVmSelect,
  selectedServiceId,
  onServiceSelect,
  spaceId,
  onVmPermission,
  onVmRemove,
  onVmReboot,
  onVmEdit,
  onVmAccess,
  onAddVm,
}: HorizonSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'vms' | 'services'>('vms')
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(new Set())
  const [instancesWithServices, setInstancesWithServices] = useState<InstanceWithServices[]>([])
  const [loadingServices, setLoadingServices] = useState(false)

  const { instances, loading } = useInfrastructureInstances({
    spaceId,
    filters: {
      type: 'vm',
    },
  })

  // Fetch services for all instances
  useEffect(() => {
    const fetchAllServices = async () => {
      if (instances.length === 0) {
        setInstancesWithServices([])
        return
      }

      setLoadingServices(true)
      try {
        const servicesPromises = instances.map(async (instance) => {
          try {
            const response = await fetch(`/api/infrastructure/instances/${instance.id}/services`)
            if (response.ok) {
              const data = await response.json()
              return {
                ...instance,
                services: data.services || [],
                servicesLoading: false,
              }
            }
            return {
              ...instance,
              services: [],
              servicesLoading: false,
            }
          } catch (error) {
            console.error(`Error fetching services for instance ${instance.id}:`, error)
            return {
              ...instance,
              services: [],
              servicesLoading: false,
            }
          }
        })

        const results = await Promise.all(servicesPromises)
        setInstancesWithServices(results)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoadingServices(false)
      }
    }

    fetchAllServices()
  }, [instances])

  // Filter VMs based on search query
  const filteredVms = useMemo(() => {
    if (!searchQuery.trim()) {
      return instances
    }

    const query = searchQuery.toLowerCase()
    return instances.filter((vm) => {
      return (
        vm.name?.toLowerCase().includes(query) ||
        vm.host?.toLowerCase().includes(query) ||
        vm.id?.toLowerCase().includes(query) ||
        vm.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    })
  }, [instances, searchQuery])

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return instancesWithServices
    }

    const query = searchQuery.toLowerCase()
    return instancesWithServices
      .map(instance => ({
        ...instance,
        services: instance.services.filter(service =>
          service.name?.toLowerCase().includes(query) ||
          service.type?.toLowerCase().includes(query) ||
          instance.name?.toLowerCase().includes(query) ||
          instance.host?.toLowerCase().includes(query)
        )
      }))
      .filter(instance => instance.services.length > 0 || 
        instance.name?.toLowerCase().includes(query) ||
        instance.host?.toLowerCase().includes(query)
      )
  }, [instancesWithServices, searchQuery])

  const handleVmClick = (vm: InfrastructureInstance) => {
    if (onVmSelect) {
      onVmSelect(vm)
    }
  }

  const handleServiceClick = (service: InstanceService, instance: InfrastructureInstance) => {
    if (onServiceSelect) {
      onServiceSelect(service, instance)
    }
  }

  const toggleInstanceExpansion = (instanceId: string) => {
    setExpandedInstances(prev => {
      const newSet = new Set(prev)
      if (newSet.has(instanceId)) {
        newSet.delete(instanceId)
      } else {
        newSet.add(instanceId)
      }
      return newSet
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return 'bg-green-500'
      case 'offline':
      case 'stopped':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'stopped':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'vms' | 'services')} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 border-b border-border flex-shrink-0">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger 
                value="vms" 
                className="text-xs flex items-center gap-2 hover:shadow-none hover:!shadow-none [&[aria-selected=true]]:after:!bottom-0"
                style={{ boxShadow: 'none' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Server className="h-4 w-4" />
                VMs
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="text-xs flex items-center gap-2 hover:shadow-none hover:!shadow-none [&[aria-selected=true]]:after:!bottom-0"
                style={{ boxShadow: 'none' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Settings className="h-4 w-4" />
                Services
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search Header - Below Tabs */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={activeTab === 'vms' ? 'Search VMs...' : 'Search services...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-muted-foreground">
                {activeTab === 'vms' 
                  ? `${filteredVms.length} VM${filteredVms.length !== 1 ? 's' : ''} found`
                  : `${filteredServices.reduce((sum, inst) => sum + inst.services.length, 0)} service${filteredServices.reduce((sum, inst) => sum + inst.services.length, 0) !== 1 ? 's' : ''} found`
                }
              </div>
            )}
          </div>

          {/* VMs Tab */}
          <TabsContent value="vms" className="flex-1 m-0 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-2">
                {/* Add VM Button */}
                {onAddVm && (
                  <Button
                    variant="outline"
                    className="w-full mb-2 justify-center"
                    onClick={onAddVm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add VM
                  </Button>
                )}
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading VMs...
                  </div>
                ) : filteredVms.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No VMs found matching your search' : 'No VMs available'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredVms.map((vm) => (
                      <div
                        key={vm.id}
                        className={cn(
                          "flex items-center gap-1 w-full group",
                          selectedVmId === vm.id && "bg-muted"
                        )}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "flex-1 justify-start items-center text-[13px] font-medium h-[34px] px-3 transition-colors duration-150 cursor-pointer",
                            selectedVmId === vm.id
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          onClick={() => handleVmClick(vm)}
                        >
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <div className={cn(
                              "h-2 w-2 rounded-full flex-shrink-0",
                              getStatusColor(vm.status)
                            )} />
                            <Server className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="truncate font-medium">{vm.name}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {vm.host}
                                {vm.port && `:${vm.port}`}
                              </div>
                            </div>
                          </div>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onVmPermission?.(vm)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Permission
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onVmRemove?.(vm)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Instance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onVmReboot?.(vm)}>
                              <RotateCw className="h-4 w-4 mr-2" />
                              Reboot
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onVmEdit?.(vm)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onVmAccess?.(vm)}>
                              <Terminal className="h-4 w-4 mr-2" />
                              Access to VM
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 m-0 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-2">
                {loadingServices || loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading services...
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No services found matching your search' : 'No services available'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredServices.map((instance) => {
                      const isExpanded = expandedInstances.has(instance.id)
                      const hasServices = instance.services.length > 0

                      return (
                        <div key={instance.id} className="space-y-1">
                          {/* Instance Header */}
                          <Button
                            variant="ghost"
                            className="w-full justify-start items-center text-[13px] font-medium h-[34px] px-3 transition-colors duration-150 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => toggleInstanceExpansion(instance.id)}
                          >
                            <div className="flex items-center gap-2 w-full min-w-0">
                              {hasServices ? (
                                isExpanded ? (
                                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                )
                              ) : (
                                <div className="w-4" />
                              )}
                              <Server className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="truncate font-medium">{instance.name}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {instance.host}
                                  {instance.port && `:${instance.port}`}
                                  {hasServices && ` • ${instance.services.length} service${instance.services.length !== 1 ? 's' : ''}`}
                                </div>
                              </div>
                            </div>
                          </Button>

                          {/* Services List */}
                          {isExpanded && hasServices && (
                            <div className="ml-4 space-y-1 border-l border-border pl-2">
                              {instance.services.map((service) => (
                                <Button
                                  key={service.id}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start items-center text-[13px] font-medium h-[34px] px-3 transition-colors duration-150 cursor-pointer",
                                    selectedServiceId === service.id
                                      ? "bg-muted text-foreground"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                  onClick={() => handleServiceClick(service, instance)}
                                >
                                  <div className="flex items-center gap-2 w-full min-w-0">
                                  <div className={cn(
                                    "h-2 w-2 rounded-full flex-shrink-0",
                                    getServiceStatusColor(service.status)
                                  )} />
                                  <Activity className="h-4 w-4 flex-shrink-0" />
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="truncate font-medium">{service.name}</div>
                                    <div className="truncate text-xs text-muted-foreground">
                                      {service.type} • {service.status}
                                    </div>
                                  </div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

