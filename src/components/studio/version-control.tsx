'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  GitBranch, 
  History, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  User,
  Plus,
  Tag,
  GitCommit,
  GitMerge
} from 'lucide-react'

interface Version {
  id: string
  version: string
  name: string
  description: string
  createdAt: Date
  createdBy: string
  isCurrent: boolean
  changes: string[]
  commitHash?: string
  tags?: string[]
}

interface VersionControlProps {
  currentVersion: string
  versions: Version[]
  hasUnsavedChanges: boolean
  onLoadVersion: (versionId: string) => void
  onCreateVersion: () => void
  onExportVersion: (version: Version) => void
  onImportVersion: (file: File) => void
}

export function VersionControl({
  currentVersion,
  versions,
  hasUnsavedChanges,
  onLoadVersion,
  onCreateVersion,
  onExportVersion,
  onImportVersion
}: VersionControlProps) {
  const [showImport, setShowImport] = useState(false)

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImportVersion(file)
      setShowImport(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Version Control Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Version Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <GitBranch className="h-3 w-3 mr-1" />
                v{currentVersion}
              </Badge>
              {hasUnsavedChanges && (
                <StatusBadge status="unsaved-changes" label="Unsaved Changes" size="sm" className="text-xs" />
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={onCreateVersion}>
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowImport(true)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">{versions.length}</div>
              <div className="text-muted-foreground">Versions</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">
                {versions.filter(v => v.isCurrent).length}
              </div>
              <div className="text-muted-foreground">Current</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">
                {versions.filter(v => v.tags && v.tags.length > 0).length}
              </div>
              <div className="text-muted-foreground">Tagged</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Versions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {versions.slice(0, 3).map((version) => (
              <div 
                key={version.id} 
                className={`p-3 rounded-lg border ${
                  version.isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{version.name}</h4>
                      <StatusBadge status={version.isCurrent ? 'current' : 'draft'} label={`v${version.version}`} size="sm" className="text-xs" />
                      {version.isCurrent && (
                        <StatusBadge status="current" size="sm" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Current
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {version.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.createdBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                      {version.commitHash && (
                        <div className="flex items-center gap-1">
                          <GitCommit className="h-3 w-3" />
                          {version.commitHash.substring(0, 7)}
                        </div>
                      )}
                    </div>
                    {version.tags && version.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {version.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!version.isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onLoadVersion(version.id)}
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onExportVersion(version)}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-sm">Import Version</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Version File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Import a previously exported version file to restore a template state.
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowImport(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

