'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TemplateVersionCreateCard } from './TemplateVersionCreateCard'
import { 
  GitBranch,
  History,
  Tag,
  Download,
  Upload,
  RotateCcw,
  RotateCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Archive,
  Star,
  Share
} from 'lucide-react'

interface TemplateVersion {
  id: string
  templateId: string
  version: string
  name: string
  description: string
  changes: string[]
  isStable: boolean
  isPublished: boolean
  createdAt: string
  createdBy: string
  parentVersionId?: string
  tags: string[]
  downloadCount: number
  rating: number
  size: number
  checksum: string
}

interface TemplateVersionManagerProps {
  templateId: string
  versions: TemplateVersion[]
  currentVersion: string
  onCreateVersion: (version: Omit<TemplateVersion, 'id'>) => void
  onUpdateVersion: (id: string, updates: Partial<TemplateVersion>) => void
  onDeleteVersion: (id: string) => void
  onPublishVersion: (id: string) => void
  onUnpublishVersion: (id: string) => void
  onRestoreVersion: (id: string) => void
  onCompareVersions: (version1: string, version2: string) => void
  onExportVersion: (id: string) => void
  onImportVersion: (file: File) => void
}

export function TemplateVersionManager({
  templateId,
  versions,
  currentVersion,
  onCreateVersion,
  onUpdateVersion,
  onDeleteVersion,
  onPublishVersion,
  onUnpublishVersion,
  onRestoreVersion,
  onCompareVersions,
  onExportVersion,
  onImportVersion
}: TemplateVersionManagerProps) {
  const [activeTab, setActiveTab] = useState<'versions' | 'history' | 'compare' | 'publish'>('versions')
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [newVersion, setNewVersion] = useState({
    version: '',
    name: '',
    description: '',
    changes: [''],
    isStable: false,
    tags: ['']
  })
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string }>({ v1: '', v2: '' })

  const sortedVersions = versions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleCreateVersion = useCallback(() => {
    if (!newVersion.version || !newVersion.name) return

    const version: Omit<TemplateVersion, 'id'> = {
      templateId,
      version: newVersion.version,
      name: newVersion.name,
      description: newVersion.description,
      changes: newVersion.changes.filter(c => c.trim()),
      isStable: newVersion.isStable,
      isPublished: false,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user', // This would come from auth context
      parentVersionId: currentVersion,
      tags: newVersion.tags.filter(t => t.trim()),
      downloadCount: 0,
      rating: 0,
      size: 0, // This would be calculated
      checksum: '' // This would be calculated
    }

    onCreateVersion(version)
    setIsCreatingVersion(false)
    setNewVersion({
      version: '',
      name: '',
      description: '',
      changes: [''],
      isStable: false,
      tags: ['']
    })
  }, [templateId, currentVersion, newVersion, onCreateVersion])

  const generateNextVersion = useCallback(() => {
    const latestVersion = sortedVersions[0]
    if (!latestVersion) {
      setNewVersion(prev => ({ ...prev, version: '1.0.0' }))
      return
    }

    const [major, minor, patch] = latestVersion.version.split('.').map(Number)
    const nextVersion = `${major}.${minor}.${patch + 1}`
    setNewVersion(prev => ({ ...prev, version: nextVersion }))
  }, [sortedVersions])

  const getVersionStatus = useCallback((version: TemplateVersion) => {
    if (version.isPublished) return { label: 'Published', variant: 'default' as const }
    if (version.isStable) return { label: 'Stable', variant: 'secondary' as const }
    return { label: 'Draft', variant: 'outline' as const }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Template Versioning
          </h2>
          <p className="text-muted-foreground">
            Manage template versions, releases, and history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('compare')}
          >
            <GitMerge className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('publish')}
          >
            <Share className="h-4 w-4 mr-2" />
            Publish
          </Button>
          <Button onClick={() => setIsCreatingVersion(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Version
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'versions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('versions')}
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Versions
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('history')}
        >
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
        <Button
          variant={activeTab === 'compare' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('compare')}
        >
          <GitMerge className="h-4 w-4 mr-2" />
          Compare
        </Button>
        <Button
          variant={activeTab === 'publish' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('publish')}
        >
          <Share className="h-4 w-4 mr-2" />
          Publish
        </Button>
      </div>

      {/* Create Version Dialog */}
      {isCreatingVersion && (
        <TemplateVersionCreateCard
          newVersion={newVersion}
          setNewVersion={setNewVersion}
          onGenerateNextVersion={generateNextVersion}
          onCreateVersion={handleCreateVersion}
          onCancel={() => setIsCreatingVersion(false)}
        />
      )}
      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          {sortedVersions.map(version => {
            const status = getVersionStatus(version)
            return (
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          {version.name}
                          <Badge variant="outline">{version.version}</Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {version.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportVersion(version.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {version.isPublished ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUnpublishVersion(version.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPublishVersion(version.id)}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestoreVersion(version.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteVersion(version.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Changes */}
                    {version.changes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Changes:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {version.changes.map((change, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {version.createdBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {version.downloadCount} downloads
                      </div>
                      {version.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {version.rating}/5
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {version.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Tags:</span>
                        {version.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedVersions.map((version, index) => (
                <div key={version.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    {index < sortedVersions.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{version.name}</span>
                      <Badge variant="outline">{version.version}</Badge>
                      {version.isPublished && (
                        <Badge variant="default">Published</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {version.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString()} by {version.createdBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Compare Versions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Version 1</Label>
                <Select
                  value={compareVersions.v1}
                  onValueChange={(value) => setCompareVersions(prev => ({ ...prev, v1: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(version => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.name} ({version.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Version 2</Label>
                <Select
                  value={compareVersions.v2}
                  onValueChange={(value) => setCompareVersions(prev => ({ ...prev, v2: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(version => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.name} ({version.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={() => onCompareVersions(compareVersions.v1, compareVersions.v2)}
              disabled={!compareVersions.v1 || !compareVersions.v2}
            >
              <GitMerge className="h-4 w-4 mr-2" />
              Compare Versions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Publish Tab */}
      {activeTab === 'publish' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Publish Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Publish your template to make it available to other users and spaces.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">Available for Publishing:</h4>
                {versions.filter(v => !v.isPublished).map(version => (
                  <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{version.name}</div>
                      <div className="text-sm text-muted-foreground">Version {version.version}</div>
                    </div>
                    <Button
                      onClick={() => onPublishVersion(version.id)}
                      size="sm"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

