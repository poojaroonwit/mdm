'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { cn } from '@/lib/utils'
import { ChevronRight, FolderPlus, Grid3x3, List, RefreshCw, Search, Upload } from 'lucide-react'

interface StorageBrowserHeaderProps {
  breadcrumb: string[]
  currentPath: string[]
  isLoading: boolean
  loadFiles: (bucketId: string, path: string[]) => void
  searchTerm: string
  selectedBucket: string | null
  selectedSourceTypes: string[]
  setCurrentPath: (path: string[]) => void
  setSearchTerm: (term: string) => void
  setSelectedSourceTypes: (sourceTypes: string[]) => void
  setShowCreateFolder: (open: boolean) => void
  setShowUploadDialog: (open: boolean) => void
  setViewMode: (viewMode: 'grid' | 'list') => void
  viewMode: 'grid' | 'list'
}

export function StorageBrowserHeader({
  breadcrumb,
  currentPath,
  isLoading,
  loadFiles,
  searchTerm,
  selectedBucket,
  selectedSourceTypes,
  setCurrentPath,
  setSearchTerm,
  setSelectedSourceTypes,
  setShowCreateFolder,
  setShowUploadDialog,
  setViewMode,
  viewMode,
}: StorageBrowserHeaderProps) {
  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setCurrentPath([])}
            className="text-muted-foreground hover:text-foreground"
          >
            Storage
          </button>
          {breadcrumb.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => setCurrentPath(breadcrumb.slice(1, index + 1))}
                className="text-muted-foreground hover:text-foreground"
              >
                {segment}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl font-bold"
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
          <Button
            className="rounded-xl font-bold"
            variant="outline"
            size="sm"
            onClick={() => selectedBucket && loadFiles(selectedBucket, currentPath)}
            disabled={isLoading || !selectedBucket}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          {selectedBucket && (
            <>
              <Button
                className="rounded-xl font-bold"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateFolder(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New folder
              </Button>
              <Button
                className="rounded-xl font-bold"
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-xl border-zinc-200 pl-10 dark:border-zinc-800"
          />
        </div>
        {!selectedBucket && (
          <div className="w-64">
            <MultiSelect
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'bucket', label: 'Buckets' },
                { value: 'minio', label: 'MinIO' },
                { value: 's3', label: 'AWS S3' },
                { value: 'sftp', label: 'SFTP' },
                { value: 'onedrive', label: 'OneDrive' },
                { value: 'google_drive', label: 'Google Drive' },
              ]}
              selected={selectedSourceTypes}
              onChange={(selected) => {
                if (selected.includes('all') && !selectedSourceTypes.includes('all')) {
                  setSelectedSourceTypes(['all'])
                } else if (selected.includes('all') && selected.length > 1) {
                  setSelectedSourceTypes(selected.filter((source) => source !== 'all'))
                } else if (selected.length === 0) {
                  setSelectedSourceTypes(['all'])
                } else {
                  setSelectedSourceTypes(selected)
                }
              }}
              placeholder="Filter sources"
            />
          </div>
        )}
      </div>
    </div>
  )
}
