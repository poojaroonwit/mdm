'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatTimeAgo } from '@/lib/date-formatters'
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  MoreVertical
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'offline' | 'away'
  lastActive: string
  permissions: {
    canEdit: boolean
    canComment: boolean
    canShare: boolean
    canDelete: boolean
  }
}

interface Comment {
  id: string
  author: Collaborator
  content: string
  timestamp: string
  elementId?: string
  position?: { x: number; y: number }
  resolved: boolean
  replies: Comment[]
}

interface DashboardCollaborationProps {
  dashboardId: string
  currentUser: Collaborator
  onCollaboratorAdd: (email: string, role: string) => void
  onCollaboratorRemove: (collaboratorId: string) => void
  onCollaboratorUpdate: (collaboratorId: string, updates: Partial<Collaborator>) => void
  onCommentAdd: (comment: Omit<Comment, 'id' | 'timestamp'>) => void
  onCommentResolve: (commentId: string) => void
  onCommentReply: (commentId: string, reply: Omit<Comment, 'id' | 'timestamp'>) => void
}

export function DashboardCollaboration({
  dashboardId,
  currentUser,
  onCollaboratorAdd,
  onCollaboratorRemove,
  onCollaboratorUpdate,
  onCommentAdd,
  onCommentResolve,
  onCommentReply
}: DashboardCollaborationProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('')
  const [newCollaboratorRole, setNewCollaboratorRole] = useState('viewer')
  const [newComment, setNewComment] = useState('')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  // Mock data for demonstration
  const mockCollaborators: Collaborator[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      status: 'online',
      lastActive: new Date().toISOString(),
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canDelete: true
      }
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      status: 'online',
      lastActive: new Date(Date.now() - 300000).toISOString(),
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: false,
        canDelete: false
      }
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'viewer',
      status: 'away',
      lastActive: new Date(Date.now() - 1800000).toISOString(),
      permissions: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canDelete: false
      }
    }
  ]

  const mockComments: Comment[] = [
    {
      id: '1',
      author: mockCollaborators[1],
      content: 'This chart looks great! Should we add more data points?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      elementId: 'element-1',
      position: { x: 100, y: 200 },
      resolved: false,
      replies: []
    },
    {
      id: '2',
      author: mockCollaborators[0],
      content: 'Good point! Let me add more data.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      elementId: 'element-1',
      position: { x: 100, y: 200 },
      resolved: true,
      replies: []
    }
  ]

  useEffect(() => {
    loadCollaborators()
    loadComments()
  }, [dashboardId])

  const loadCollaborators = async () => {
    // Simulate API call
    setCollaborators(mockCollaborators)
  }

  const loadComments = async () => {
    // Simulate API call
    setComments(mockComments)
  }

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) {
      toast.error('Email is required')
      return
    }

    try {
      const collaborator: Collaborator = {
        id: Date.now().toString(),
        name: newCollaboratorEmail.split('@')[0],
        email: newCollaboratorEmail,
        role: newCollaboratorRole as any,
        status: 'offline',
        lastActive: new Date().toISOString(),
        permissions: {
          canEdit: newCollaboratorRole === 'editor' || newCollaboratorRole === 'owner',
          canComment: true,
          canShare: newCollaboratorRole === 'owner',
          canDelete: newCollaboratorRole === 'owner'
        }
      }

      setCollaborators(prev => [...prev, collaborator])
      onCollaboratorAdd(newCollaboratorEmail, newCollaboratorRole)
      setNewCollaboratorEmail('')
      setNewCollaboratorRole('viewer')
      toast.success('Collaborator added successfully')
    } catch (error) {
      toast.error('Failed to add collaborator')
    }
  }

  const handleRemoveCollaborator = (collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
    onCollaboratorRemove(collaboratorId)
    toast.success('Collaborator removed')
  }

  const handleUpdateRole = (collaboratorId: string, newRole: string) => {
    setCollaborators(prev => prev.map(c => 
      c.id === collaboratorId 
        ? { 
            ...c, 
            role: newRole as any,
            permissions: {
              canEdit: newRole === 'editor' || newRole === 'owner',
              canComment: true,
              canShare: newRole === 'owner',
              canDelete: newRole === 'owner'
            }
          }
        : c
    ))
    onCollaboratorUpdate(collaboratorId, { role: newRole as any })
    toast.success('Role updated successfully')
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        author: currentUser,
        content: newComment,
        timestamp: new Date().toISOString(),
        elementId: selectedElement || undefined,
        resolved: false,
        replies: []
      }

      setComments(prev => [...prev, comment])
      onCommentAdd(comment)
      setNewComment('')
      toast.success('Comment added successfully')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ))
    onCommentResolve(commentId)
    toast.success('Comment resolved')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-muted'
      default: return 'bg-muted'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Dashboard Collaboration</h2>
        </div>
        <Badge variant="outline" className="text-sm">
          {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="w-full">
      <Tabs defaultValue="collaborators">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Add Collaborator</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email address"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newCollaboratorRole}
                  onChange={(e) => setNewCollaboratorRole(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
                <Button onClick={handleAddCollaborator}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Collaborators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>
                            {collaborator.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{collaborator.name}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Last active: {formatTimeAgo(collaborator.lastActive)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RoleBadge role={collaborator.role} />
                      {currentUser.role === 'owner' && collaborator.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Add Comment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label>Element (optional)</Label>
                  <select
                    value={selectedElement || ''}
                    onChange={(e) => setSelectedElement(e.target.value || null)}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  >
                    <option value="">General comment</option>
                    <option value="element-1">Chart 1</option>
                    <option value="element-2">Chart 2</option>
                    <option value="element-3">KPI Card</option>
                  </select>
                </div>
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddComment}>
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={`p-4 border border-border rounded-lg ${comment.resolved ? 'bg-muted' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback>
                            {comment.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{comment.author.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {comment.resolved ? (
                          <StatusBadge status="resolved">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </StatusBadge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm">{comment.content}</p>
                      {comment.elementId && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          On: {comment.elementId}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
