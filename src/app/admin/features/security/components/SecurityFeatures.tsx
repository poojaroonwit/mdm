'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff,
  Key,
  User,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Database,
  Server,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SecurityPolicy, SecurityEvent, IPWhitelist } from '../types'

interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    maxAge: number
    preventReuse: number
  }
  sessionPolicy: {
    timeout: number
    maxConcurrent: number
    requireReauth: boolean
  }
  twoFactor: {
    enabled: boolean
    required: boolean
    backupCodes: number
  }
  ipWhitelist: {
    enabled: boolean
    allowedIPs: string[]
  }
  rateLimiting: {
    enabled: boolean
    maxAttempts: number
    windowMinutes: number
  }
}

export function SecurityFeatures() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [whitelist, setWhitelist] = useState<IPWhitelist[]>([])
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)
  const [showCreateIP, setShowCreateIP] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)

  const [newPolicy, setNewPolicy] = useState({
    name: '',
    type: 'password' as const,
    settings: {},
    description: ''
  })

  const [newIP, setNewIP] = useState({
    ipAddress: '',
    description: ''
  })

  useEffect(() => {
    loadPolicies()
    loadEvents()
    loadWhitelist()
    loadSettings()
  }, [])

  const loadPolicies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/security-policies')
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies.map((policy: any) => ({
          ...policy,
          createdAt: new Date(policy.createdAt),
          updatedAt: new Date(policy.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading policies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/security-events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const loadWhitelist = async () => {
    try {
      const response = await fetch('/api/admin/ip-whitelist')
      if (response.ok) {
        const data = await response.json()
        setWhitelist(data.whitelist.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error loading whitelist:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/security-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const createPolicy = async () => {
    try {
      const response = await fetch('/api/admin/security-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy)
      })

      if (response.ok) {
        toast.success('Security policy created successfully')
        setShowCreatePolicy(false)
        setNewPolicy({
          name: '',
          type: 'password',
          settings: {},
          description: ''
        })
        loadPolicies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create policy')
      }
    } catch (error) {
      console.error('Error creating policy:', error)
      toast.error('Failed to create policy')
    }
  }

  const createIP = async () => {
    try {
      const response = await fetch('/api/admin/ip-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIP)
      })

      if (response.ok) {
        toast.success('IP address added to whitelist')
        setShowCreateIP(false)
        setNewIP({
          ipAddress: '',
          description: ''
        })
        loadWhitelist()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add IP address')
      }
    } catch (error) {
      console.error('Error adding IP:', error)
      toast.error('Failed to add IP address')
    }
  }

  const deletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this security policy?')) return

    try {
      const response = await fetch(`/api/admin/security-policies/${policyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Policy deleted successfully')
        loadPolicies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete policy')
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
      toast.error('Failed to delete policy')
    }
  }

  const deleteIP = async (ipId: string) => {
    if (!confirm('Are you sure you want to remove this IP address?')) return

    try {
      const response = await fetch(`/api/admin/ip-whitelist/${ipId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('IP address removed successfully')
        loadWhitelist()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove IP address')
      }
    } catch (error) {
      console.error('Error removing IP:', error)
      toast.error('Failed to remove IP address')
    }
  }

  const resolveEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/security-events/${eventId}/resolve`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Security event resolved')
        loadEvents()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to resolve event')
      }
    } catch (error) {
      console.error('Error resolving event:', error)
      toast.error('Failed to resolve event')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'password':
        return <Lock className="h-4 w-4" />
      case 'session':
        return <Clock className="h-4 w-4" />
      case 'ip':
        return <Globe className="h-4 w-4" />
      case 'rate_limit':
        return <Activity className="h-4 w-4" />
      case '2fa':
        return <Key className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Features
          </h2>
          <p className="text-muted-foreground">
            Advanced security policies, threat detection, and access controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPolicies} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="policies">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="whitelist">IP Whitelist</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Policies</h3>
            <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Create Security Policy</DialogTitle>
                  <DialogDescription>
                    Create a new security policy to protect your system
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 p-6 pt-2 pb-4">
                  <div>
                    <Label htmlFor="policy-name">Policy Name</Label>
                    <Input
                      id="policy-name"
                      value={newPolicy.name}
                      onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                      placeholder="Enter policy name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-type">Policy Type</Label>
                    <Select value={newPolicy.type} onValueChange={(value: any) => setNewPolicy({ ...newPolicy, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="password">Password Policy</SelectItem>
                        <SelectItem value="session">Session Policy</SelectItem>
                        <SelectItem value="ip">IP Restriction</SelectItem>
                        <SelectItem value="rate_limit">Rate Limiting</SelectItem>
                        <SelectItem value="2fa">Two-Factor Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="policy-description">Description</Label>
                    <Textarea
                      id="policy-description"
                      value={newPolicy.description}
                      onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                      placeholder="Policy description"
                      rows={3}
                    />
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreatePolicy(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPolicy} disabled={!newPolicy.name}>
                    Create Policy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map(policy => (
              <Card key={policy.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getTypeIcon(policy.type)}
                      {policy.name}
                    </CardTitle>
                    <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <div>Type: {policy.type}</div>
                    <div>Created: {new Date(policy.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <h3 className="text-lg font-semibold">Security Events</h3>
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Monitor security events and threats</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {events.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(event.severity)}
                        <div>
                          <div className="font-medium">{event.type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.userName || 'System'} • {event.ipAddress} • {event.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        {!event.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveEvent(event.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">IP Whitelist</h3>
            <Dialog open={showCreateIP} onOpenChange={setShowCreateIP}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Add IP Address</DialogTitle>
                  <DialogDescription>
                    Add an IP address to the whitelist
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 p-6 pt-2 pb-4">
                  <div>
                    <Label htmlFor="ip-address">IP Address</Label>
                    <Input
                      id="ip-address"
                      value={newIP.ipAddress}
                      onChange={(e) => setNewIP({ ...newIP, ipAddress: e.target.value })}
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ip-description">Description</Label>
                    <Input
                      id="ip-description"
                      value={newIP.description}
                      onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                      placeholder="Office network"
                    />
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateIP(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createIP} disabled={!newIP.ipAddress}>
                    Add IP
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {whitelist.map(ip => (
              <Card key={ip.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{ip.ipAddress}</div>
                      <div className="text-sm text-muted-foreground">{ip.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={ip.isActive} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteIP(ip.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>
      </div>
    </div>
  )
}
