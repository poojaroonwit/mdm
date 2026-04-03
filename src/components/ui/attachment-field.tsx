"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { Download, Trash2, File, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface AttachmentFieldProps {
  spaceId: string
  attributeId: string
  value?: any[] // Array of attachment objects
  onChange?: (attachments: any[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export function AttachmentField({
  spaceId,
  attributeId,
  value = [],
  onChange,
  maxFiles = 10,
  disabled = false,
  className = ''
}: AttachmentFieldProps) {
  const [attachments, setAttachments] = useState<any[]>(value)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAttachments(value)
  }, [value])

  const handleUploadComplete = (file: any) => {
    const newAttachments = [...attachments, file]
    setAttachments(newAttachments)
    onChange?.(newAttachments)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (disabled) return

    try {
      setLoading(true)
      
      // Call delete API endpoint
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      // Remove from local state
      const newAttachments = attachments.filter(att => att.id !== attachmentId)
      setAttachments(newAttachments)
      onChange?.(newAttachments)
      
      toast.success('File deleted successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/download`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const canUploadMore = attachments.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section */}
      {canUploadMore && (
        <FileUpload
          spaceId={spaceId}
          attributeId={attributeId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          multiple={true}
          disabled={disabled}
        />
      )}

      {/* File Limit Warning */}
      {!canUploadMore && (
        <div className="flex items-center space-x-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/50 rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Maximum number of files ({maxFiles}) reached
          </span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Attached Files ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-white/50 dark:bg-zinc-900/50 border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{attachment.originalName}</p>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    disabled={disabled || loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 bg-zinc-50/30 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <File className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No files attached</p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">Upload files using the area above</p>
        </div>
      )}
    </div>
  )
}
