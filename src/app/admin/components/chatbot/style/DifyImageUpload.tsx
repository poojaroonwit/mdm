'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DifyImageUploadProps {
  value?: string
  onChange: (value: string) => void
}

export function DifyImageUpload({ value, onChange }: DifyImageUploadProps) {
  return (
    <div className="space-y-2">
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.png"
      />
      {value && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted/50 flex items-center justify-center">
            <img 
                src={value} 
                alt="Preview" 
                className="max-full max-h-full object-contain"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                }}
            />
        </div>
      )}
    </div>
  )
}
