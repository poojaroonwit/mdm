'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FaviconUploadProps {
  currentFavicon?: string
  onFaviconChange: (faviconUrl: string) => void
  onRemove: () => void
}

export function FaviconUpload({ currentFavicon, onFaviconChange, onRemove }: FaviconUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentFavicon || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (PNG, JPG, GIF, SVG, ICO)')
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError('File size must be less than 1MB')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
      }
      reader.readAsDataURL(file)

      // Upload file
      const formData = new FormData()
      formData.append('favicon', file)

      const response = await fetch('/api/upload/favicon', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload favicon')
      }

      const { url } = await response.json()
      onFaviconChange(url)
      toast.success('Favicon updated successfully')
    } catch (error) {
      console.error('Error uploading favicon:', error)
      setError('Failed to upload favicon')
      toast.error('Failed to upload favicon')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Favicon removed')
  }

  const handleUrlChange = (url: string) => {
    if (url.trim()) {
      setPreview(url)
      onFaviconChange(url)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5" />
          <span>Favicon Settings</span>
        </CardTitle>
        <CardDescription>
          Upload or specify a URL for your application's favicon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Favicon Preview */}
        {preview && (
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Current Favicon</Label>
            <div className="flex items-center space-x-4 p-4 border border-zinc-100/60 dark:border-zinc-800/60 rounded-2xl bg-white/50 dark:bg-zinc-950/20 backdrop-blur-md shadow-inner-sm">
              <div className="w-16 h-16 border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/30">
                <img 
                  src={preview} 
                  alt="Favicon preview" 
                  className="w-12 h-12 object-contain"
                  onError={() => setError('Failed to load favicon image')}
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                  {preview.startsWith('data:') ? 'STORAGE' : 'REMOTE'}
                </p>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 break-all mt-0.5">
                  {preview.length > 50 ? `${preview.substring(0, 50)}...` : preview}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 border-rose-100/50 dark:border-rose-900/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 rounded-xl">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 tracking-tight">{error}</span>
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="favicon-upload" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Upload Favicon</Label>
            <div className="flex items-center space-x-2">
              <Input
                ref={fileInputRef}
                id="favicon-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
              </Button>
            </div>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
              SUPPORTS: PNG, JPG, GIF, SVG, ICO (MAX 1MB)
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="favicon-url" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Or Enter URL</Label>
            <Input
              id="favicon-url"
              type="url"
              placeholder="https://example.com/favicon.ico"
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
              SPECIFY A DIRECT URL TO AN IMAGE FILE
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
