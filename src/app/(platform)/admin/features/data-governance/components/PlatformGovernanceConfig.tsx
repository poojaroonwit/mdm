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
import { 
  Shield, 
  FolderTree,
  Tag,
  Clock,
  Lock,
  User,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  DataDomain,
  ClassificationScheme,
  QualityRule,
  RetentionPolicy,
  AccessControlRule,
  DataSteward,
  BusinessGlossaryTerm,
  PlatformGovernanceConfig as PlatformGovernanceConfigType
} from '../types'

export function PlatformGovernanceConfig() {
  const [config, setConfig] = useState<PlatformGovernanceConfigType>({
    dataDomains: [],
    classificationSchemes: [],
    qualityRules: [],
    retentionPolicies: [],
    accessControlRules: [],
    dataStewards: [],
    businessGlossary: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('domains')
  const [showDomainDialog, setShowDomainDialog] = useState(false)
  const [showClassificationDialog, setShowClassificationDialog] = useState(false)
  const [showQualityRuleDialog, setShowQualityRuleDialog] = useState(false)
  const [showRetentionDialog, setShowRetentionDialog] = useState(false)
  const [showAccessControlDialog, setShowAccessControlDialog] = useState(false)
  const [showStewardDialog, setShowStewardDialog] = useState(false)
  const [showGlossaryDialog, setShowGlossaryDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const [newDomain, setNewDomain] = useState<Partial<DataDomain>>({
    name: '',
    description: '',
    tags: [],
    assets: [],
    policies: []
  })

  const [newClassification, setNewClassification] = useState<Partial<ClassificationScheme>>({
    name: '',
    categories: [],
    isDefault: false
  })

  const [newQualityRule, setNewQualityRule] = useState<Partial<QualityRule>>({
    name: '',
    description: '',
    type: 'completeness',
    condition: '',
    threshold: 100,
    severity: 'error',
    appliesTo: [],
    isActive: true
  })

  const [newRetentionPolicy, setNewRetentionPolicy] = useState<Partial<RetentionPolicy>>({
    name: '',
    description: '',
    retentionPeriod: 365,
    retentionUnit: 'days',
    action: 'archive',
    appliesTo: [],
    isActive: true
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/platform-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || config)
      }
    } catch (error) {
      console.error('Error loading platform config:', error)
      toast.error('Failed to load platform configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/platform-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })

      if (response.ok) {
        toast.success('Platform configuration saved successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving platform config:', error)
      toast.error('Failed to save platform configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDomain = () => {
    if (!newDomain.name) {
      toast.error('Domain name is required')
      return
    }

    const domain: DataDomain = {
      id: `domain_${Date.now()}`,
      name: newDomain.name,
      description: newDomain.description,
      tags: newDomain.tags || [],
      assets: newDomain.assets || [],
      policies: newDomain.policies || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setConfig(prev => ({
      ...prev,
      dataDomains: [...prev.dataDomains, domain]
    }))

    setNewDomain({ name: '', description: '', tags: [], assets: [], policies: [] })
    setShowDomainDialog(false)
    toast.success('Data domain created')
  }

  const handleDeleteDomain = (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return

    setConfig(prev => ({
      ...prev,
      dataDomains: prev.dataDomains.filter(d => d.id !== id)
    }))
    toast.success('Domain deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Platform Governance Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure data domains, classification schemes, quality rules, and other governance settings
          </p>
        </div>
        <Button onClick={saveConfig} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="domains">Data Domains</TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="quality">Quality Rules</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="glossary">Glossary</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Data Domains</h3>
            <Button onClick={() => setShowDomainDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Domain
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.dataDomains.map((domain) => (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderTree className="h-5 w-5" />
                      {domain.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(domain)
                          setNewDomain(domain)
                          setShowDomainDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDomain(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {domain.description && (
                    <CardDescription>{domain.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assets:</span>
                      <Badge variant="outline">{domain.assets.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Policies:</span>
                      <Badge variant="outline">{domain.policies.length}</Badge>
                    </div>
                    {domain.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {domain.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {config.dataDomains.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No data domains configured</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowDomainDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Domain
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="classification" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Classification Schemes</h3>
            <Button onClick={() => setShowClassificationDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Scheme
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.classificationSchemes.map((scheme) => (
              <Card key={scheme.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      {scheme.name}
                      {scheme.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingItem(scheme)
                        setNewClassification(scheme)
                        setShowClassificationDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {scheme.categories.length} categories
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Quality Rules</h3>
            <Button onClick={() => setShowQualityRuleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>

          <div className="space-y-3">
            {config.qualityRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{rule.type}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(rule)
                          setNewQualityRule(rule)
                          setShowQualityRuleDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Threshold:</span>
                      <span className="ml-2 font-medium">{rule.threshold}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Severity:</span>
                      <Badge className="ml-2" variant={
                        rule.severity === 'error' ? 'destructive' :
                        rule.severity === 'warning' ? 'default' : 'secondary'
                      }>
                        {rule.severity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Applies to:</span>
                      <span className="ml-2 font-medium">{rule.appliesTo.length} assets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Retention Policies</h3>
            <Button onClick={() => setShowRetentionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <div className="space-y-3">
            {config.retentionPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Retention:</span>
                      <span className="ml-2 font-medium">
                        {policy.retentionPeriod} {policy.retentionUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Action:</span>
                      <Badge className="ml-2" variant="outline">
                        {policy.action}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Applies to:</span>
                      <span className="ml-2 font-medium">{policy.appliesTo.length} assets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Access Control Rules</h3>
            <Button onClick={() => setShowAccessControlDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>

          <div className="space-y-3">
            {config.accessControlRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Principal:</span>
                      <span className="ml-2 font-medium">{rule.principal}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resource:</span>
                      <span className="ml-2 font-medium">{rule.resource}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.permissions.map((perm) => (
                          <Badge key={perm} variant="outline">{perm}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Business Glossary</h3>
            <Button onClick={() => setShowGlossaryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Term
            </Button>
          </div>

          <div className="space-y-3">
            {config.businessGlossary.map((term) => (
              <Card key={term.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {term.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{term.definition}</p>
                  {term.category && (
                    <Badge variant="outline" className="mb-2">{term.category}</Badge>
                  )}
                  {term.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {term.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Create Domain Dialog */}
      <Dialog open={showDomainDialog} onOpenChange={setShowDomainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Create'} Data Domain</DialogTitle>
            <DialogDescription>
              Organize data assets into logical domains for better governance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain-name">Domain Name</Label>
              <Input
                id="domain-name"
                value={newDomain.name || ''}
                onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                placeholder="e.g., Finance, HR, Sales"
              />
            </div>
            <div>
              <Label htmlFor="domain-description">Description</Label>
              <Textarea
                id="domain-description"
                value={newDomain.description || ''}
                onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                placeholder="Describe the purpose of this domain"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDomainDialog(false)
              setEditingItem(null)
              setNewDomain({ name: '', description: '', tags: [], assets: [], policies: [] })
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDomain}>
              {editingItem ? 'Update' : 'Create'} Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

