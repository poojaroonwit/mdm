'use client'

import { useState, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Code,
  FileText,
  FileCode,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotebookCell, CellType } from './DeepNoteLayout'
import { CellOutput } from './CellOutput'

interface JupyterCellProps {
  cell: NotebookCell
  index: number
  isActive: boolean
  isSelected: boolean
  onExecute: (cellId: string) => void
  onDelete: (cellId: string) => void
  onMove: (cellId: string, direction: 'up' | 'down') => void
  onContentChange: (cellId: string, content: string) => void
  onTypeChange: (cellId: string, type: CellType) => void
  onFocus: (cellId: string) => void
  onSelect: (cellId: string, selected: boolean) => void
}

export function JupyterCell({
  cell,
  index,
  isActive,
  isSelected,
  onExecute,
  onDelete,
  onMove,
  onContentChange,
  onTypeChange,
  onFocus,
  onSelect
}: JupyterCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showOutput, setShowOutput] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getCellIcon = (type: CellType) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />
      case 'markdown': return <FileText className="h-4 w-4" />
      case 'raw': return <FileCode className="h-4 w-4" />
      default: return <FileCode className="h-4 w-4" />
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onExecute(cell.id)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const renderCodeCell = () => (
    <div className="space-y-0">
      {/* Input Area */}
      <div className="relative">
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-600">In [{index + 1}]:</span>
            {cell.status !== 'idle' && getStatusIcon(cell.status)}
            {cell.executionTime && (
              <span className="text-xs text-gray-500">
                {cell.executionTime}ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onExecute(cell.id)}
              disabled={cell.status === 'running'}
              className="h-6 w-6 p-0 hover:bg-blue-100"
            >
              <Play className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMove(cell.id, 'up')}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMove(cell.id, 'down')}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(cell.id)}
              className="h-6 w-6 p-0 hover:bg-red-100 text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={cell.content}
          onChange={(e) => onContentChange(cell.id, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus(cell.id)}
          className="w-full min-h-[120px] p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
          placeholder="Write your code here..."
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* Output Area */}
      {cell.output && showOutput && (
        <CellOutput
          output={cell.output}
          executionCount={index + 1}
          className="bg-white dark:bg-gray-900"
        />
      )}

      {cell.output && !showOutput && (
        <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowOutput(true)}
            className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Eye className="h-3 w-3 mr-1" />
            Show Output
          </Button>
        </div>
      )}
    </div>
  )

  const renderMarkdownCell = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-600">Markdown:</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(cell.id, 'up')}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(cell.id, 'down')}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(cell.id)}
            className="h-6 w-6 p-0 hover:bg-red-100 text-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={cell.content}
          onChange={(e) => onContentChange(cell.id, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus(cell.id)}
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write your markdown here..."
        />

        {cell.content && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
            <div className="prose max-w-none text-sm">
              <div dangerouslySetInnerHTML={{
                __html: typeof window !== 'undefined'
                  ? DOMPurify.sanitize(cell.content
                    .replace(/\n/g, '<br>')
                    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-2">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto"><code>$1</code></pre>'))
                  : cell.content
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderRawCell = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-600">Raw:</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(cell.id, 'up')}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(cell.id, 'down')}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(cell.id)}
            className="h-6 w-6 p-0 hover:bg-red-100 text-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={cell.content}
          onChange={(e) => onContentChange(cell.id, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus(cell.id)}
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Raw text content..."
        />
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        "group relative border-l-4 transition-all duration-200 hover:shadow-lg",
        isActive ? "border-blue-500 bg-blue-50/30" : "border-transparent",
        isSelected ? "bg-blue-100/50" : "",
        cell.status === 'running' ? "bg-yellow-50" : "",
        cell.status === 'error' ? "bg-red-50" : ""
      )}
      onClick={() => onFocus(cell.id)}
    >
      {/* Cell Type Selector */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-gray-400 transition-colors" />

      {/* Cell Content */}
      {cell.type === 'code' && renderCodeCell()}
      {cell.type === 'markdown' && renderMarkdownCell()}
      {cell.type === 'raw' && renderRawCell()}
    </div>
  )
}
