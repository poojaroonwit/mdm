'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PwaIconInputProps {
  value: string
  onChange: (value: string) => void
}

export function PwaIconInput({ value, onChange }: PwaIconInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-start gap-4">
          <div className="shrink-0">
             <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/20 relative group">
                {value ? (
                   <img src={value} alt="Icon Preview" className="w-full h-full object-cover" />
                ) : (
                   <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="h-7 w-7 p-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
                       <Upload className="h-3.5 w-3.5" />
                    </Button>
                </div>
             </div>
             <p className="text-[10px] text-muted-foreground mt-1 text-center">512x512px</p>
          </div>

          <div className="flex-1 space-y-3">
             <div className="grid gap-2">
                <Label className="text-xs">Upload Image</Label>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                   </Button>
                   <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                   />
                </div>
             </div>
             
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                   <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
             </div>

             <div className="grid gap-2">
                <Label className="text-xs">Image URL</Label>
                <div className="relative">
                   <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                      value={value} 
                      onChange={(e) => onChange(e.target.value)} 
                      placeholder="https://example.com/icon.png" 
                      className="pl-9"
                   />
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}
