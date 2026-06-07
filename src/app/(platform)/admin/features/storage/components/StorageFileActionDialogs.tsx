'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/lib/date-formatters'
import { cn } from '@/lib/utils'
import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import type { StorageFile } from '../types'

interface StorageFileActionDialogsProps {
  currentPath: string[]
  file: StorageFile | null
  formatBytes: (bytes: number) => string
  renameValue: string
  setFile: (file: StorageFile) => void
  setRenameValue: (value: string) => void
  showMetadata: boolean
  showMove: boolean
  showPermissions: boolean
  showRename: boolean
  setShowMetadata: (open: boolean) => void
  setShowMove: (open: boolean) => void
  setShowPermissions: (open: boolean) => void
  setShowRename: (open: boolean) => void
  onCopyUrl: (file: StorageFile) => void
  onRename: () => void
  onShare: (file: StorageFile, makePublic: boolean) => Promise<any>
}

export function StorageFileActionDialogs({
  currentPath,
  file,
  formatBytes,
  renameValue,
  setFile,
  setRenameValue,
  showMetadata,
  showMove,
  showPermissions,
  showRename,
  setShowMetadata,
  setShowMove,
  setShowPermissions,
  setShowRename,
  onCopyUrl,
  onRename,
  onShare,
}: StorageFileActionDialogsProps) {
  return (
    <>
      <CrudDialog
        open={showMetadata}
        onOpenChange={setShowMetadata}
        title="File Metadata"
        description={`Detailed information about ${file?.name}`}
        footer={(
          <Button className="rounded-xl font-bold" onClick={() => setShowMetadata(false)}>Close</Button>
        )}
      >
        {file ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm mt-1">{file.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Size</label>
              <p className="text-sm mt-1">{formatBytes(file.size)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">MIME Type</label>
              <p className="text-sm mt-1">{file.mimeType || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="text-sm mt-1">{file.type || 'file'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Path</label>
              <p className="text-sm mt-1">{file.path || 'Root'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bucket</label>
              <p className="text-sm mt-1">{file.bucketName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm mt-1">{formatDateTime(file.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
              <p className="text-sm mt-1">{formatDateTime(file.updatedAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Uploaded By</label>
              <p className="text-sm mt-1">{file.uploadedByName || 'Unknown'}</p>
            </div>
            {file.publicUrl && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Public URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 text-xs" value={file.publicUrl} readOnly />
                  <Button className="rounded-xl font-bold" variant="outline" size="sm" onClick={() => onCopyUrl(file)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CrudDialog>

      <CrudDialog
        open={showPermissions}
        onOpenChange={setShowPermissions}
        title="File Permissions"
        description={`Manage access permissions for ${file?.name}`}
        footer={(
          <>
            <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowPermissions(false)}>Cancel</Button>
            <Button className="rounded-xl font-bold" onClick={() => {
              toast.success('Permissions updated')
              setShowPermissions(false)
            }}>Save</Button>
          </>
        )}
      >
        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Public Access</label>
                <p className="text-xs text-muted-foreground">Allow public access via URL</p>
              </div>
              <button
                onClick={async () => {
                  const result = await onShare(file, !file.publicUrl)
                  if (result) {
                    setFile({ ...file, publicUrl: result.publicUrl })
                  }
                }}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  file.publicUrl ? 'bg-green-500' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    file.publicUrl ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">Access Control</label>
              <p className="text-xs text-muted-foreground mb-4">Fine-grained permissions coming soon</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Owner</span>
                  <Badge className="rounded-lg font-bold text-[10px]" variant="outline">Full Access</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Space Members</span>
                  <Badge className="rounded-lg font-bold text-[10px]" variant="outline">View</Badge>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CrudDialog>

      <CrudDialog
        open={showRename}
        onOpenChange={setShowRename}
        title={`Rename ${file?.type === 'folder' ? 'Folder' : 'File'}`}
        description={`Enter a new name for ${file?.name}`}
        footer={(
          <>
            <Button className="rounded-xl font-bold" variant="outline" onClick={() => {
              setShowRename(false)
              setRenameValue('')
            }}>Cancel</Button>
            <Button className="rounded-xl font-bold" onClick={onRename} disabled={!renameValue.trim()}>Rename</Button>
          </>
        )}
      >
        <div className="space-y-2">
          <Label className="text-sm font-bold">Name</Label>
          <Input
            className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 font-mono"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Enter new name"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && renameValue.trim()) {
                onRename()
              }
            }}
            autoFocus
          />
        </div>
      </CrudDialog>

      <CrudDialog
        open={showMove}
        onOpenChange={setShowMove}
        title={`Move ${file?.type === 'folder' ? 'Folder' : 'File'}`}
        description={`Select a destination folder for ${file?.name}`}
        footer={(
          <>
            <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowMove(false)}>Cancel</Button>
            <Button className="rounded-xl font-bold" onClick={() => {
              toast.success('Move functionality coming soon')
              setShowMove(false)
            }}>Move</Button>
          </>
        )}
      >
        <div className="space-y-2">
          <Label className="text-sm font-bold">Destination</Label>
          <p className="text-xs text-muted-foreground mb-4">
            Current location: {currentPath.length > 0 ? currentPath.join(' / ') : 'Root'}
          </p>
          <div className="border rounded-lg p-4 bg-muted">
            <p className="text-sm text-muted-foreground">Folder selection coming soon</p>
          </div>
        </div>
      </CrudDialog>
    </>
  )
}
