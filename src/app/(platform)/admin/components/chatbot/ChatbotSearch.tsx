'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface ChatbotSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export function ChatbotSearch({ searchQuery, onSearchChange, placeholder = 'Search chatbots...' }: ChatbotSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}









