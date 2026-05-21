'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  ASSET_TYPES,
  AssetType,
  DataModelRelationship,
  LINK_TYPES,
  LinkType,
  PROJECT_ROLES,
  ProjectRole,
} from '@/lib/project-types'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (member: { identifier: string; role: ProjectRole }) => void
}

export function AddMemberDialog({ open, onOpenChange, onAdd }: AddMemberDialogProps) {
  const [identifier, setIdentifier] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>Add a member to the project by user ID or email</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>User ID or Email</Label>
            <Input
              placeholder="user@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as ProjectRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onAdd({ identifier: identifier.trim(), role })}
            disabled={identifier.trim().length === 0}
          >
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (link: { type: LinkType; name: string; url: string; description?: string }) => void
}

export function AddLinkDialog({ open, onOpenChange, onAdd }: AddLinkDialogProps) {
  const [type, setType] = useState<LinkType>('git_repository')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
          <DialogDescription>Add a repository, drive, or other link</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as LinkType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Main Repository"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onAdd({ type, name, url, description })}>Add Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (asset: { assetType: AssetType; assetName: string; assetDescription?: string }) => void
}

export function AddAssetDialog({ open, onOpenChange, onAdd }: AddAssetDialogProps) {
  const [assetType, setAssetType] = useState<AssetType>('vm')
  const [assetName, setAssetName] = useState('')
  const [assetDescription, setAssetDescription] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>Link an infrastructure asset to this project</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Asset Type</Label>
            <Select value={assetType} onValueChange={(value) => setAssetType(value as AssetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Production Server"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Description..."
              value={assetDescription}
              onChange={(e) => setAssetDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onAdd({ assetType, assetName, assetDescription })}>Add Asset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddDataModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (dataModel: { dataModelId: string; relationship: DataModelRelationship }) => void
  spaceId?: string
  linkedDataModelIds: string[]
}

export function AddDataModelDialog({
  open,
  onOpenChange,
  onAdd,
  spaceId,
  linkedDataModelIds,
}: AddDataModelDialogProps) {
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dataModelId, setDataModelId] = useState('')
  const [relationship, setRelationship] = useState<DataModelRelationship>('reference')

  useEffect(() => {
    if (!open || !spaceId) {
      return
    }

    const controller = new AbortController()

    const loadDataModels = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/spaces/${spaceId}/data-models`, {
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load data models')
        }

        setAvailableModels(Array.isArray(data?.dataModels) ? data.dataModels : [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load data models')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDataModels()

    return () => controller.abort()
  }, [open, spaceId])

  const selectableModels = availableModels.filter((model) => !linkedDataModelIds.includes(model.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Data Model</DialogTitle>
          <DialogDescription>Associate an existing data model with this project</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data Model</Label>
            <Select value={dataModelId} onValueChange={setDataModelId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Loading data models...' : 'Select data model'} />
              </SelectTrigger>
              <SelectContent>
                {selectableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isLoading && selectableModels.length === 0 && (
              <p className="text-sm text-muted-foreground">All available data models are already linked.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={relationship} onValueChange={(value) => setRelationship(value as DataModelRelationship)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onAdd({ dataModelId, relationship })}
            disabled={!dataModelId || isLoading}
          >
            Link Data Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
