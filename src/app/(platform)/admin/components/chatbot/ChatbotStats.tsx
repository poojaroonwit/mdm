'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Chatbot } from './types'
import { MessageSquare, Rocket, FileText } from 'lucide-react'

interface ChatbotStatsProps {
  chatbots: Chatbot[]
}

export function ChatbotStats({ chatbots }: ChatbotStatsProps) {
  const total = chatbots.length
  const published = chatbots.filter(c => c.isPublished).length
  const draft = chatbots.filter(c => !c.isPublished).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Chatbots</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{published}</p>
            </div>
            <Rocket className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">{draft}</p>
            </div>
            <FileText className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}









