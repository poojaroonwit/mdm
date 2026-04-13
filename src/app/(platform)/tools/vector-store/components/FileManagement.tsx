'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  CloudArrowUpIcon, 
  TrashIcon, 
  DocumentIcon, 
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface FileManagementProps {
  vectorStoreId: string
  vectorStoreName: string
}

export function FileManagement({ vectorStoreId, vectorStoreName }: FileManagementProps) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchFiles = useCallback(async () => {
    if (!vectorStoreId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/vector-stores/${vectorStoreId}/files`)
      const data = await res.json()
      if (data.files) {
        setFiles(data.files)
      } else {
        toast.error(data.error || 'Failed to fetch files')
      }
    } catch (err) {
      toast.error('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [vectorStoreId])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !vectorStoreId) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/vector-stores/${vectorStoreId}/files`, {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(`File "${file.name}" uploaded and attached`)
        await fetchFiles()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to remove "${fileName}" from this vector store?`)) return

    try {
      const res = await fetch(`/api/vector-stores/${vectorStoreId}/files/${fileId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`File removed`)
        setFiles(files.filter(f => f.id !== fileId))
      } else {
        toast.error(data.error || 'Failed to remove file')
      }
    } catch (err) {
      toast.error('Failed to remove file')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{vectorStoreName}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50">{vectorStoreId}</span>
            <span className="text-border">•</span>
            {files.length} {files.length === 1 ? 'file' : 'files'} attached
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading}>
            <ArrowPathIcon className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.docx,.txt,.json,.csv"
            />
            <Button size="sm" disabled={uploading} className="bg-primary hover:bg-primary/90">
              {uploading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Warning/Info Box */}
      <Card className="bg-blue-50/50 border-blue-100 p-4 flex gap-3 text-sm text-blue-800">
        <InformationCircleIcon className="h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <p className="font-semibold">Vector Store Usage</p>
          <p className="mt-1 opacity-80">
            Files uploaded here will be used for <strong>File Search</strong> when this Vector Store ID is assigned to an Agent SDK chatbot. 
            OpenAI handles the chunking and indexing automatically.
          </p>
        </div>
      </Card>

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && files.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/20 border-muted">
              <div className="h-full w-full" />
            </Card>
          ))
        ) : files.length > 0 ? (
          files.map(file => (
            <Card key={file.id} className="group relative p-4 flex gap-4 items-center hover:border-primary/30 transition-all hover:shadow-md bg-card">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                <DocumentIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate pr-6" title={file.name}>{file.name}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>{formatSize(file.size)}</span>
                  <span>•</span>
                  <span className={cn(
                    "px-1 rounded-sm",
                    file.status === 'completed' ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50"
                  )}>
                    {file.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(file.id, file.name)}
                className="p-2 absolute right-2 top-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                title="Remove from vector store"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-muted rounded-md bg-muted/10">
            <DocumentIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No files attached to this vector store yet.</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase mt-4 tracking-widest font-bold">Supported: .pdf, .docx, .txt, .json</p>
          </div>
        )}
      </div>
    </div>
  )
}
