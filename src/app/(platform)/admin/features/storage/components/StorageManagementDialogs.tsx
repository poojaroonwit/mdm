'use client'

import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'
import { StorageConnections } from '../../system/components/StorageConnections'
import type { Bucket, StorageFile } from '../types'
import { StorageFileActionDialogs } from './StorageFileActionDialogs'
import { StorageFilePreviewDialog } from './StorageFilePreviewDialog'

interface StorageManagementDialogsProps {
  currentBucket?: Bucket
  currentPath: string[]
  formatBytes: (bytes: number) => string
  getFileIcon: (file: StorageFile) => React.ReactNode
  isPublicBucket: boolean
  newBucketName: string
  newFolderName: string
  renameValue: string
  selectedFileForAction: StorageFile | null
  showConnectionsManager: boolean
  showCreateBucket: boolean
  showCreateFolder: boolean
  showFilePreview: StorageFile | null
  showMetadata: boolean
  showMove: boolean
  showPermissions: boolean
  showRename: boolean
  showUploadDialog: boolean
  uploadFiles: File[]
  handleCreateBucket: () => void
  handleCreateFolder: () => void
  handleUpload: () => void
  onCopyUrl: (file: StorageFile) => void
  onDownload: (file: StorageFile) => void
  onRename: () => void
  onShare: (file: StorageFile, makePublic: boolean) => Promise<any>
  setIsPublicBucket: (isPublic: boolean) => void
  setNewBucketName: (name: string) => void
  setNewFolderName: (name: string) => void
  setRenameValue: (value: string) => void
  setSelectedFileForAction: (file: StorageFile | null) => void
  setShowConnectionsManager: (open: boolean) => void
  setShowCreateBucket: (open: boolean) => void
  setShowCreateFolder: (open: boolean) => void
  setShowFilePreview: (file: StorageFile | null) => void
  setShowMetadata: (open: boolean) => void
  setShowMove: (open: boolean) => void
  setShowPermissions: (open: boolean) => void
  setShowRename: (open: boolean) => void
  setShowUploadDialog: (open: boolean) => void
  setUploadFiles: (files: File[]) => void
}

export function StorageManagementDialogs({
  currentBucket,
  currentPath,
  formatBytes,
  getFileIcon,
  isPublicBucket,
  newBucketName,
  newFolderName,
  renameValue,
  selectedFileForAction,
  showConnectionsManager,
  showCreateBucket,
  showCreateFolder,
  showFilePreview,
  showMetadata,
  showMove,
  showPermissions,
  showRename,
  showUploadDialog,
  uploadFiles,
  handleCreateBucket,
  handleCreateFolder,
  handleUpload,
  onCopyUrl,
  onDownload,
  onRename,
  onShare,
  setIsPublicBucket,
  setNewBucketName,
  setNewFolderName,
  setRenameValue,
  setSelectedFileForAction,
  setShowConnectionsManager,
  setShowCreateBucket,
  setShowCreateFolder,
  setShowFilePreview,
  setShowMetadata,
  setShowMove,
  setShowPermissions,
  setShowRename,
  setShowUploadDialog,
  setUploadFiles,
}: StorageManagementDialogsProps) {
  return (
    <>
      <CrudDialog
        open={showCreateBucket}
        onOpenChange={setShowCreateBucket}
        title="Create new bucket"
        description="Buckets are containers for your files. Choose a unique name for your bucket."
        footer={(
          <>
            <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowCreateBucket(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleCreateBucket} disabled={!newBucketName.trim()}>
              Create bucket
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 font-mono"
              value={newBucketName}
              onChange={(event) => setNewBucketName(event.target.value)}
              placeholder="bucket-name"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Public bucket</label>
              <p className="text-xs text-muted-foreground">Anyone with the URL can access files</p>
            </div>
            <button
              onClick={() => setIsPublicBucket(!isPublicBucket)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isPublicBucket ? 'bg-green-500' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isPublicBucket ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </CrudDialog>

      <CrudDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        title="Upload files"
        description={`Select files to upload to ${currentBucket?.name || 'bucket'}`}
        contentClassName="max-w-2xl"
        footer={(
          <>
            <Button className="rounded-xl font-bold" variant="outline" onClick={() => {
              setShowUploadDialog(false)
              setUploadFiles([])
            }}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleUpload} disabled={uploadFiles.length === 0}>
              Upload {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-xl p-8 text-center border-zinc-200 dark:border-zinc-800">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-primary">Click to upload</span>
              <span className="text-sm text-muted-foreground"> or drag and drop</span>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={(event) => setUploadFiles(Array.from(event.target.files || []))}
            />
          </div>
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              {uploadFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CrudDialog>

      <CrudDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        title="Create new folder"
        description={currentPath.length > 0 ? `Create a folder in ${currentPath.join(' / ')}` : 'Create a folder in the current location'}
        footer={(
          <>
            <Button className="rounded-xl font-bold" variant="outline" onClick={() => {
              setShowCreateFolder(false)
              setNewFolderName('')
            }}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create folder
            </Button>
          </>
        )}
      >
        <div className="space-y-2">
          <Label className="text-sm font-bold">Folder name</Label>
          <Input
            className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 font-mono"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="my-folder"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && newFolderName.trim()) {
                handleCreateFolder()
              }
            }}
            autoFocus
          />
        </div>
      </CrudDialog>

      <StorageFilePreviewDialog
        file={showFilePreview}
        onClose={() => setShowFilePreview(null)}
        onDownload={onDownload}
        renderFileIcon={getFileIcon}
        formatBytes={formatBytes}
      />

      <StorageFileActionDialogs
        currentPath={currentPath}
        file={selectedFileForAction}
        formatBytes={formatBytes}
        renameValue={renameValue}
        setFile={setSelectedFileForAction}
        setRenameValue={setRenameValue}
        showMetadata={showMetadata}
        showMove={showMove}
        showPermissions={showPermissions}
        showRename={showRename}
        setShowMetadata={setShowMetadata}
        setShowMove={setShowMove}
        setShowPermissions={setShowPermissions}
        setShowRename={setShowRename}
        onCopyUrl={onCopyUrl}
        onRename={onRename}
        onShare={onShare}
      />

      <CrudDialog
        open={showConnectionsManager}
        onOpenChange={setShowConnectionsManager}
        title="Storage Connections"
        description="Manage your external storage providers and connections"
        contentClassName="max-w-4xl max-h-[90vh]"
        bodyClassName="p-6 pt-2 pb-4 overflow-y-auto"
        footer={(
          <Button className="rounded-xl font-bold" onClick={() => setShowConnectionsManager(false)}>Close</Button>
        )}
      >
        <StorageConnections />
      </CrudDialog>
    </>
  )
}
