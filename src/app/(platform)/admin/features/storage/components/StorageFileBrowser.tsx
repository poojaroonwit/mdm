'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/date-formatters'
import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  Info,
  Lock,
  MoreVertical,
  Move,
  Pencil as Rename,
  Share2,
  Trash2,
} from 'lucide-react'
import type { StorageFile } from '../types'

interface StorageFileBrowserProps {
  files: StorageFile[]
  selectedFiles: Set<string>
  viewMode: 'grid' | 'list'
  setSelectedFiles: (files: Set<string>) => void
  setSelectedFileForAction: (file: StorageFile) => void
  setRenameValue: (value: string) => void
  setShowFilePreview: (file: StorageFile) => void
  setShowMetadata: (open: boolean) => void
  setShowMove: (open: boolean) => void
  setShowPermissions: (open: boolean) => void
  setShowRename: (open: boolean) => void
  formatBytes: (bytes: number) => string
  getFileIcon: (file: StorageFile) => ReactNode
  onCopyUrl: (file: StorageFile) => void
  onDeleteFiles: (fileIds: string[]) => void
  onDownload: (file: StorageFile) => void
  onFolderClick: (file: StorageFile) => void
  onShare: (file: StorageFile, makePublic: boolean) => void
}

function isStorageFolder(file: StorageFile) {
  return file.type === 'folder' || file.mimeType === 'folder'
}

function FileActionMenu({
  file,
  isFolder,
  setSelectedFileForAction,
  setRenameValue,
  setShowFilePreview,
  setShowMetadata,
  setShowMove,
  setShowPermissions,
  setShowRename,
  onCopyUrl,
  onDeleteFiles,
  onDownload,
  onShare,
}: {
  file: StorageFile
  isFolder: boolean
} & Pick<
  StorageFileBrowserProps,
  | 'setSelectedFileForAction'
  | 'setRenameValue'
  | 'setShowFilePreview'
  | 'setShowMetadata'
  | 'setShowMove'
  | 'setShowPermissions'
  | 'setShowRename'
  | 'onCopyUrl'
  | 'onDeleteFiles'
  | 'onDownload'
  | 'onShare'
>) {
  const selectForAction = () => setSelectedFileForAction(file)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-xl p-0 font-bold">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            setShowFilePreview(file)
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View / Preview
        </DropdownMenuItem>
        {!isFolder && (
          <>
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onDownload(file) }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            {file.publicUrl && (
              <>
                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onCopyUrl(file) }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); window.open(file.publicUrl, '_blank') }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            selectForAction()
            setRenameValue(file.name)
            setShowRename(true)
          }}
        >
          <Rename className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            selectForAction()
            setShowMove(true)
          }}
        >
          <Move className="h-4 w-4 mr-2" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            selectForAction()
            setShowPermissions(true)
          }}
        >
          <Lock className="h-4 w-4 mr-2" />
          Permissions
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            selectForAction()
            setShowMetadata(true)
          }}
        >
          <Info className="h-4 w-4 mr-2" />
          Metadata
        </DropdownMenuItem>
        {!isFolder && (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation()
              selectForAction()
              onShare(file, !file.publicUrl)
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {file.publicUrl ? 'Make Private' : 'Make Public'}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            onDeleteFiles([file.id])
          }}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StorageFileBrowser({
  files,
  selectedFiles,
  viewMode,
  setSelectedFiles,
  setSelectedFileForAction,
  setRenameValue,
  setShowFilePreview,
  setShowMetadata,
  setShowMove,
  setShowPermissions,
  setShowRename,
  formatBytes,
  getFileIcon,
  onCopyUrl,
  onDeleteFiles,
  onDownload,
  onFolderClick,
  onShare,
}: StorageFileBrowserProps) {
  const actionMenuProps = {
    setSelectedFileForAction,
    setRenameValue,
    setShowFilePreview,
    setShowMetadata,
    setShowMove,
    setShowPermissions,
    setShowRename,
    onCopyUrl,
    onDeleteFiles,
    onDownload,
    onShare,
  }

  return (
    <>
      {viewMode === 'list' ? (
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={(event) => {
                      setSelectedFiles(event.target.checked ? new Set(files.map((file) => file.id)) : new Set())
                    }}
                    className="rounded-lg border-zinc-200 dark:border-zinc-800"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const isFolder = isStorageFolder(file)
                return (
                  <TableRow
                    key={file.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={(event) => {
                      if (
                        (event.target as HTMLElement).closest('input[type="checkbox"]') ||
                        (event.target as HTMLElement).closest('[role="menuitem"]')
                      ) {
                        return
                      }
                      if (isFolder) {
                        onFolderClick(file)
                      } else {
                        setShowFilePreview(file)
                      }
                    }}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={(event) => {
                          event.stopPropagation()
                          const nextSelected = new Set(selectedFiles)
                          if (event.target.checked) {
                            nextSelected.add(file.id)
                          } else {
                            nextSelected.delete(file.id)
                          }
                          setSelectedFiles(nextSelected)
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg border-zinc-200 dark:border-zinc-800"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <div className="flex flex-col">
                          <span className="font-medium">{file.name}</span>
                          {(file as any).sourceName && (
                            <span className="text-xs text-muted-foreground">
                              {(file as any).sourceType === 'bucket'
                                ? `Bucket: ${(file as any).sourceName}`
                                : `${(file as any).sourceName} (${(file as any).sourceType})`}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{isFolder ? '-' : formatBytes(file.size)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(file.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <FileActionMenu file={file} isFolder={isFolder} {...actionMenuProps} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file) => {
            const isFolder = isStorageFolder(file)
            return (
              <div
                key={file.id}
                className="border rounded-lg p-4 hover:bg-muted cursor-pointer group relative"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('[role="menuitem"]')) return
                  if (isFolder) {
                    onFolderClick(file)
                  } else {
                    setShowFilePreview(file)
                  }
                }}
              >
                <div className="aspect-square mb-3 flex items-center justify-center bg-muted rounded">
                  {file.mimeType?.startsWith('image/') && file.publicUrl ? (
                    <img src={file.publicUrl} alt={file.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <div className="flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {isFolder ? 'Folder' : formatBytes(file.size)}
                      </p>
                      {(file as any).sourceName && (
                        <Badge className="rounded-lg text-xs font-bold" variant="outline">
                          {(file as any).sourceType === 'bucket'
                            ? (file as any).sourceName
                            : (file as any).sourceType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <FileActionMenu file={file} isFolder={isFolder} {...actionMenuProps} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedFiles.size > 0 && (
        <div className="border-t bg-background px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-xl font-bold"
              variant="outline"
              size="sm"
              onClick={() => onDeleteFiles(Array.from(selectedFiles))}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              className="rounded-xl font-bold"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles(new Set())}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
