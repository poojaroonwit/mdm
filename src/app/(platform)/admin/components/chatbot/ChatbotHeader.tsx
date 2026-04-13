'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Bot } from 'lucide-react'
import { Chatbot } from './types'

// Helper to dynamically load icon
const loadIcon = async (iconName: string) => {
  try {
    const module = await import('lucide-react')
    return (module as any)[iconName] || Bot
  } catch {
    return Bot
  }
}

interface ChatbotHeaderProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatbotHeader({ formData, setFormData }: ChatbotHeaderProps) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any>>(Bot)
  const avatarType = (formData.avatarType || 'icon') as 'icon' | 'image'
  const IconName = (formData.avatarIcon || 'Bot') as string

  useEffect(() => {
    if (avatarType === 'icon') {
      loadIcon(IconName).then(setIconComponent)
    }
  }, [IconName, avatarType])

  return (
    <div className="flex items-start gap-4 py-2">
      {/* Avatar/Icon preview */}
      {avatarType === 'image' && formData.avatarImageUrl ? (
        <img
          src={formData.avatarImageUrl}
          alt={formData.name || 'Avatar'}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: (formData.avatarBackgroundColor || formData.primaryColor || '#1e40af') as string }}
        >
          <IconComponent className="h-6 w-6" style={{ color: (formData.avatarIconColor || '#ffffff') as string }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-foreground truncate" title={formData.name || 'Agent name'}>
          {formData.name || 'Agent name'}
        </h1>
        {formData.description ? (
          <p className="text-sm text-muted-foreground mt-1 truncate">{formData.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1 italic">No description</p>
        )}
      </div>
    </div>
  )
}

