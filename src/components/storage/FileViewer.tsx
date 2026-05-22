'use client'

import { useState, useEffect } from 'react'
import { CodeEditor } from '@/components/ui/code-editor'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import DOMPurify from 'dompurify'

interface FileViewerProps {
  fileId: string
  fileName: string
  mimeType: string
  publicUrl?: string
}

export function FileViewer({ fileId, fileName, mimeType, publicUrl }: FileViewerProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<string[][]>([])

  useEffect(() => {
    loadFileContent()
  }, [fileId])

  const loadFileContent = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check file type and load accordingly
      if (mimeType?.startsWith('image/')) {
        // Images are loaded via URL, no content fetch needed
        setLoading(false)
        return
      }

      if (mimeType === 'application/pdf') {
        // PDFs are loaded via iframe, no content fetch needed
        setLoading(false)
        return
      }

      // Fetch file content for text-based files
      const response = await fetch(`/api/admin/storage/files/${fileId}/content`)

      if (!response.ok) {
        throw new Error('Failed to load file content')
      }

      const data = await response.json()

      if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
        // Parse CSV
        const lines = data.content.split('\n').filter((line: string) => line.trim())
        const parsed = lines.map((line: string) => {
          // Simple CSV parsing (handle quoted values)
          const result: string[] = []
          let current = ''
          let inQuotes = false

          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        })
        setCsvData(parsed)
      } else {
        setContent(data.content)
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load file')
      setLoading(false)
    }
  }

  const getLanguageFromMimeType = (mimeType: string, fileName: string): string => {
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript'
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript'
    if (fileName.endsWith('.py')) return 'python'
    if (fileName.endsWith('.java')) return 'java'
    if (fileName.endsWith('.cpp') || fileName.endsWith('.cc') || fileName.endsWith('.cxx')) return 'cpp'
    if (fileName.endsWith('.c')) return 'c'
    if (fileName.endsWith('.cs')) return 'csharp'
    if (fileName.endsWith('.php')) return 'php'
    if (fileName.endsWith('.rb')) return 'ruby'
    if (fileName.endsWith('.go')) return 'go'
    if (fileName.endsWith('.rs')) return 'rust'
    if (fileName.endsWith('.swift')) return 'swift'
    if (fileName.endsWith('.kt')) return 'kotlin'
    if (fileName.endsWith('.scala')) return 'scala'
    if (fileName.endsWith('.r')) return 'r'
    if (fileName.endsWith('.sh') || fileName.endsWith('.bash')) return 'bash'
    if (fileName.endsWith('.sql')) return 'sql'
    if (fileName.endsWith('.html')) return 'html'
    if (fileName.endsWith('.css')) return 'css'
    if (fileName.endsWith('.json')) return 'json'
    if (fileName.endsWith('.xml')) return 'xml'
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'yaml'

    if (mimeType?.includes('javascript')) return 'javascript'
    if (mimeType?.includes('json')) return 'json'
    if (mimeType?.includes('xml')) return 'xml'
    if (mimeType?.includes('html')) return 'html'
    if (mimeType?.includes('css')) return 'css'

    return 'plaintext'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  // Image files
  if (mimeType?.startsWith('image/')) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background text-foreground">
        {publicUrl ? (
          <img
            src={publicUrl}
            alt={fileName}
            className="max-w-full max-h-[600px] object-contain"
          />
        ) : (
          <p className="text-gray-500">Image preview not available</p>
        )}
      </div>
    )
  }

  // PDF files
  if (mimeType === 'application/pdf') {
    return (
      <div className="w-full h-[600px]">
        {publicUrl ? (
          <iframe
            src={publicUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>PDF preview not available. Please download to view.</p>
          </div>
        )}
      </div>
    )
  }

  // CSV files - show as table
  if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
    return (
      <ScrollArea className="h-[600px] w-full border rounded-lg bg-background text-foreground">
        <table className="w-full border-collapse">
          <thead className="bg-muted sticky top-0">
            {csvData.length > 0 && (
              <tr>
                {csvData[0].map((header, idx) => (
                  <th
                    key={idx}
                    className="border px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {header || `Column ${idx + 1}`}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {csvData.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/60">
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="border px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    )
  }

  // Markdown files - simple markdown rendering
  if (mimeType === 'text/markdown' || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
    // Simple markdown to HTML converter
    const markdownToHtml = (md: string) => {
      let html = md
      // Headers
      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code blocks
      html = html.replace(/```[\s\S]*?```/gim, (match) => {
        const code = match.replace(/```/g, '').trim()
        return `<pre><code>${code}</code></pre>`
      })
      // Inline code
      html = html.replace(/`(.*?)`/gim, '<code>$1</code>')
      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      html = html.replace(/\n/gim, '<br>')
      return html
    }

    const sanitizedHtml = typeof window !== 'undefined'
      ? DOMPurify.sanitize(markdownToHtml(content))
      : markdownToHtml(content)

    return (
      <ScrollArea className="h-[600px] w-full border rounded-lg p-6">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </ScrollArea>
    )
  }

  // Code files - show with code editor
  const language = getLanguageFromMimeType(mimeType, fileName)
  const isCodeFile = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
    'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'bash',
    'sql', 'html', 'css', 'json', 'xml', 'yaml'
  ].includes(language)

  if (isCodeFile) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <CodeEditor
          value={content}
          onChange={() => { }} // Read-only for viewing
          language={language}
          height="600px"
          readOnly={true}
          options={{
            showLineNumbers: true,
            wordWrap: true,
            enableBracketMatching: true,
            enableSyntaxValidation: false
          }}
        />
      </div>
    )
  }

  // Plain text files
  return (
    <ScrollArea className="h-[600px] w-full border rounded-lg">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
        {content}
      </pre>
    </ScrollArea>
  )
}

