'use client'

import { useState, useEffect } from 'react'
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { 
  Cloud, 
  Plus, 
  Settings, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Key,
  Server,
  Folder,
  File,
  Image,
  FileText,
  Archive,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Database,
  Link,
  Paperclip,
  Video,
  Music,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  FileText as FilePdf,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Attachment {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  isPublic: boolean
  spaceId: string
  spaceName: string
  entityId?: string
  entityType?: string
  createdAt: Date
  updatedAt: Date
  uploadedBy: string
  uploadedByName: string
  storageProvider: 'local' | 's3' | 'supabase' | 'cloudflare' | 'url'
  metadata?: Record<string, any>
}

interface Space {
  id: string
  name: string
  slug: string
  attachmentCount: number
}

export function AttachmentManager() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterProvider, setFilterProvider] = useState('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadSpace, setUploadSpace] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadAttachments()
    loadSpaces()
  }, [selectedSpace, searchTerm, filterType, filterProvider])

  const loadAttachments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        spaceId: selectedSpace,
        search: searchTerm,
        type: filterType,
        provider: filterProvider
      })
      
      const response = await fetch(`/api/admin/attachments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const handleUploadFile = async () => {
    if (!uploadFile || !uploadSpace) {
      toast.error('Please select a file and space')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('spaceId', uploadSpace)

      const response = await fetch('/api/admin/attachments/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('File uploaded successfully')
        setShowUploadDialog(false)
        setUploadFile(null)
        setUploadSpace('')
        loadAttachments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      const response = await fetch(`/api/admin/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAttachments(attachments.filter(a => a.id !== attachmentId))
        if (selectedAttachment?.id === attachmentId) {
          setSelectedAttachment(null)
        }
        toast.success('Attachment deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete attachment')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error('Failed to delete attachment')
    }
  }

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/admin/attachments/${attachment.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.originalName
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to download file')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Failed to download file')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-500" />
    if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4 text-green-500" />
    if (mimeType.includes('pdf')) return <FilePdf className="h-4 w-4 text-red-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />
    if (mimeType.includes('text/') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-gray-500" />
    if (mimeType.includes('code/') || mimeType.includes('javascript') || mimeType.includes('python')) return <FileCode className="h-4 w-4 text-orange-500" />
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-4 w-4 text-yellow-500" />
    return <File className="h-4 w-4 text-gray-400" />
  }

  const getStorageProviderIcon = (provider: string) => {
    switch (provider) {
      case 'local':
        return <Database className="h-4 w-4 text-blue-500" />
      case 's3':
        return <Cloud className="h-4 w-4 text-orange-500" />
      case 'supabase':
        return <Server className="h-4 w-4 text-green-500" />
      case 'cloudflare':
        return <Cloud className="h-4 w-4 text-orange-500" />
      case 'url':
        return <Link className="h-4 w-4 text-purple-500" />
      default:
        return <Paperclip className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeCategory = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('audio/')) return 'Audio'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet'
    if (mimeType.includes('text/') || mimeType.includes('document')) return 'Document'
    if (mimeType.includes('code/') || mimeType.includes('javascript') || mimeType.includes('python')) return 'Code'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Archive'
    return 'Other'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Paperclip className="h-6 w-6" />
            Attachment Manager
          </h2>
          <p className="text-muted-foreground">
            Manage all attachments across all spaces
          </p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload a new file to a space
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="p-6 pt-2 pb-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor="space">Target Space</Label>
                  <Select value={uploadSpace} onValueChange={setUploadSpace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadFile} disabled={isUploading || !uploadFile || !uploadSpace}>
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search attachments..."
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Spaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Spaces</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name} ({space.attachmentCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="archive">Archives</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="local">Local Storage</SelectItem>
                  <SelectItem value="s3">AWS S3</SelectItem>
                  <SelectItem value="supabase">Supabase</SelectItem>
                  <SelectItem value="cloudflare">Cloudflare</SelectItem>
                  <SelectItem value="url">URL Links</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="w-full space-y-3 p-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No attachments found</h3>
            <p className="text-muted-foreground">
              Upload files or adjust your filters to see attachments
            </p>
          </div>
        ) : (
          attachments.map(attachment => (
            <Card 
              key={attachment.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedAttachment(attachment)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {attachment.thumbnailUrl ? (
                      <img 
                        src={attachment.thumbnailUrl} 
                        alt={attachment.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        {getFileIcon(attachment.mimeType)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{attachment.name}</span>
                      {attachment.isPublic ? (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {formatFileSize(attachment.size)} • {getFileTypeCategory(attachment.mimeType)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getStorageProviderIcon(attachment.storageProvider)}
                      <span>{attachment.spaceName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    {attachment.uploadedByName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadAttachment(attachment)
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAttachment(attachment.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Attachment Details Modal */}
      {selectedAttachment && (
        <Dialog open={!!selectedAttachment} onOpenChange={() => setSelectedAttachment(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(selectedAttachment.mimeType)}
                {selectedAttachment.name}
              </DialogTitle>
              <DialogDescription>
                {selectedAttachment.spaceName} • {getFileTypeCategory(selectedAttachment.mimeType)}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="p-6 pt-2 pb-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Original Name:</span> {selectedAttachment.originalName}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {formatFileSize(selectedAttachment.size)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedAttachment.mimeType}
                  </div>
                  <div>
                    <span className="font-medium">Provider:</span> 
                    <div className="flex items-center gap-1 mt-1">
                      {getStorageProviderIcon(selectedAttachment.storageProvider)}
                      <span className="capitalize">{selectedAttachment.storageProvider}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded by:</span> {selectedAttachment.uploadedByName}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedAttachment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {selectedAttachment.url && (
                  <div>
                    <Label>URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={selectedAttachment.url} readOnly className="text-xs" />
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(selectedAttachment.url)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setSelectedAttachment(null)}>
                Close
              </Button>
              <Button onClick={() => downloadAttachment(selectedAttachment)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
