'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Database, 
  LayoutDashboard,
  Workflow,
  MessageSquare,
  Brain,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  Network,
  Tag,
  Eye,
  Lock,
  Key,
  Link as LinkIcon,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  OpenMetadataConfig, 
  DataAsset, 
  DataPolicy, 
  GovernanceMetrics 
} from '../types'
import { PlatformGovernanceConfig as PlatformConfig } from './PlatformGovernanceConfig'
import { DataProfiling } from './DataProfiling'
import { TestSuites } from './TestSuites'
import { Collaboration } from './Collaboration'
import { IngestionManagement } from './IngestionManagement'
import { WebhooksAlerts } from './WebhooksAlerts'
import {
  getAssetTypeIcon,
  getQualityStatusColor,
  getClassificationColor,
  calculateGovernanceMetrics,
  formatFQN,
  isAssetCompliant
} from '../utils'

export function DataGovernance() {
  const [config, setConfig] = useState<OpenMetadataConfig | null>(null)
  const [assets, setAssets] = useState<DataAsset[]>([])
  const [policies, setPolicies] = useState<DataPolicy[]>([])
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const [newConfig, setNewConfig] = useState<Partial<OpenMetadataConfig>>({
    host: '',
    apiVersion: 'v1',
    authProvider: 'basic',
    authConfig: {},
    isEnabled: false
  })

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    if (config?.isEnabled) {
      loadAssets()
      loadPolicies()
    }
  }, [config])

  useEffect(() => {
    if (assets.length > 0 && policies.length > 0) {
      const calculatedMetrics = calculateGovernanceMetrics(assets, policies)
      setMetrics(calculatedMetrics)
    }
  }, [assets, policies])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/data-governance/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        if (data.config) {
          setNewConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }

  const saveConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig })
      })

      if (response.ok) {
        toast.success('OpenMetadata configuration saved')
        setShowConfigDialog(false)
        await loadConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Error loading assets:', error)
      toast.error('Failed to load data assets')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/admin/data-governance/policies')
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      }
    } catch (error) {
      console.error('Error loading policies:', error)
      toast.error('Failed to load policies')
    }
  }

  const syncAssets = async (direction: 'pull' | 'push' | 'both' = 'both') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })

      if (response.ok) {
        const data = await response.json()
        const directionText = direction === 'pull' ? 'from OpenMetadata' : direction === 'push' ? 'to OpenMetadata' : 'bidirectionally'
        toast.success(`Assets synchronized ${directionText} successfully`)
        if (direction === 'pull' || direction === 'both') {
          await loadAssets()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sync assets')
      }
    } catch (error) {
      console.error('Error syncing assets:', error)
      toast.error('Failed to sync assets')
    } finally {
      setIsLoading(false)
    }
  }

  const getAssetIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      table: Database,
      database: Database,
      dashboard: LayoutDashboard,
      pipeline: Workflow,
      topic: MessageSquare,
      mlmodel: Brain
    }
    return iconMap[type] || FileText
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.fullyQualifiedName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || asset.type === filterType
    return matchesSearch && matchesType
  })

  if (!config || !config.isEnabled) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Data Governance
            </h2>
            <p className="text-muted-foreground">
              Manage data governance using OpenMetadata
            </p>
          </div>
          <Button onClick={() => setShowConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure OpenMetadata
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Configure OpenMetadata connection to get started with data governance
              </p>
              <Button onClick={() => setShowConfigDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader>
              <DialogTitle>OpenMetadata Configuration</DialogTitle>
              <DialogDescription>
                Configure connection to your OpenMetadata instance
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4 p-6 pt-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="host">OpenMetadata Host</Label>
                <Input
                  id="host"
                  value={newConfig.host || ''}
                  onChange={(e) => setNewConfig({ ...newConfig, host: e.target.value })}
                  placeholder="https://openmetadata.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiVersion">API Version</Label>
                <Select
                  value={newConfig.apiVersion || 'v1'}
                  onValueChange={(value) => setNewConfig({ ...newConfig, apiVersion: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">v1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authProvider">Authentication Provider</Label>
                <Select
                  value={newConfig.authProvider || 'basic'}
                  onValueChange={(value: any) => setNewConfig({ ...newConfig, authProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="jwt">JWT Token</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                    <SelectItem value="saml">SAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newConfig.authProvider === 'basic' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newConfig.authConfig?.username || ''}
                      onChange={(e) => setNewConfig({
                        ...newConfig,
                        authConfig: { ...newConfig.authConfig, username: e.target.value }
                      })}
                      placeholder="admin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newConfig.authConfig?.password || ''}
                      onChange={(e) => setNewConfig({
                        ...newConfig,
                        authConfig: { ...newConfig.authConfig, password: e.target.value }
                      })}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}
              {newConfig.authProvider === 'jwt' && (
                <div className="space-y-2">
                  <Label htmlFor="jwtToken">JWT Token</Label>
                  <Textarea
                    id="jwtToken"
                    value={newConfig.authConfig?.jwtToken || ''}
                    onChange={(e) => setNewConfig({
                      ...newConfig,
                      authConfig: { ...newConfig.authConfig, jwtToken: e.target.value }
                    })}
                    placeholder="Enter JWT token"
                    rows={3}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={newConfig.isEnabled || false}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, isEnabled: checked })}
                />
                <Label htmlFor="enabled">Enable Integration</Label>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveConfig} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button onClick={() => syncAssets('both')} disabled={isLoading} title="Bidirectional sync (pull + push)">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Sync (2-way)
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAssets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">With Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.assetsWithPolicies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quality Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.assetsWithQualityChecks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageQualityScore.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Policy Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.policyComplianceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Classification Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.dataClassificationCoverage.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full">
      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Data Assets</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="profiling">Profiling</TabsTrigger>
          <TabsTrigger value="test-suites">Test Suites</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="platform-config">Platform Config</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="table">Tables</SelectItem>
                <SelectItem value="database">Databases</SelectItem>
                <SelectItem value="dashboard">Dashboards</SelectItem>
                <SelectItem value="pipeline">Pipelines</SelectItem>
                <SelectItem value="topic">Topics</SelectItem>
                <SelectItem value="mlmodel">ML Models</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => {
              const Icon = getAssetIcon(asset.type)
              const compliant = isAssetCompliant(asset, policies)
              
              return (
                <Card
                  key={asset.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    selectedAsset?.id === asset.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{asset.name}</CardTitle>
                          <CardDescription className="text-xs">{formatFQN(asset.fullyQualifiedName)}</CardDescription>
                        </div>
                      </div>
                      {compliant && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Compliant
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{asset.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Service:</span>
                        <span>{asset.service}</span>
                      </div>
                      {asset.quality && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Quality Score:</span>
                          <Badge className={getQualityStatusColor(
                            asset.quality.score >= 80 ? 'passed' : asset.quality.score >= 60 ? 'warning' : 'failed'
                          )}>
                            {asset.quality.score}%
                          </Badge>
                        </div>
                      )}
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {asset.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{asset.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredAssets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No assets found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Data Policies</h3>
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Rules: </span>
                      <span className="font-medium">{policy.rules.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Applies to: </span>
                      <span className="font-medium">{policy.appliesTo.length} assets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lineage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Data Lineage
              </CardTitle>
              <CardDescription>
                Visualize data flow and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Lineage visualization will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Quality
              </CardTitle>
              <CardDescription>
                Monitor and manage data quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Quality metrics and checks will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiling" className="space-y-4">
          <DataProfiling asset={selectedAsset} config={config} />
        </TabsContent>

        <TabsContent value="test-suites" className="space-y-4">
          <TestSuites />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <Collaboration asset={selectedAsset} config={config} />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-4">
          <IngestionManagement />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhooksAlerts />
        </TabsContent>

        <TabsContent value="platform-config" className="space-y-4">
          <PlatformConfig />
        </TabsContent>
      </Tabs>
      </div>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>OpenMetadata Configuration</DialogTitle>
            <DialogDescription>
              Configure connection to your OpenMetadata instance
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="host">OpenMetadata Host</Label>
              <Input
                id="host"
                value={newConfig.host || ''}
                onChange={(e) => setNewConfig({ ...newConfig, host: e.target.value })}
                placeholder="https://openmetadata.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiVersion">API Version</Label>
              <Select
                value={newConfig.apiVersion || 'v1'}
                onValueChange={(value) => setNewConfig({ ...newConfig, apiVersion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v1">v1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="authProvider">Authentication Provider</Label>
              <Select
                value={newConfig.authProvider || 'basic'}
                onValueChange={(value: any) => setNewConfig({ ...newConfig, authProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="jwt">JWT Token</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                  <SelectItem value="saml">SAML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newConfig.authProvider === 'basic' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newConfig.authConfig?.username || ''}
                    onChange={(e) => setNewConfig({
                      ...newConfig,
                      authConfig: { ...newConfig.authConfig, username: e.target.value }
                    })}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newConfig.authConfig?.password || ''}
                    onChange={(e) => setNewConfig({
                      ...newConfig,
                      authConfig: { ...newConfig.authConfig, password: e.target.value }
                    })}
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}
            {newConfig.authProvider === 'jwt' && (
              <div className="space-y-2">
                <Label htmlFor="jwtToken">JWT Token</Label>
                <Textarea
                  id="jwtToken"
                  value={newConfig.authConfig?.jwtToken || ''}
                  onChange={(e) => setNewConfig({
                    ...newConfig,
                    authConfig: { ...newConfig.authConfig, jwtToken: e.target.value }
                  })}
                  placeholder="Enter JWT token"
                  rows={3}
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newConfig.isEnabled || false}
                onCheckedChange={(checked) => setNewConfig({ ...newConfig, isEnabled: checked })}
              />
              <Label htmlFor="enabled">Enable Integration</Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfig} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

