"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, File, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useFileDragDrop } from '@/hooks/use-file-drag-drop'

interface FileUploadProps {
  spaceId: string
  attributeId: string
  onUploadComplete?: (file: any) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // in MB
  allowedFileTypes?: string[] // file extensions
  multiple?: boolean
  disabled?: boolean
  className?: string
}

export function FileUpload({
  spaceId,
  attributeId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10,
  allowedFileTypes = [],
  multiple = false,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate files
    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`)
        onUploadError?.(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`)
        return
      }

      // Check file type
      if (allowedFileTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
          toast.error(`File type .${fileExtension} is not allowed`)
          onUploadError?.(`File type .${fileExtension} is not allowed`)
          return
        }
      }
    }

    setUploading(true)

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('spaceId', spaceId)
        formData.append('attributeId', attributeId)

        const response = await fetch('/api/attachments/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const result = await response.json()
        return result.attachment
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setUploadedFiles(prev => [...prev, ...uploadedFiles])
      
      uploadedFiles.forEach(file => {
        onUploadComplete?.(file)
        toast.success(`File ${file.originalName} uploaded successfully`)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const {
    dragOver,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange,
    openFileDialog
  } = useFileDragDrop({
    disabled,
    onFilesSelected: handleFileSelect,
    multiple
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
          ${dragOver 
            ? 'border-zinc-500 bg-zinc-500/10' 
            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10'}
          ${disabled 
            ? 'opacity-30 cursor-not-allowed' 
            : 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="h-8 w-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-500 opacity-60" />
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          MAX {maxFileSize}MB
          {allowedFileTypes.length > 0 && (
            <span> • {allowedFileTypes.join(', ')}</span>
          )}
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100/60 dark:border-zinc-800/60 shadow-sm animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="uppercase tracking-widest">Uploading files</span>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Uploaded Files</Label>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white/50 dark:bg-zinc-900/50 border border-zinc-100/60 dark:border-zinc-800/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{file.originalName}</p>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFile(file.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
