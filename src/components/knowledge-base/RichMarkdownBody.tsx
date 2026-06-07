import type { ComponentType, RefObject } from 'react'
import { EditorContent } from '@tiptap/react'

import { cn } from '@/lib/utils'

interface SlashCommand {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
}

interface RichMarkdownBodyProps {
  editor: any
  editable: boolean
  showSlashMenu: boolean
  filteredCommands: SlashCommand[]
  selectedIndex: number
  slashMenuPosition: { top: number; left: number }
  slashMenuRef: RefObject<HTMLDivElement | null>
  insertSlashCommand: (editor: any, commandId: string) => void
  setSelectedIndex: (index: number) => void
}

export function RichMarkdownBody({
  editor,
  editable,
  showSlashMenu,
  filteredCommands,
  selectedIndex,
  slashMenuPosition,
  slashMenuRef,
  insertSlashCommand,
  setSelectedIndex
}: RichMarkdownBodyProps) {
  return (
    <div
      className="relative"
      onClick={() => {
        if (editable && editor) {
          editor.commands.focus()
        }
      }}
    >
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none dark:prose-invert',
          'focus:outline-none',
          editable && 'cursor-text',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:p-6 [&_.ProseMirror]:min-h-[400px]',
          editable && '[&_.ProseMirror]:cursor-text',
          '[&_.ProseMirror_heading]:font-semibold [&_.ProseMirror_heading]:mt-6 [&_.ProseMirror_heading]:mb-4',
          '[&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h3]:text-xl',
          '[&_.ProseMirror_p]:my-4 [&_.ProseMirror_p]:leading-relaxed',
          '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:my-4',
          '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:my-4',
          '[&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:dark:bg-gray-800 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono',
          '[&_.ProseMirror_pre]:bg-gray-100 [&_.ProseMirror_pre]:dark:bg-gray-800 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:my-4',
          '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:dark:border-gray-600 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4',
          '[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4',
          '[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:dark:border-gray-600 [&_.ProseMirror_th]:px-4 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:bg-gray-50 [&_.ProseMirror_th]:dark:bg-gray-800 [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_th]:text-left',
          '[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:dark:border-gray-600 [&_.ProseMirror_td]:px-4 [&_.ProseMirror_td]:py-2',
          '[&_.ProseMirror_placeholder]:text-gray-400 [&_.ProseMirror_placeholder]:dark:text-gray-500',
          '[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-4',
          '[&_.ProseMirror_hr]:border-t [&_.ProseMirror_hr]:border-gray-300 [&_.ProseMirror_hr]:dark:border-gray-600 [&_.ProseMirror_hr]:my-8',
          '[&_.callout]:border-l-4 [&_.callout]:p-4 [&_.callout]:my-4 [&_.callout]:rounded-r-lg',
          '[&_.callout-info]:bg-blue-50 [&_.callout-info]:dark:bg-blue-900/20 [&_.callout-info]:border-blue-500',
          '[&_.callout-warning]:bg-yellow-50 [&_.callout-warning]:dark:bg-yellow-900/20 [&_.callout-warning]:border-yellow-500',
          '[&_.callout-success]:bg-green-50 [&_.callout-success]:dark:bg-green-900/20 [&_.callout-success]:border-green-500',
          '[&_.callout-error]:bg-red-50 [&_.callout-error]:dark:bg-red-900/20 [&_.callout-error]:border-red-500',
          '[&_.ProseMirror_video]:max-w-full [&_.ProseMirror_video]:h-auto [&_.ProseMirror_video]:rounded-lg [&_.ProseMirror_video]:my-4',
          '[&_.ProseMirror_iframe]:max-w-full [&_.ProseMirror_iframe]:rounded-lg [&_.ProseMirror_iframe]:my-4'
        )}
      />

      {showSlashMenu && editable && filteredCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="absolute z-50 max-h-64 min-w-[280px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{
            top: `${slashMenuPosition.top}px`,
            left: `${slashMenuPosition.left}px`
          }}
        >
          {filteredCommands.map((command, index) => {
            const Icon = command.icon
            const isSelected = index === selectedIndex

            return (
              <button
                key={command.id}
                onClick={() => insertSlashCommand(editor, command.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  isSelected
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700'
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  )}
                />
                <span className="text-sm font-medium">{command.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
