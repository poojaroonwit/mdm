'use client'

import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Undo,
  Redo,
  Minus,
  CheckSquare,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Strikethrough,
  Underline,
  Highlighter,
  FileText,
  Video,
  Youtube,
  FileCode,
  Calendar,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichMarkdownBody } from './RichMarkdownBody'
import { RichMarkdownToolbar } from './RichMarkdownToolbar'

interface RichMarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  showToolbar?: boolean
}

export function RichMarkdownEditor({
  content,
  onChange,
  placeholder = 'Start typing "/" for commands...',
  editable = true,
  className,
  showToolbar = false
}: RichMarkdownEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const slashMenuRef = useRef<HTMLDivElement>(null)
  const slashStartPos = useRef<number | null>(null)
  const editorRef = useRef<any>(null)
  const showSlashMenuRef = useRef(false)

  // Define slash commands first - organized by category
  const slashCommands = [
    // Text Formatting
    { id: 'heading1', label: 'Heading 1', icon: Heading1, keywords: ['h1', 'heading', 'title', 'large'] },
    { id: 'heading2', label: 'Heading 2', icon: Heading2, keywords: ['h2', 'heading', 'subtitle', 'medium'] },
    { id: 'heading3', label: 'Heading 3', icon: Heading3, keywords: ['h3', 'heading', 'small'] },
    { id: 'bold', label: 'Bold', icon: Bold, keywords: ['bold', 'strong', 'b'] },
    { id: 'italic', label: 'Italic', icon: Italic, keywords: ['italic', 'emphasis', 'i'] },
    { id: 'strikethrough', label: 'Strikethrough', icon: Strikethrough, keywords: ['strike', 'strikethrough', 'delete', 'del'] },
    { id: 'underline', label: 'Underline', icon: Underline, keywords: ['underline', 'u'] },
    
    // Lists
    { id: 'bulletList', label: 'Bullet List', icon: List, keywords: ['list', 'bullet', 'ul', 'unordered'] },
    { id: 'orderedList', label: 'Numbered List', icon: ListOrdered, keywords: ['numbered', 'ordered', 'ol', 'number'] },
    { id: 'todoList', label: 'Todo List', icon: CheckSquare, keywords: ['todo', 'task', 'checkbox', 'checklist', 'todo list'] },
    
    // Blocks
    { id: 'code', label: 'Code Block', icon: Code, keywords: ['code', 'snippet', 'pre', 'codeblock'] },
    { id: 'blockquote', label: 'Quote', icon: Quote, keywords: ['quote', 'blockquote', 'citation'] },
    { id: 'divider', label: 'Divider', icon: Minus, keywords: ['divider', 'separator', 'hr', 'horizontal', 'line', 'rule'] },
    
    // Media
    { id: 'link', label: 'Link', icon: LinkIcon, keywords: ['link', 'url', 'hyperlink', 'anchor'] },
    { id: 'image', label: 'Image', icon: ImageIcon, keywords: ['image', 'img', 'picture', 'photo'] },
    { id: 'video', label: 'Video', icon: Video, keywords: ['video', 'movie', 'mp4'] },
    { id: 'youtube', label: 'YouTube', icon: Youtube, keywords: ['youtube', 'yt', 'video embed'] },
    
    // Structure
    { id: 'table', label: 'Table', icon: TableIcon, keywords: ['table', 'grid', 'spreadsheet'] },
    { id: 'file', label: 'File', icon: FileText, keywords: ['file', 'document', 'attachment'] },
    
    // Callouts / Alerts
    { id: 'callout-info', label: 'Info Callout', icon: Info, keywords: ['info', 'information', 'callout', 'note', 'tip'] },
    { id: 'callout-warning', label: 'Warning Callout', icon: AlertTriangle, keywords: ['warning', 'alert', 'caution', 'callout'] },
    { id: 'callout-success', label: 'Success Callout', icon: CheckCircle2, keywords: ['success', 'check', 'done', 'callout', 'complete'] },
    { id: 'callout-error', label: 'Error Callout', icon: XCircle, keywords: ['error', 'danger', 'fail', 'callout', 'wrong'] },
    
    // Alignment
    { id: 'align-left', label: 'Align Left', icon: AlignLeft, keywords: ['left', 'align', 'alignment'] },
    { id: 'align-center', label: 'Align Center', icon: AlignCenter, keywords: ['center', 'centre', 'align', 'alignment'] },
    { id: 'align-right', label: 'Align Right', icon: AlignRight, keywords: ['right', 'align', 'alignment'] },
  ]

  const filteredCommands = slashCommands.filter(cmd => {
    if (!slashQuery) return true
    const query = slashQuery.toLowerCase()
    return (
      cmd.keywords.some(kw => kw.includes(query)) ||
      cmd.label.toLowerCase().includes(query) ||
      cmd.id.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update slash menu position
  const updateSlashMenuPosition = useCallback((editor: any) => {
    if (!editor) return
    
    const { state } = editor
    const { selection } = state
    const { $from } = selection
    
    // Get the editor DOM element
    const editorElement = editor.view.dom
    if (!editorElement) return

    // Get cursor position
    const coords = editor.view.coordsAtPos($from.pos)
    const editorRect = editorElement.getBoundingClientRect()
    const scrollTop = editorElement.scrollTop || 0

    setSlashMenuPosition({
      top: coords.top - editorRect.top + scrollTop + 20,
      left: coords.left - editorRect.left,
    })
  }, [])

  // Insert slash command
  const insertSlashCommand = useCallback((editor: any, commandId: string) => {
    if (!editor || slashStartPos.current === null) return

    const { state } = editor
    const { selection } = state
    const { $from } = selection
    const currentPos = $from.pos
    
    // Delete the slash command text
    editor.chain()
      .focus()
      .deleteRange({ from: slashStartPos.current, to: currentPos })
      .run()

    // Insert the command content
    const command = slashCommands.find(cmd => cmd.id === commandId)
    if (!command) return

    switch (commandId) {
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        break
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'code':
        editor.chain().focus().toggleCodeBlock().run()
        break
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run()
        break
      case 'link':
        const url = window.prompt('Enter URL:')
        if (url) {
          editor.chain().focus().setLink({ href: url }).run()
        }
        break
      case 'image':
        const imageUrl = window.prompt('Enter image URL:')
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl }).run()
        }
        break
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        break
      case 'divider':
        editor.chain().focus().setHorizontalRule().run()
        break
      case 'todoList':
        editor.chain().focus().insertContent('<ul data-type="taskList"><li data-checked="false"><p></p></li></ul>').run()
        break
      case 'strikethrough':
        editor.chain().focus().toggleStrike().run()
        break
      case 'underline':
        // TipTap doesn't have underline by default, so we'll use a span with underline style
        editor.chain().focus().insertContent('<span style="text-decoration: underline;"></span>').run()
        break
      case 'video':
        const videoUrl = window.prompt('Enter video URL:')
        if (videoUrl) {
          editor.chain().focus().insertContent(`<video src="${videoUrl}" controls></video>`).run()
        }
        break
      case 'youtube':
        const ytUrl = window.prompt('Enter YouTube URL or video ID:')
        if (ytUrl) {
          // Extract video ID from URL or use as-is
          const videoId = ytUrl.includes('youtube.com') 
            ? ytUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || ytUrl
            : ytUrl
          editor.chain().focus().insertContent(
            `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
          ).run()
        }
        break
      case 'file':
        const fileUrl = window.prompt('Enter file URL:')
        if (fileUrl) {
          const fileName = fileUrl.split('/').pop() || 'File'
          editor.chain().focus().insertContent(`<a href="${fileUrl}" download>${fileName}</a>`).run()
        }
        break
      case 'callout-info':
        editor.chain().focus().insertContent(
          '<div class="callout callout-info"><p><strong>ℹ️ Info:</strong> </p></div>'
        ).run()
        break
      case 'callout-warning':
        editor.chain().focus().insertContent(
          '<div class="callout callout-warning"><p><strong>⚠️ Warning:</strong> </p></div>'
        ).run()
        break
      case 'callout-success':
        editor.chain().focus().insertContent(
          '<div class="callout callout-success"><p><strong>✅ Success:</strong> </p></div>'
        ).run()
        break
      case 'callout-error':
        editor.chain().focus().insertContent(
          '<div class="callout callout-error"><p><strong>❌ Error:</strong> </p></div>'
        ).run()
        break
      case 'align-left':
        editor.chain().focus().insertContent('<div style="text-align: left;"></div>').run()
        break
      case 'align-center':
        editor.chain().focus().insertContent('<div style="text-align: center;"></div>').run()
        break
      case 'align-right':
        editor.chain().focus().insertContent('<div style="text-align: right;"></div>').run()
        break
    }
    
    showSlashMenuRef.current = false
    setShowSlashMenu(false)
    setSlashQuery('')
    setSelectedIndex(0)
    slashStartPos.current = null
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (!editable) return false

        const editor = editorRef.current
        if (!editor) return false

        const { state } = view
        const { selection } = state
        const { $from } = selection
        const textBefore = $from.nodeBefore?.textContent || ''
        const currentText = $from.parent.textContent
        const pos = $from.pos

        // Check if we're in a slash command context
        const slashMatch = currentText.substring(0, pos - $from.parentOffset).match(/\/([a-z]*)$/i)
        
        // Get current filtered commands
        const currentQuery = slashMatch ? slashMatch[1].toLowerCase() : slashQuery
        const currentFiltered = slashCommands.filter(cmd => {
          if (!currentQuery) return true
          const query = currentQuery.toLowerCase()
          return (
            cmd.keywords.some(kw => kw.includes(query)) ||
            cmd.label.toLowerCase().includes(query) ||
            cmd.id.toLowerCase().includes(query)
          )
        })
        
        if (event.key === '/') {
          // Check if we're at the start of a line or after a space
          const isAtLineStart = $from.parentOffset === 0 || textBefore.endsWith(' ')
          if (isAtLineStart) {
            slashStartPos.current = pos
            showSlashMenuRef.current = true
            setShowSlashMenu(true)
            setSlashQuery('')
            setSelectedIndex(0)
            setTimeout(() => updateSlashMenuPosition(editor), 0)
            return true
          }
        }

        if (showSlashMenuRef.current || showSlashMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex(prev => 
              prev < currentFiltered.length - 1 ? prev + 1 : prev
            )
            return true
          }
          
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
            return true
          }
          
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault()
            if (currentFiltered[selectedIndex]) {
              insertSlashCommand(editor, currentFiltered[selectedIndex].id)
            }
            return true
          }
          
          if (event.key === 'Escape') {
            event.preventDefault()
            showSlashMenuRef.current = false
            setShowSlashMenu(false)
            if (slashStartPos.current !== null) {
              editor.chain()
                .focus()
                .deleteRange({ from: slashStartPos.current, to: pos })
                .run()
            }
            slashStartPos.current = null
            return true
          }

          // Update query if typing
          if (slashMatch) {
            const query = slashMatch[1].toLowerCase()
            setSlashQuery(query)
            setSelectedIndex(0)
            setTimeout(() => updateSlashMenuPosition(editor), 0)
          } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== '/') {
            // If we type something that's not a slash, close the menu
            showSlashMenuRef.current = false
            setShowSlashMenu(false)
            slashStartPos.current = null
          }
        }

        return false
      },
    },
  })

  useEffect(() => {
    if (editor) {
      editorRef.current = editor
      if (content !== editor.getHTML()) {
        editor.commands.setContent(content, { emitUpdate: false })
      }
      // Update editable state
      editor.setEditable(editable)
    }
  }, [content, editor, editable])

  // Monitor editor updates to track slash commands
  useEffect(() => {
    if (!editor || !editable) return

    const handleUpdate = () => {
      const { state } = editor
      const { selection } = state
      const { $from } = selection
      const pos = $from.pos
      const currentText = $from.parent.textContent
      
      // Check if we have a slash command
      const textBeforeCursor = currentText.substring(0, pos - $from.parentOffset)
      const slashMatch = textBeforeCursor.match(/\/([a-z]*)$/i)
      
      if (slashMatch && slashStartPos.current !== null) {
        const query = slashMatch[1].toLowerCase()
        setSlashQuery(query)
        showSlashMenuRef.current = true
        setShowSlashMenu(true)
        updateSlashMenuPosition(editor)
      } else if (slashStartPos.current !== null && !slashMatch) {
        // Slash command was deleted or completed
        showSlashMenuRef.current = false
        setShowSlashMenu(false)
        slashStartPos.current = null
      }
    }

    editor.on('update', handleUpdate)
    editor.on('selectionUpdate', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor, editable, updateSlashMenuPosition])

  // Auto-focus editor when it becomes editable
  const prevEditableRef = useRef(editable)
  useEffect(() => {
    if (editor && editable && mounted && !prevEditableRef.current) {
      // Only focus when transitioning from non-editable to editable
      setTimeout(() => {
        editor.commands.focus('end')
      }, 100)
    }
    prevEditableRef.current = editable
  }, [editor, editable, mounted])


  if (!mounted || !editor) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      {editable && showToolbar && <RichMarkdownToolbar editor={editor} />}

      <RichMarkdownBody
        editor={editor}
        editable={editable}
        showSlashMenu={showSlashMenu}
        filteredCommands={filteredCommands}
        selectedIndex={selectedIndex}
        slashMenuPosition={slashMenuPosition}
        slashMenuRef={slashMenuRef}
        insertSlashCommand={insertSlashCommand}
        setSelectedIndex={setSelectedIndex}
      />
    </div>
  )
}


