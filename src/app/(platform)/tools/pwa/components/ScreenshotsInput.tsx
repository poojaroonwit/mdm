'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ScreenshotsInputProps {
  values: string[]
  onChange: (values: string[]) => void
}

export function ScreenshotsInput({ values = [], onChange }: ScreenshotsInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newScreenshots: string[] = []
    let processedCount = 0

    Array.from(files).forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
             toast.error(`Skipped ${file.name}: File too large (max 5MB)`)
             processedCount++
             if (processedCount === files.length) updateValues(newScreenshots)
             return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const result = event.target?.result as string
            newScreenshots.push(result)
            processedCount++
            if (processedCount === files.length) {
                updateValues(newScreenshots)
            }
        }
        reader.readAsDataURL(file)
    })
  }

  const updateValues = (newItems: string[]) => {
      onChange([...values, ...newItems])
      if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeScreenshot = (index: number) => {
      const newValues = [...values]
      newValues.splice(index, 1)
      onChange(newValues)
  }

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {values.map((src, index) => (
                <div key={index} className="relative group aspect-[9/16] bg-muted rounded-md overflow-hidden border">
                    <img src={src} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                        onClick={() => removeScreenshot(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}
            
            <div 
                className="aspect-[9/16] border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <Plus className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Add Screenshot</span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
            </Button>
            <input 
                ref={fileInputRef} 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground ml-2">
                Supported: JPG, PNG, WebP, GIF. Max 5MB each.
            </p>
        </div>
    </div>
  )
}
