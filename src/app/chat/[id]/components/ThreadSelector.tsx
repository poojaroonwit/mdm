'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Edit2, X, Check, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import { formatTimeAgo } from '@/lib/date-formatters'
import { AgentThread } from '../hooks/useAgentThread'
import { ChatbotConfig } from '../types'

interface ThreadSelectorProps {
  threads: AgentThread[]
  currentThreadId: string | null
  onSelectThread: (threadId: string) => void
  onNewThread: () => void
  onDeleteThread: (threadId: string) => void
  onUpdateThreadTitle: (threadId: string, title: string) => Promise<boolean>
  isLoading?: boolean
  chatbot?: ChatbotConfig
}

export function ThreadSelector({
  threads,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onUpdateThreadTitle,
  isLoading = false,
  chatbot,
}: ThreadSelectorProps) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Render header avatar for each thread item
  const renderHeaderAvatar = () => {
    if (!chatbot) return null

    // Use header avatar config, fallback to message avatar config for backward compatibility
    const headerAvatarType = chatbot.headerAvatarType || chatbot.avatarType || 'icon'
    if (headerAvatarType === 'image' && (chatbot.headerLogo || chatbot.headerAvatarImageUrl)) {
      const imageSrc = chatbot.headerLogo || chatbot.headerAvatarImageUrl
      if (!imageSrc) return null
      return (
        <img
          src={imageSrc}
          alt={chatbot.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )
    } else if (headerAvatarType === 'icon') {
      const IconName = chatbot.headerAvatarIcon || chatbot.avatarIcon || 'Bot'
      const IconComponent = (Icons as any)[IconName] || Bot
      const iconColor = chatbot.headerAvatarIconColor || chatbot.avatarIconColor || '#ffffff'
      const bgColor = chatbot.headerAvatarBackgroundColor || chatbot.avatarBackgroundColor || chatbot.primaryColor || '#1e40af'
      return (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
        </div>
      )
    }
    return null
  }

  const handleStartEdit = (thread: AgentThread) => {
    setEditingThreadId(thread.threadId)
    setEditingTitle(thread.title || '')
  }

  const handleSaveEdit = async (threadId: string) => {
    if (editingTitle.trim()) {
      const success = await onUpdateThreadTitle(threadId, editingTitle.trim())
      if (success) {
        setEditingThreadId(null)
        setEditingTitle('')
      }
    } else {
      setEditingThreadId(null)
      setEditingTitle('')
    }
  }

  const handleCancelEdit = () => {
    setEditingThreadId(null)
    setEditingTitle('')
  }

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Conversations</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewThread}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations yet. Start a new one!
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.threadId}
                className={`group relative p-2 rounded-lg cursor-pointer transition-colors ${currentThreadId === thread.threadId
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-muted'
                  }`}
                onClick={() => onSelectThread(thread.threadId)}
              >
                {editingThreadId === thread.threadId ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-7 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(thread.threadId)
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleSaveEdit(thread.threadId)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      {renderHeaderAvatar()}
                      <div className="flex items-start justify-between flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {thread.title || 'New Conversation'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {chatbot?.engineType && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  {chatbot.engineType === 'openai-agent-sdk' ? 'Agent SDK' :
                                    chatbot.engineType === 'chatkit' ? 'ChatKit' :
                                      chatbot.engineType === 'dify' ? 'Dify' :
                                        chatbot.engineType === 'openai' ? 'OpenAI' :
                                          chatbot.engineType === 'custom' ? 'Custom' :
                                            chatbot.engineType}
                                </span>
                              )}
                              {chatbot?.engineType === 'openai-agent-sdk' && (chatbot as any).openaiAgentSdkWorkflowFile && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                  {(chatbot as any).openaiAgentSdkWorkflowFile}
                                </span>
                              )}
                            </div>
                            <div>
                              {thread.lastMessageAt ? formatTimeAgo(thread.lastMessageAt) : 'No messages'}
                              {thread.messageCount > 0 && ` • ${thread.messageCount} messages`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {((chatbot as any).enableConversationRenaming !== false) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEdit(thread)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Delete this conversation?')) {
                                onDeleteThread(thread.threadId)
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

