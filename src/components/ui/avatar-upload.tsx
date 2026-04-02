'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { AVATAR_LIBRARY, getAvatarByCategory, type AvatarOption } from '@/lib/avatar-library'

interface AvatarUploadProps {
  userId: string
  currentAvatar?: string
  userName?: string
  userEmail?: string
  onAvatarChange?: (avatarUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  showUploadButton?: boolean
  disabled?: boolean
}

export function AvatarUpload({
  userId,
  currentAvatar,
  userName,
  userEmail,
  onAvatarChange,
  size = 'md',
  showUploadButton = true,
  disabled = false
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [showLibraryDialog, setShowLibraryDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24'
  }

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      toast.success('Avatar uploaded successfully')
      setPreview(null)
      onAvatarChange?.(data.avatar)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    setUploading(true)
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Remove failed')
      }

      toast.success('Avatar removed successfully')
      onAvatarChange?.(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove avatar')
    } finally {
      setUploading(false)
    }
  }

  const selectAvatarFromLibrary = async (avatarUrl: string) => {
    setUploading(true)
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to set avatar')
      }

      const data = await response.json()
      toast.success('Avatar selected successfully')
      setShowLibraryDialog(false)
      onAvatarChange?.(data.avatar)
    } catch (error: any) {
      toast.error(error.message || 'Failed to select avatar')
    } finally {
      setUploading(false)
    }
  }

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (userEmail) {
      return userEmail[0].toUpperCase()
    }
    return 'U'
  }

  const displayAvatar = preview || currentAvatar

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={displayAvatar || undefined} alt={userName || 'User'} />
          <AvatarFallback className="text-xs">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-zinc-950/60 rounded-full backdrop-blur-[2px] ${sizeClasses[size]}`}>
            <Loader2 className="h-4 w-4 animate-spin text-white dark:text-zinc-100" />
          </div>
        )}
      </div>

      {showUploadButton && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Upload
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLibraryDialog(true)}
              disabled={uploading || disabled}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Library
            </Button>
            
            {currentAvatar && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeAvatar}
                disabled={uploading || disabled}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Upload image or select from library
          </p>
        </div>
      )}

      {/* Avatar Library Dialog */}
      <Dialog open={showLibraryDialog} onOpenChange={setShowLibraryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Avatar from Library</DialogTitle>
            <DialogDescription>
              Choose an avatar from our library or upload your own
            </DialogDescription>
          </DialogHeader>
          
          <div className="w-full">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="abstract">Abstract</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto">
                {AVATAR_LIBRARY.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => selectAvatarFromLibrary(avatar.url)}
                    disabled={uploading}
                    className="relative aspect-square rounded-full overflow-hidden border border-zinc-100/60 dark:border-zinc-800/60 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm bg-zinc-50 dark:bg-zinc-900"
                    title={avatar.name}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="people" className="mt-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto">
                {getAvatarByCategory('people').map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => selectAvatarFromLibrary(avatar.url)}
                    disabled={uploading}
                    className="relative aspect-square rounded-full overflow-hidden border border-zinc-100/60 dark:border-zinc-800/60 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm bg-zinc-50 dark:bg-zinc-900"
                    title={avatar.name}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="abstract" className="mt-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto">
                {getAvatarByCategory('abstract').map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => selectAvatarFromLibrary(avatar.url)}
                    disabled={uploading}
                    className="relative aspect-square rounded-full overflow-hidden border border-zinc-100/60 dark:border-zinc-800/60 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm bg-zinc-50 dark:bg-zinc-900"
                    title={avatar.name}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="characters" className="mt-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto">
                {getAvatarByCategory('characters').map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => selectAvatarFromLibrary(avatar.url)}
                    disabled={uploading}
                    className="relative aspect-square rounded-full overflow-hidden border border-zinc-100/60 dark:border-zinc-800/60 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm bg-zinc-50 dark:bg-zinc-900"
                    title={avatar.name}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || disabled}
      />
    </div>
  )
}
