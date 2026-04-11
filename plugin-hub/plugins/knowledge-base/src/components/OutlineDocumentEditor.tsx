'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Save,
  X,
  Star,
  Share2,
  History,
  MessageSquare,
  Users,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { KnowledgeDocument, KnowledgeCollection } from '../types'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useDocumentPresence } from '../hooks/useDocumentPresence'
import { OutlineCommentsPanel } from './OutlineCommentsPanel'
import { OutlineVersionHistory } from './OutlineVersionHistory'
import { OutlineShareDialog } from './OutlineShareDialog'
import { extractMentionedUsers } from '@/shared/lib/knowledge/mention-parser'

const RichMarkdownEditor = dynamic(
  () => import('@/components/knowledge-base/RichMarkdownEditor').then(mod => mod.RichMarkdownEditor),
  { ssr: false }
)

interface OutlineDocumentEditorProps {
  document: KnowledgeDocument
  collection: KnowledgeCollection
  onUpdate: (id: string, data: Partial<KnowledgeDocument>) => Promise<boolean>
  onClose: () => void
}

export function OutlineDocumentEditor({
  document,
  collection,
  onUpdate,
  onClose,
}: OutlineDocumentEditorProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)
  const [contentHtml, setContentHtml] = useState(document.contentHtml || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isStarred, setIsStarred] = useState(false)
  const [checkingStar, setCheckingStar] = useState(true)

  // Real-time presence
  const { presence, updatePresence } = useDocumentPresence({
    documentId: document.id,
    enabled: true,
  })

  // Check if document is starred
  useEffect(() => {
    const checkStar = async () => {
      try {
        const response = await fetch(`/api/knowledge/documents/${document.id}/star`)
        if (response.ok) {
          const data = await response.json()
          setIsStarred(data.starred)
        }
      } catch (error) {
        console.error('Error checking star:', error)
      } finally {
        setCheckingStar(false)
      }
    }
    checkStar()
  }, [document.id])

  // Process mentions when content changes
  useEffect(() => {
    if (content && content !== document.content) {
      const mentionedUsers = extractMentionedUsers(content)
      if (mentionedUsers.length > 0) {
        // Process mentions in background
        fetch(`/api/knowledge/documents/${document.id}/mentions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }).catch(console.error)
      }
    }
  }, [content, document.content, document.id])

  // Debounce auto-save
  const debouncedContent = useDebounce(content, 2000)
  const debouncedTitle = useDebounce(title, 1000)

  useEffect(() => {
    if (hasChanges && (debouncedContent !== document.content || debouncedTitle !== document.title)) {
      handleAutoSave()
    }
  }, [debouncedContent, debouncedTitle])

  const handleAutoSave = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      await onUpdate(document.id, {
        title: debouncedTitle,
        content: debouncedContent,
        contentHtml,
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [document.id, debouncedTitle, debouncedContent, contentHtml, onUpdate])

  const handleManualSave = async () => {
    setIsSaving(true)
    try {
      const success = await onUpdate(document.id, {
        title,
        content,
        contentHtml,
      })
      if (success) {
        setHasChanges(false)
        toast.success('Document saved')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setHasChanges(true)
              }}
              className="h-8 font-semibold max-w-md"
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false)
                }
              }}
              autoFocus
            />
          ) : (
            <h2
              className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => setIsEditing(true)}
            >
              {title}
            </h2>
          )}
          {isSaving && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Saving...</span>
          )}
          {hasChanges && !isSaving && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch(
                  `/api/knowledge/documents/${document.id}/star`,
                  { method: isStarred ? 'DELETE' : 'POST' }
                )
                if (response.ok) {
                  const data = await response.json()
                  setIsStarred(data.starred)
                  toast.success(data.starred ? 'Document starred' : 'Star removed')
                }
              } catch (error) {
                toast.error('Failed to update star')
              }
            }}
            className={cn(isStarred && 'text-yellow-500')}
          >
            <Star className={cn('h-4 w-4', isStarred && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVersionHistory(true)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={cn(showComments && 'bg-blue-50 dark:bg-blue-900/20')}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleManualSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open(`/api/knowledge/documents/${document.id}/export?format=markdown`, '_blank')
            }}
            title="Export as Markdown"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-auto">
          <div className="h-full max-w-4xl mx-auto px-8 py-8">
            <RichMarkdownEditor
              content={content}
              onChange={(newContent: string) => {
                setContent(newContent)
                // Extract HTML from markdown if needed
                setContentHtml('')
                setHasChanges(true)
              }}
              editable={true}
              className="h-full bg-white text-gray-900"
            />
          </div>
        </div>
        {showComments && (
          <OutlineCommentsPanel
            document={document}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {/* Presence Indicators */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white px-6 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="h-4 w-4" />
          {presence.length > 0 ? (
            <div className="flex items-center gap-2">
              <span>{presence.length} {presence.length === 1 ? 'person' : 'people'} viewing</span>
              <div className="flex -space-x-2">
                {presence.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs text-white"
                    title={p.user?.name}
                  >
                    {p.user?.name?.charAt(0) || 'U'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span>No one else is viewing</span>
          )}
        </div>
      </div>

      {/* Version History Dialog */}
      <OutlineVersionHistory
        document={document}
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestore={async () => {
          // Refetch document after restore
          const updated = await fetch(`/api/knowledge/documents/${document.id}`).then(r => r.json())
          if (updated.document) {
            setTitle(updated.document.title)
            setContent(updated.document.content)
            setContentHtml(updated.document.contentHtml || '')
            setHasChanges(false)
          }
        }}
      />

      {/* Share Dialog */}
      <OutlineShareDialog
        document={document}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  )
}

