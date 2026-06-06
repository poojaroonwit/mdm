'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileViewer } from '@/components/storage/FileViewer'
import { formatDateTime } from '@/lib/date-formatters'
import { Download, X } from 'lucide-react'
import type { StorageFile } from '../types'

interface StorageFilePreviewDialogProps {
  file: StorageFile | null
  onClose: () => void
  onDownload: (file: StorageFile) => void
  renderFileIcon: (file: StorageFile) => ReactNode
  formatBytes: (bytes: number) => string
}

export function StorageFilePreviewDialog({
  file,
  onClose,
  onDownload,
  renderFileIcon,
  formatBytes,
}: StorageFilePreviewDialogProps) {
  if (!file) return null

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {renderFileIcon(file)}
                {file.name}
              </DialogTitle>
              <DialogDescription>
                {formatBytes(file.size)} | {formatDateTime(file.updatedAt)} | {file.mimeType}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="rounded-xl font-bold"
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                className="rounded-xl font-bold"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <DialogBody className="mt-4 p-0">
          <FileViewer
            fileId={file.id}
            fileName={file.name}
            mimeType={file.mimeType || 'application/octet-stream'}
            publicUrl={file.publicUrl}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
