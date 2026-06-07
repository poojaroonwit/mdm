'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Cloud, Folder, HardDrive, Plus, Server } from 'lucide-react'
import type { Bucket } from '../types'
import type { StorageProviderType } from '@/lib/storage-config'

interface StorageConnection {
  id: string
  name: string
  type: StorageProviderType
  status: string
  isActive: boolean
}

const STORAGE_TYPES: { value: StorageProviderType; label: string; icon: any }[] = [
  { value: 'minio', label: 'MinIO', icon: Server },
  { value: 's3', label: 'AWS S3', icon: Cloud },
  { value: 'sftp', label: 'SFTP', icon: Server },
  { value: 'onedrive', label: 'OneDrive', icon: Cloud },
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
]

interface StorageSourcesSidebarProps {
  buckets: Bucket[]
  selectedBucket: string | null
  selectedSourceTypes: string[]
  setCurrentPath: (path: string[]) => void
  setSelectedBucket: (bucketId: string | null) => void
  setSelectedSourceTypes: (sourceTypes: string[]) => void
  setShowConnectionsManager: (open: boolean) => void
  setShowCreateBucket: (open: boolean) => void
  storageConnections: StorageConnection[]
}

export function StorageSourcesSidebar({
  buckets,
  selectedBucket,
  selectedSourceTypes,
  setCurrentPath,
  setSelectedBucket,
  setSelectedSourceTypes,
  setShowConnectionsManager,
  setShowCreateBucket,
  storageConnections,
}: StorageSourcesSidebarProps) {
  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Sources</h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-xl p-0 font-bold"
              onClick={() => setShowCreateBucket(true)}
              title="Create Bucket"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-xl p-0 font-bold"
              onClick={() => setShowConnectionsManager(true)}
              title="Add Storage Connection"
            >
              <Server className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'mb-2 w-full justify-start rounded-xl font-bold',
            !selectedBucket && selectedSourceTypes.includes('all') && 'bg-muted font-medium'
          )}
          onClick={() => {
            setSelectedBucket(null)
            setSelectedSourceTypes(['all'])
            setCurrentPath([])
          }}
        >
          <HardDrive className="h-4 w-4 mr-2" />
          All Sources
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start rounded-xl font-bold"
          onClick={() => setShowCreateBucket(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New bucket
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {buckets.map((bucket) => (
            <button
              key={bucket.id}
              onClick={() => {
                setSelectedBucket(bucket.id)
                setCurrentPath([])
              }}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-muted',
                selectedBucket === bucket.id && 'bg-muted font-medium'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{bucket.name}</span>
                </div>
                {bucket.public && (
                  <Badge className="ml-2 rounded-lg text-xs font-bold" variant="outline">Public</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 ml-6">
                {bucket.fileCount} files - Storage: {bucket.storageName || 'System Default'}
              </div>
            </button>
          ))}
          {storageConnections
            .filter((connection) => connection.isActive && connection.status === 'connected')
            .map((connection) => {
              const typeInfo = STORAGE_TYPES.find((type) => type.value === connection.type)
              const TypeIcon = typeInfo?.icon || HardDrive

              return (
                <button
                  key={connection.id}
                  onClick={() => {
                    setSelectedBucket(null)
                    setSelectedSourceTypes([connection.type])
                    setCurrentPath([])
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-muted',
                    !selectedBucket &&
                      selectedSourceTypes.includes(connection.type) &&
                      'bg-muted font-medium'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{connection.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 ml-6">
                    {typeInfo?.label || connection.type}
                  </div>
                </button>
              )
            })}
        </div>
      </ScrollArea>
    </div>
  )
}
