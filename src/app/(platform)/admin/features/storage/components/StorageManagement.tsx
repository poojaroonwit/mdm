'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Folder,
  File,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Archive,
  Music,
  Code,
} from 'lucide-react'
import { Bucket, StorageFile } from '../types'
import { StorageProviderType } from '@/lib/storage-config'
import { StorageBrowserHeader } from './StorageBrowserHeader'
import { StorageBrowserPanel } from './StorageBrowserPanel'
import { StorageManagementDialogs } from './StorageManagementDialogs'
import { StorageSourcesSidebar } from './StorageSourcesSidebar'

interface StorageConnection {
  id: string
  name: string
  type: StorageProviderType
  status: string
  isActive: boolean
}

export function StorageManagement() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [storageConnections, setStorageConnections] = useState<StorageConnection[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>(['all'])
  const [files, setFiles] = useState<StorageFile[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [showConnectionsManager, setShowConnectionsManager] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [isPublicBucket, setIsPublicBucket] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [showFilePreview, setShowFilePreview] = useState<StorageFile | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMetadata, setShowMetadata] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [selectedFileForAction, setSelectedFileForAction] = useState<StorageFile | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    loadBuckets()
    loadStorageConnections()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      loadFiles(selectedBucket, currentPath)
    } else if (storageConnections.length > 0) {
      // Load files from all sources when no bucket is selected
      loadAllFiles()
    }
  }, [selectedBucket, currentPath, selectedSourceTypes, storageConnections.length, searchTerm])

  const loadBuckets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/storage/buckets')
      if (response.ok) {
        const data = await response.json()
        setBuckets(data.buckets || [])
      }
    } catch (error) {
      console.error('Error loading buckets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStorageConnections = async () => {
    try {
      const response = await fetch('/api/admin/storage/connections')
      if (response.ok) {
        const data = await response.json()
        setStorageConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error loading storage connections:', error)
    }
  }

  const loadAllFiles = async () => {
    setIsLoading(true)
    try {
      const allFiles: StorageFile[] = []

      // If 'bucket' is selected or 'all' is in the list with no specific filters preventing buckets
      if (selectedSourceTypes.includes('all') || selectedSourceTypes.includes('bucket')) {
        // Load files from all buckets
        for (const bucket of buckets) {
          try {
            const response = await fetch(
              `/api/admin/storage/buckets/${bucket.id}/files?path=${encodeURIComponent(
                currentPath.join('/')
              )}&search=${encodeURIComponent(searchTerm || '')}`
            )
            if (response.ok) {
              const data = await response.json()
              const filesWithSource = (data.files || []).map((file: StorageFile) => ({
                ...file,
                sourceType: 'bucket',
                sourceName: bucket.name,
              }))
              allFiles.push(...filesWithSource)
            }
          } catch (error) {
            console.error(`Error loading files from bucket ${bucket.name}:`, error)
          }
        }
      }

      // Load files from storage connections (if not filtering by bucket only)
      if (!selectedSourceTypes.includes('bucket') || selectedSourceTypes.includes('all') || selectedSourceTypes.length > 1) {
        const activeConnections = storageConnections.filter(
          (conn) => conn.isActive && conn.status === 'connected'
        )

        // Filter by source type if not 'all'
        const filteredConnections = selectedSourceTypes.includes('all')
            ? activeConnections
            : activeConnections.filter((conn) => selectedSourceTypes.includes(conn.type))

        // Fetch files from each connection
        for (const connection of filteredConnections) {
          try {
            const response = await fetch(
              `/api/admin/storage/connections/${connection.id}/files?path=${encodeURIComponent(
                currentPath.join('/')
              )}&search=${encodeURIComponent(searchTerm || '')}`
            )
            if (response.ok) {
              const data = await response.json()
              const filesWithSource = (data.files || []).map((file: StorageFile) => ({
                ...file,
                sourceType: connection.type,
                sourceName: connection.name,
              }))
              allFiles.push(...filesWithSource)
            }
          } catch (error) {
            console.error(`Error loading files from ${connection.name}:`, error)
          }
        }
      }

      setFiles(allFiles)
    } catch (error) {
      console.error('Error loading all files:', error)
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFiles = async (bucketId: string, path: string[] = []) => {
    setIsLoading(true)
    try {
      const pathParam = path.length > 0 ? path.join('/') : ''
      const response = await fetch(
        `/api/admin/storage/buckets/${bucketId}/files?path=${encodeURIComponent(
          pathParam
        )}&search=${encodeURIComponent(searchTerm || '')}`
      )
      if (response.ok) {
        const data = await response.json()
        const filesWithSource = (data.files || []).map((file: StorageFile) => ({
          ...file,
          sourceType: 'bucket',
          sourceName: buckets.find((b) => b.id === bucketId)?.name || 'Bucket',
        }))
        setFiles(filesWithSource)
      }
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return

    try {
      const response = await fetch('/api/admin/storage/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBucketName,
          public: isPublicBucket
        })
      })

      if (response.ok) {
        toast.success('Bucket created successfully')
        setShowCreateBucket(false)
        setNewBucketName('')
        setIsPublicBucket(false)
        loadBuckets()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bucket')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create bucket')
    }
  }

  const handleUpload = async () => {
    if (!selectedBucket || uploadFiles.length === 0) return

    const formData = new FormData()
    uploadFiles.forEach(file => {
      formData.append('files', file)
    })
    formData.append('path', currentPath.join('/'))

    try {
      const xhr = new XMLHttpRequest()

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          toast.success('Files uploaded successfully')
          setShowUploadDialog(false)
          setUploadFiles([])
          loadFiles(selectedBucket, currentPath)
        }
      })

      xhr.open('POST', `/api/admin/storage/buckets/${selectedBucket}/upload`)
      xhr.send(formData)
    } catch (error) {
      toast.error('Failed to upload files')
    }
  }

  const handleDeleteFiles = async (fileIds: string[]) => {
    const filesToDelete = files.filter(f => fileIds.includes(f.id))
    const folderCount = filesToDelete.filter(f => f.type === 'folder' || f.mimeType === 'folder').length
    const fileCount = filesToDelete.length - folderCount
    
    let message = 'Are you sure you want to delete '
    if (folderCount > 0 && fileCount > 0) {
      message += `${folderCount} folder${folderCount > 1 ? 's' : ''} and ${fileCount} file${fileCount > 1 ? 's' : ''}?`
    } else if (folderCount > 0) {
      message += `${folderCount} folder${folderCount > 1 ? 's' : ''}?`
    } else {
      message += `${fileCount} file${fileCount > 1 ? 's' : ''}?`
    }
    
    if (!confirm(message)) return

    try {
      const response = await fetch('/api/admin/storage/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds })
      })

      if (response.ok) {
        const itemType = folderCount > 0 && fileCount === 0 ? 'Folder' : folderCount === 0 ? 'File' : 'Items'
        toast.success(`${itemType} deleted successfully`)
        setSelectedFiles(new Set())
        loadFiles(selectedBucket!, currentPath)
      }
    } catch (error) {
      toast.error('Failed to delete items')
    }
  }

  const handleDownload = async (file: StorageFile) => {
    try {
      const response = await fetch(`/api/admin/storage/files/${file.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const handleCopyUrl = async (file: StorageFile) => {
    if (file.publicUrl) {
      const { copyToClipboard } = await import('@/lib/clipboard')
      const success = await copyToClipboard(file.publicUrl)
      if (success) {
        toast.success('Public URL copied to clipboard')
      } else {
        toast.error('Failed to copy URL')
      }
    }
  }

  const handleRename = async () => {
    if (!selectedFileForAction || !renameValue.trim()) return

    try {
      const response = await fetch(`/api/admin/storage/files/${selectedFileForAction.id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renameValue.trim() })
      })

      if (response.ok) {
        toast.success('File renamed successfully')
        setShowRename(false)
        setRenameValue('')
        setSelectedFileForAction(null)
        if (selectedBucket) {
          loadFiles(selectedBucket, currentPath)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to rename file')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename file')
    }
  }

  const handleShare = async (file: StorageFile, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/admin/storage/files/${file.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic, permissionLevel: 'view' })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(isPublic ? 'File is now public' : 'File is now private')
        if (selectedBucket) {
          loadFiles(selectedBucket, currentPath)
        }
        return data.file
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update file sharing')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update file sharing')
      return null
    }
  }

  const handleCreateFolder = async () => {
    if (!selectedBucket || !newFolderName.trim()) return

    try {
      const response = await fetch(`/api/admin/storage/buckets/${selectedBucket}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          path: currentPath.join('/')
        })
      })

      if (response.ok) {
        toast.success('Folder created successfully')
        setShowCreateFolder(false)
        setNewFolderName('')
        loadFiles(selectedBucket, currentPath)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create folder')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create folder')
    }
  }

  const handleFolderClick = (file: StorageFile) => {
    // If it's a folder, navigate into it
    if (file.type === 'folder' || file.mimeType === 'folder') {
      // Extract the folder name from the path
      const pathParts = file.path ? file.path.split('/').filter(p => p) : []
      const folderName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : file.name
      setCurrentPath([...currentPath, folderName])
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  const getFileIcon = (file: StorageFile) => {
    // Check if it's a folder first
    if (file.type === 'folder' || file.mimeType === 'folder') {
      return <Folder className="h-5 w-5 text-yellow-500" />
    }
    const mimeType = file.mimeType || ''
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (mimeType.startsWith('video/')) return <VideoIcon className="h-5 w-5 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5 text-pink-500" />
    if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-5 w-5 text-yellow-500" />
    if (mimeType.startsWith('application/javascript') || mimeType.includes('code')) return <Code className="h-5 w-5 text-green-500" />
    return <File className="h-5 w-5 text-muted-foreground" />
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentBucket = buckets.find(b => b.id === selectedBucket)
  const breadcrumb = currentBucket ? [currentBucket.name, ...currentPath] : []

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <StorageSourcesSidebar
        buckets={buckets}
        selectedBucket={selectedBucket}
        selectedSourceTypes={selectedSourceTypes}
        setCurrentPath={setCurrentPath}
        setSelectedBucket={setSelectedBucket}
        setSelectedSourceTypes={setSelectedSourceTypes}
        setShowConnectionsManager={setShowConnectionsManager}
        setShowCreateBucket={setShowCreateBucket}
        storageConnections={storageConnections}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StorageBrowserHeader
          breadcrumb={breadcrumb}
          currentPath={currentPath}
          isLoading={isLoading}
          loadFiles={loadFiles}
          searchTerm={searchTerm}
          selectedBucket={selectedBucket}
          selectedSourceTypes={selectedSourceTypes}
          setCurrentPath={setCurrentPath}
          setSearchTerm={setSearchTerm}
          setSelectedSourceTypes={setSelectedSourceTypes}
          setShowCreateFolder={setShowCreateFolder}
          setShowUploadDialog={setShowUploadDialog}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />

        <StorageBrowserPanel
          files={files}
          filteredFiles={filteredFiles}
          formatBytes={formatBytes}
          getFileIcon={getFileIcon}
          isLoading={isLoading}
          searchTerm={searchTerm}
          selectedBucket={selectedBucket}
          selectedFiles={selectedFiles}
          selectedSourceTypes={selectedSourceTypes}
          setRenameValue={setRenameValue}
          setSelectedFileForAction={setSelectedFileForAction}
          setSelectedFiles={setSelectedFiles}
          setShowFilePreview={setShowFilePreview}
          setShowMetadata={setShowMetadata}
          setShowMove={setShowMove}
          setShowPermissions={setShowPermissions}
          setShowRename={setShowRename}
          setShowUploadDialog={setShowUploadDialog}
          viewMode={viewMode}
          onCopyUrl={handleCopyUrl}
          onDeleteFiles={handleDeleteFiles}
          onDownload={handleDownload}
          onFolderClick={handleFolderClick}
          onShare={handleShare}
        />
      </div>

      <StorageManagementDialogs
        currentBucket={currentBucket}
        currentPath={currentPath}
        formatBytes={formatBytes}
        getFileIcon={getFileIcon}
        isPublicBucket={isPublicBucket}
        newBucketName={newBucketName}
        newFolderName={newFolderName}
        renameValue={renameValue}
        selectedFileForAction={selectedFileForAction}
        showConnectionsManager={showConnectionsManager}
        showCreateBucket={showCreateBucket}
        showCreateFolder={showCreateFolder}
        showFilePreview={showFilePreview}
        showMetadata={showMetadata}
        showMove={showMove}
        showPermissions={showPermissions}
        showRename={showRename}
        showUploadDialog={showUploadDialog}
        uploadFiles={uploadFiles}
        handleCreateBucket={handleCreateBucket}
        handleCreateFolder={handleCreateFolder}
        handleUpload={handleUpload}
        onCopyUrl={handleCopyUrl}
        onDownload={handleDownload}
        onRename={handleRename}
        onShare={handleShare}
        setIsPublicBucket={setIsPublicBucket}
        setNewBucketName={setNewBucketName}
        setNewFolderName={setNewFolderName}
        setRenameValue={setRenameValue}
        setSelectedFileForAction={setSelectedFileForAction}
        setShowConnectionsManager={setShowConnectionsManager}
        setShowCreateBucket={setShowCreateBucket}
        setShowCreateFolder={setShowCreateFolder}
        setShowFilePreview={setShowFilePreview}
        setShowMetadata={setShowMetadata}
        setShowMove={setShowMove}
        setShowPermissions={setShowPermissions}
        setShowRename={setShowRename}
        setShowUploadDialog={setShowUploadDialog}
        setUploadFiles={setUploadFiles}
      />
    </div>
  )
}
