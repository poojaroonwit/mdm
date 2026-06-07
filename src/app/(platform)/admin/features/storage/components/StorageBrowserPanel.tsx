'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, HardDrive, Upload } from 'lucide-react'
import type { StorageFile } from '../types'
import { StorageFileBrowser } from './StorageFileBrowser'

interface StorageBrowserPanelProps {
  files: StorageFile[]
  filteredFiles: StorageFile[]
  formatBytes: (bytes: number) => string
  getFileIcon: (file: StorageFile) => ReactNode
  isLoading: boolean
  searchTerm: string
  selectedBucket: string | null
  selectedFiles: Set<string>
  selectedSourceTypes: string[]
  setRenameValue: (value: string) => void
  setSelectedFileForAction: (file: StorageFile) => void
  setSelectedFiles: (files: Set<string>) => void
  setShowFilePreview: (file: StorageFile) => void
  setShowMetadata: (open: boolean) => void
  setShowMove: (open: boolean) => void
  setShowPermissions: (open: boolean) => void
  setShowRename: (open: boolean) => void
  setShowUploadDialog: (open: boolean) => void
  viewMode: 'grid' | 'list'
  onCopyUrl: (file: StorageFile) => void
  onDeleteFiles: (fileIds: string[]) => void
  onDownload: (file: StorageFile) => void
  onFolderClick: (file: StorageFile) => void
  onShare: (file: StorageFile, makePublic: boolean) => Promise<any>
}

export function StorageBrowserPanel({
  files,
  filteredFiles,
  formatBytes,
  getFileIcon,
  isLoading,
  searchTerm,
  selectedBucket,
  selectedFiles,
  selectedSourceTypes,
  setRenameValue,
  setSelectedFileForAction,
  setSelectedFiles,
  setShowFilePreview,
  setShowMetadata,
  setShowMove,
  setShowPermissions,
  setShowRename,
  setShowUploadDialog,
  viewMode,
  onCopyUrl,
  onDeleteFiles,
  onDownload,
  onFolderClick,
  onShare,
}: StorageBrowserPanelProps) {
  return (
    <ScrollArea className="flex-1">
      {!selectedBucket && files.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSourceTypes.includes('all')
                ? 'Files from all storage sources will appear here'
                : 'No files found from selected sources'}
            </p>
          </div>
        </div>
      ) : !selectedBucket && isLoading && files.length === 0 ? (
        <StorageLoadingSkeleton />
      ) : selectedBucket && isLoading && files.length === 0 ? (
        <StorageLoadingSkeleton />
      ) : filteredFiles.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try a different search term' : 'Upload your first file to get started'}
            </p>
            {!searchTerm && (
              <Button className="rounded-xl font-bold" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
            )}
          </div>
        </div>
      ) : (
        <StorageFileBrowser
          files={filteredFiles}
          selectedFiles={selectedFiles}
          viewMode={viewMode}
          setSelectedFiles={setSelectedFiles}
          setSelectedFileForAction={setSelectedFileForAction}
          setRenameValue={setRenameValue}
          setShowFilePreview={setShowFilePreview}
          setShowMetadata={setShowMetadata}
          setShowMove={setShowMove}
          setShowPermissions={setShowPermissions}
          setShowRename={setShowRename}
          formatBytes={formatBytes}
          getFileIcon={getFileIcon}
          onCopyUrl={onCopyUrl}
          onDeleteFiles={onDeleteFiles}
          onDownload={onDownload}
          onFolderClick={onFolderClick}
          onShare={onShare}
        />
      )}
    </ScrollArea>
  )
}

function StorageLoadingSkeleton() {
  return (
    <div className="w-full space-y-3 p-4">
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-16 w-full rounded-md" />
    </div>
  )
}
