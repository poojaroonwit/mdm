'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send,
  User,
  Clock,
  Bell,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DataAsset } from '../types'

interface Thread {
  id: string
  type: 'task' | 'conversation' | 'announcement'
  message: string
  createdBy: {
    id: string
    name: string
    displayName?: string
    avatar?: string
  }
  createdAt: Date
  updatedAt: Date
  posts: Post[]
  resolved: boolean
  assignedTo?: {
    id: string
    name: string
  }
}

interface Post {
  id: string
  message: string
  createdBy: {
    id: string
    name: string
    displayName?: string
    avatar?: string
  }
  createdAt: Date
}

interface CollaborationProps {
  asset: DataAsset | null
  config: any
}

export function Collaboration({ asset, config }: CollaborationProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (asset && config?.isEnabled) {
      loadThreads()
    }
  }, [asset, config])

  const loadThreads = async () => {
    if (!asset) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/data-governance/feed/${asset.fullyQualifiedName}`)
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Error loading threads:', error)
      toast.error('Failed to load activity feed')
    } finally {
      setIsLoading(false)
    }
  }

  const createThread = async () => {
    if (!asset || !newMessage.trim()) return

    try {
      const response = await fetch(`/api/admin/data-governance/feed/${asset.fullyQualifiedName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          type: 'conversation'
        })
      })

      if (response.ok) {
        toast.success('Thread created')
        setNewMessage('')
        loadThreads()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create thread')
      }
    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('Failed to create thread')
    }
  }

  const postReply = async (threadId: string) => {
    if (!asset || !newMessage.trim()) return

    try {
      const response = await fetch(
        `/api/admin/data-governance/feed/${asset.fullyQualifiedName}/${threadId}/posts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage })
        }
      )

      if (response.ok) {
        toast.success('Reply posted')
        setNewMessage('')
        loadThreads()
        if (selectedThread?.id === threadId) {
          setSelectedThread(null)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    }
  }

  if (!asset) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Select an asset to view collaboration threads</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Activity Feed & Collaboration
          </CardTitle>
          <CardDescription>
            Discuss and collaborate on {asset.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Start a conversation or ask a question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <Button onClick={createThread} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {threads.map((thread) => (
                <Card
                  key={thread.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    selectedThread?.id === thread.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={thread.createdBy.avatar} />
                          <AvatarFallback>
                            {thread.createdBy.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{thread.createdBy.displayName || thread.createdBy.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(thread.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={thread.type === 'task' ? 'default' : 'secondary'}>
                        {thread.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{thread.message}</p>
                    {thread.posts.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {thread.posts.length} {thread.posts.length === 1 ? 'reply' : 'replies'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {threads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity yet. Start a conversation!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedThread && (
        <Card>
          <CardHeader>
            <CardTitle>Thread Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedThread.createdBy.avatar} />
                    <AvatarFallback>
                      {selectedThread.createdBy.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">
                    {selectedThread.createdBy.displayName || selectedThread.createdBy.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedThread.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{selectedThread.message}</p>
              </div>

              {selectedThread.posts.map((post) => (
                <div key={post.id} className="p-4 bg-muted rounded-lg ml-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.createdBy.avatar} />
                      <AvatarFallback>
                        {post.createdBy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      {post.createdBy.displayName || post.createdBy.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{post.message}</p>
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <Textarea
                  placeholder="Write a reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={() => postReply(selectedThread.id)} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

