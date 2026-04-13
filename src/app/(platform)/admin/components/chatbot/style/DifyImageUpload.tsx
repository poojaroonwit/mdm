'use client'

import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface DifyImageUploadProps {
  value?: string
  onChange: (value: string) => void
}

export function DifyImageUpload({ value, onChange }: DifyImageUploadProps) {
  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted/50 flex items-center justify-center group">
          <img
            src={value}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <Input
        type="file"
        accept="image/*"
        id="dify-image-upload"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const loadingToast = toast.loading('Uploading image...')
          const fd = new FormData()
          fd.append('image', file)
          try {
            const res = await fetch('/api/upload/logo', { method: 'POST', body: fd })
            if (res.ok) {
              const data = await res.json()
              onChange(data.url)
              toast.success('Image uploaded', { id: loadingToast })
            } else {
              toast.error('Upload failed', { id: loadingToast })
            }
          } catch {
            toast.error('Upload failed', { id: loadingToast })
          } finally {
            e.target.value = ''
          }
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => document.getElementById('dify-image-upload')?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Image
      </Button>
    </div>
  )
}
