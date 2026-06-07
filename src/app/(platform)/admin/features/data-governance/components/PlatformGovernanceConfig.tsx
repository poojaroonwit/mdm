'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  FolderTree,
  Tag,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  DataDomain,
  PlatformGovernanceConfig as PlatformGovernanceConfigType
} from '../types'
import { DataDomainDialog } from './DataDomainDialog'

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
  const [showGlossaryDialog, setShowGlossaryDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const [newDomain, setNewDomain] = useState<Partial<DataDomain>>({
    name: '',
    description: '',
    tags: [],
    assets: [],
    policies: []
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
                        <StatusBadge status="default" />
                      )}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingItem(scheme)
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
                      <StatusBadge status={rule.isActive ? 'active' : 'inactive'} />
                      <Badge variant="outline">{rule.type}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(rule)
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
                      <StatusBadge className="ml-2" status={rule.severity} />
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
                    <StatusBadge status={policy.isActive ? 'active' : 'inactive'} />
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
                    <StatusBadge status={rule.isActive ? 'active' : 'inactive'} />
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

      <DataDomainDialog
        open={showDomainDialog}
        editingItem={editingItem}
        domain={newDomain}
        onOpenChange={setShowDomainDialog}
        onDomainChange={setNewDomain}
        onSave={handleCreateDomain}
        onCancel={() => {
          setShowDomainDialog(false)
          setEditingItem(null)
          setNewDomain({ name: '', description: '', tags: [], assets: [], policies: [] })
        }}
      />
    </div>
  )
}

