import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Table as TableIcon,
  Undo
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichMarkdownToolbarProps {
  editor: any
}

export function RichMarkdownToolbar({ editor }: RichMarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 p-2 dark:bg-gray-800">
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={<Bold className="h-4 w-4" />}
      />
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={<ItalicIcon />}
      />
      <ToolbarDivider />
      <ToolbarButton
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        icon={<Heading1 className="h-4 w-4" />}
      />
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={<Heading2 className="h-4 w-4" />}
      />
      <ToolbarButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={<Heading3 className="h-4 w-4" />}
      />
      <ToolbarDivider />
      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={<List className="h-4 w-4" />}
      />
      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={<ListOrdered className="h-4 w-4" />}
      />
      <ToolbarButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={<Quote className="h-4 w-4" />}
      />
      <ToolbarButton
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        icon={<Code className="h-4 w-4" />}
      />
      <ToolbarDivider />
      <ToolbarButton
        active={editor.isActive('link')}
        onClick={() => {
          const url = window.prompt('Enter URL:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
        icon={<LinkIcon className="h-4 w-4" />}
      />
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter image URL:')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }}
        icon={<ImageIcon className="h-4 w-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        icon={<TableIcon className="h-4 w-4" />}
      />
      <div className="flex-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        icon={<Undo className="h-4 w-4" />}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        icon={<Redo className="h-4 w-4" />}
      />
    </div>
  )
}

function ToolbarButton({
  active,
  disabled,
  icon,
  onClick
}: {
  active?: boolean
  disabled?: boolean
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn('h-8 w-8 p-0', active && 'bg-gray-200 dark:bg-gray-700')}
    >
      {icon}
    </Button>
  )
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
}

function ItalicIcon() {
  return <span className="text-base italic leading-none">I</span>
}
