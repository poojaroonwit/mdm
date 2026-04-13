'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Edit,
  Trash2,
  Eye,
  Globe,
  MessageSquare,
  Copy,
  Download,
  MoreVertical,
  FolderPlus,
  Folder,
  FolderOpen,
  Pencil,
} from 'lucide-react'
import { Chatbot, ChatbotFolder } from './types'
import { ChatbotAvatar } from './ChatbotAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChatbotListProps {
  chatbots: Chatbot[]
  folders?: ChatbotFolder[]
  viewMode: 'table' | 'card' | 'list'
  onEdit: (chatbot: Chatbot) => void
  onDelete: (id: string) => void
  onPublish: (chatbot: Chatbot) => void
  onPreview: (chatbot: Chatbot) => void
  onViewVersions: (chatbot: Chatbot) => void
  onDuplicate?: (chatbot: Chatbot) => void
  onExport?: (chatbot: Chatbot) => void
  onCreateFolder?: () => void
  onRenameFolder?: (folder: ChatbotFolder) => void
  onDeleteFolder?: (folder: ChatbotFolder) => void
  onMoveChatbot?: (chatbotId: string, folderId: string | null) => void
}

type DragState =
  | { type: 'chatbot'; id: string }
  | null

function ChatbotActions({
  chatbot,
  onEdit,
  onDelete,
  onPublish,
  onPreview,
  onViewVersions,
  onDuplicate,
  onExport,
}: {
  chatbot: Chatbot
  onEdit: (chatbot: Chatbot) => void
  onDelete: (id: string) => void
  onPublish: (chatbot: Chatbot) => void
  onPreview: (chatbot: Chatbot) => void
  onViewVersions: (chatbot: Chatbot) => void
  onDuplicate?: (chatbot: Chatbot) => void
  onExport?: (chatbot: Chatbot) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onPreview(chatbot)
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onEdit(chatbot)
        }}
      >
        <Edit className="h-4 w-4" />
      </Button>

      {(onDuplicate || onExport) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDuplicate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(chatbot)
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            {onExport && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onExport(chatbot)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(chatbot.id)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}


export function ChatbotListSkeleton({ viewMode, count = 3 }: { viewMode: 'table' | 'card' | 'list'; count?: number }) {
  if (viewMode === 'table') {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: count }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Skeleton className="h-8 w-8 rounded-md" />
                       <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <Skeleton className="h-4 w-12" />
              <div className="mt-auto flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-4">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-8 w-8 rounded-md" />
               <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ChatbotList({
  chatbots,
  folders = [],
  viewMode,
  onEdit,
  onDelete,
  onPublish,
  onPreview,
  onViewVersions,
  onDuplicate,
  onExport,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveChatbot,
}: ChatbotListProps) {
  const [dragState, setDragState] = useState<DragState>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.name.localeCompare(b.name)),
    [folders]
  )

  const rootChatbots = useMemo(
    () => chatbots.filter((chatbot) => !chatbot.folder_id),
    [chatbots]
  )

  const groupedChatbots = useMemo(() => {
    return sortedFolders.map((folder) => ({
      folder,
      chatbots: chatbots.filter((chatbot) => chatbot.folder_id === folder.id),
    }))
  }, [chatbots, sortedFolders])

  const hasFolderFeatures =
    !!onCreateFolder || !!onRenameFolder || !!onDeleteFolder || !!onMoveChatbot

  const handleDragStart = (chatbot: Chatbot) => {
    setDragState({ type: 'chatbot', id: chatbot.id })
  }

  const handleDrop = (folderId: string | null) => {
    if (dragState?.type === 'chatbot' && onMoveChatbot) {
      onMoveChatbot(dragState.id, folderId)
    }

    setDragState(null)
    setDropTarget(null)
  }

  const renderChatbotRow = (chatbot: Chatbot) => (
    <TableRow
      key={chatbot.id}
      className="cursor-pointer"
      draggable={!!onMoveChatbot}
      onDragStart={() => handleDragStart(chatbot)}
      onDragEnd={() => {
        setDragState(null)
        setDropTarget(null)
      }}
      onClick={() => onEdit(chatbot)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <ChatbotAvatar chatbot={chatbot} size="md" />
          <div className="flex flex-col">
            <span className="font-medium">{chatbot.name}</span>
            {chatbot.description && (
              <span className="text-xs text-muted-foreground mt-0.5">{chatbot.description}</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{chatbot.website || '-'}</TableCell>
      <TableCell>v{chatbot.currentVersion}</TableCell>
      <TableCell>
        {chatbot.isPublished ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            Published
          </Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <ChatbotActions
          chatbot={chatbot}
          onEdit={onEdit}
          onDelete={onDelete}
          onPublish={onPublish}
          onPreview={onPreview}
          onViewVersions={onViewVersions}
          onDuplicate={onDuplicate}
          onExport={onExport}
        />
      </TableCell>
    </TableRow>
  )

  const renderChatbotCard = (chatbot: Chatbot) => (
    <Card
      key={chatbot.id}
      className="relative cursor-pointer h-full flex flex-col"
      role="button"
      tabIndex={0}
      draggable={!!onMoveChatbot}
      onDragStart={() => handleDragStart(chatbot)}
      onDragEnd={() => {
        setDragState(null)
        setDropTarget(null)
      }}
      onClick={() => onEdit(chatbot)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit(chatbot)
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <ChatbotAvatar chatbot={chatbot} size="lg" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{chatbot.name}</CardTitle>
              {chatbot.description && (
                <p className="text-xs text-muted-foreground mt-1">{chatbot.description}</p>
              )}
              {chatbot.website && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span className="truncate">{chatbot.website}</span>
                </div>
              )}
            </div>
          </div>
          {chatbot.isPublished ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
              Published
            </Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">v{chatbot.currentVersion}</div>
        <div className="mt-auto">
          <ChatbotActions
            chatbot={chatbot}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onPreview={onPreview}
            onViewVersions={onViewVersions}
            onDuplicate={onDuplicate}
            onExport={onExport}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderChatbotListItem = (chatbot: Chatbot) => (
    <Card
      key={chatbot.id}
      className="relative cursor-pointer hover:bg-muted/50"
      role="button"
      tabIndex={0}
      draggable={!!onMoveChatbot}
      onDragStart={() => handleDragStart(chatbot)}
      onDragEnd={() => {
        setDragState(null)
        setDropTarget(null)
      }}
      onClick={() => onEdit(chatbot)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit(chatbot)
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <ChatbotAvatar chatbot={chatbot} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{chatbot.name}</CardTitle>
                {chatbot.isPublished ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              {chatbot.description && (
                <p className="text-xs text-gray-500 mt-1">{chatbot.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {chatbot.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>{chatbot.website}</span>
                  </div>
                )}
                <span>v{chatbot.currentVersion}</span>
              </div>
            </div>
          </div>
          <ChatbotActions
            chatbot={chatbot}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onPreview={onPreview}
            onViewVersions={onViewVersions}
            onDuplicate={onDuplicate}
            onExport={onExport}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderChatbots = (items: Chatbot[]) => {
    if (items.length === 0) {
      return (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No chatbots in this section.
        </div>
      )
    }

    if (viewMode === 'table') {
      return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{items.map(renderChatbotRow)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )
    }

    if (viewMode === 'card') {
      return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(renderChatbotCard)}</div>
    }

    return <div className="space-y-2">{items.map(renderChatbotListItem)}</div>
  }

  if (chatbots.length === 0 && sortedFolders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No chatbots found. Create your first chatbot to get started.</p>
          {onCreateFolder && (
            <Button variant="outline" className="mt-4" onClick={onCreateFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
   

      <div
        className={cn(
          'space-y-4 rounded-2xl border border-dashed p-4',
          dropTarget === '__root__' && 'border-primary bg-primary/5'
        )}
        onDragOver={(e) => {
          if (!onMoveChatbot || !dragState) return
          e.preventDefault()
          setDropTarget('__root__')
        }}
        onDragLeave={() => {
          if (dropTarget === '__root__') setDropTarget(null)
        }}
        onDrop={(e) => {
          if (!onMoveChatbot || !dragState) return
          e.preventDefault()
          handleDrop(null)
        }}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Ungrouped Chatbots</h3>
          <Badge variant="secondary">{rootChatbots.length}</Badge>
        </div>
        {renderChatbots(rootChatbots)}
      </div>

      {groupedChatbots.map(({ folder, chatbots: folderChatbots }) => (
        <div
          key={folder.id}
          className={cn(
            'space-y-4 rounded-2xl border p-4 transition-colors',
            dropTarget === folder.id && 'border-primary bg-primary/5'
          )}
          onDragOver={(e) => {
            if (!onMoveChatbot || !dragState) return
            e.preventDefault()
            setDropTarget(folder.id)
          }}
          onDragLeave={() => {
            if (dropTarget === folder.id) setDropTarget(null)
          }}
          onDrop={(e) => {
            if (!onMoveChatbot || !dragState) return
            e.preventDefault()
            handleDrop(folder.id)
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{folder.name}</h3>
                <CardDescription>{folderChatbots.length} chatbot{folderChatbots.length === 1 ? '' : 's'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRenameFolder && (
                <Button variant="outline" size="sm" onClick={() => onRenameFolder(folder)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </Button>
              )}
              {onDeleteFolder && (
                <Button variant="destructive" size="sm" onClick={() => onDeleteFolder(folder)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          {renderChatbots(folderChatbots)}
        </div>
      ))}
    </div>
  )
}
