import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type { Attribute } from './data-model-explorer-types'
import { getAttributeIcon } from './data-model-explorer-utils'

interface SqlFieldDialogProps {
  attributesMap: Record<string, Attribute[]>
  open: boolean
  selectedDataModelId?: string
  onFieldCreated?: () => void
  onOpenChange: (open: boolean) => void
  reloadAttributes: (modelId: string) => void
}

export function SqlFieldDialog({
  attributesMap,
  open,
  selectedDataModelId,
  onFieldCreated,
  onOpenChange,
  reloadAttributes
}: SqlFieldDialogProps) {
  const [sqlFieldName, setSqlFieldName] = useState('')
  const [sqlStatement, setSqlStatement] = useState('')
  const [attributeSuggestions, setAttributeSuggestions] = useState<Attribute[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [attributeSearchQuery, setAttributeSearchQuery] = useState('')
  const [sqlValidationError, setSqlValidationError] = useState<string | null>(null)

  const sqlTextareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const sqlEditorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setSqlFieldName('')
      setSqlStatement('')
      setShowSuggestions(false)
      setAttributeSearchQuery('')
      setSqlValidationError(null)
    }
  }, [open])

  const validateSql = (sql: string) => {
    if (!sql.trim()) {
      setSqlValidationError(null)
      return
    }

    const errors: string[] = []
    const openParens = (sql.match(/\(/g) || []).length
    const closeParens = (sql.match(/\)/g) || []).length
    if (openParens !== closeParens) errors.push('Unmatched parentheses')

    const singleQuotes = (sql.match(/'/g) || []).length
    const doubleQuotes = (sql.match(/"/g) || []).length
    if (singleQuotes % 2 !== 0) errors.push('Unmatched single quotes')
    if (doubleQuotes % 2 !== 0) errors.push('Unmatched double quotes')

    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE']
    const keywordRegex = new RegExp(`\\b(${dangerousKeywords.join('|')})\\b`, 'i')
    if (keywordRegex.test(sql)) {
      errors.push('Potentially dangerous SQL keyword detected')
    }

    setSqlValidationError(errors.length > 0 ? errors.join(', ') : null)
  }

  const renderSqlWithBadges = (sql: string): React.ReactNode => {
    if (!sql || !selectedDataModelId) {
      return <span className="text-muted-foreground">SELECT attribute_name * 2 AS calculated_value FROM table...</span>
    }

    const attrs = attributesMap[selectedDataModelId] || []
    const attrMap = new Map(attrs.map((attr) => [attr.name.toLowerCase(), attr]))
    const parts: Array<{ type: 'text' | 'attribute'; content: string; attr?: Attribute }> = []
    let lastIndex = 0
    const positions: Array<{ start: number; end: number; attr: Attribute }> = []

    for (const word of sql.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []) {
      const attr = attrMap.get(word.toLowerCase())
      if (!attr) continue
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      let match
      while ((match = regex.exec(sql)) !== null) {
        positions.push({ start: match.index, end: match.index + word.length, attr })
      }
    }

    positions.sort((a, b) => a.start - b.start)
    for (const pos of positions) {
      if (pos.start > lastIndex) parts.push({ type: 'text', content: sql.substring(lastIndex, pos.start) })
      parts.push({ type: 'attribute', content: pos.attr.name, attr: pos.attr })
      lastIndex = pos.end
    }
    if (lastIndex < sql.length) parts.push({ type: 'text', content: sql.substring(lastIndex) })
    if (parts.length === 0) parts.push({ type: 'text', content: sql })

    return (
      <>
        {parts.map((part, idx) => {
          if (part.type === 'attribute' && part.attr) {
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/30 mr-1"
                contentEditable={false}
                data-attribute={part.content}
              >
                {getAttributeIcon(part.attr.type)}
                <span>{part.content}</span>
              </span>
            )
          }
          return <span key={idx}>{part.content}</span>
        })}
      </>
    )
  }

  const insertAttribute = (attrName: string) => {
    const textarea = sqlTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = sqlStatement.substring(0, start)
    const after = sqlStatement.substring(end)
    const newText = `${before}${attrName}${after}`
    setSqlStatement(newText)
    validateSql(newText)
    setTimeout(() => {
      textarea.focus()
      const newPos = start + attrName.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const completeSuggestion = (attr: Attribute) => {
    const textarea = sqlTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const textBeforeCursor = sqlStatement.substring(0, start)
    const match = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)
    if (!match) return
    const before = sqlStatement.substring(0, start - match[1].length)
    const after = sqlStatement.substring(start)
    const newText = `${before}${attr.name}${after}`
    setSqlStatement(newText)
    validateSql(newText)
    setShowSuggestions(false)
    setTimeout(() => {
      textarea.focus()
      const newPos = start - match[1].length + attr.name.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const createField = async () => {
    if (!sqlFieldName.trim() || !sqlStatement.trim()) {
      alert('Please enter both field name and SQL statement')
      return
    }
    if (!selectedDataModelId) {
      alert('No data model selected')
      return
    }

    try {
      const response = await fetch(`/api/data-models/${selectedDataModelId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sqlFieldName,
          display_name: sqlFieldName,
          type: 'calculated',
          sql_expression: sqlStatement,
          is_calculated: true
        })
      })
      if (!response.ok) throw new Error('Failed to create field')
      if (attributesMap[selectedDataModelId]) reloadAttributes(selectedDataModelId)
      onOpenChange(false)
      onFieldCreated?.()
    } catch (error) {
      console.error('Error creating SQL field:', error)
      alert('Failed to create SQL field')
    }
  }

  const selectedAttributes = selectedDataModelId ? attributesMap[selectedDataModelId] || [] : []
  const visibleAttributes = attributeSearchQuery.trim()
    ? selectedAttributes.filter((attr) =>
      attr.name.toLowerCase().includes(attributeSearchQuery.toLowerCase()) ||
      attr.display_name.toLowerCase().includes(attributeSearchQuery.toLowerCase()))
    : selectedAttributes

  const detectedAttributes = selectedDataModelId && sqlStatement && !sqlValidationError
    ? Array.from(new Set((sqlStatement.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [])
      .filter((word) => selectedAttributes.some((attr) => attr.name.toLowerCase() === word.toLowerCase()))))
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Create SQL Field</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-64 border-r flex flex-col overflow-hidden">
            <div className="p-2 border-b">
              <Label className="text-xs font-semibold">Attributes</Label>
              <p className="text-[10px] text-muted-foreground mt-1">Drag to SQL or click to insert</p>
            </div>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="text"
                  value={attributeSearchQuery}
                  onChange={(event) => setAttributeSearchQuery(event.target.value)}
                  placeholder="Search attributes..."
                  className="h-7 text-xs pl-7"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {visibleAttributes.map((attr) => (
                <div
                  key={attr.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', attr.name)
                    event.dataTransfer.setData('application/json', JSON.stringify({ attribute: attr, type: 'attribute' }))
                  }}
                  onClick={() => insertAttribute(attr.name)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 cursor-pointer group transition-colors bg-background border border-transparent hover:border-primary/30"
                  title={`Drag or click to insert: ${attr.name}`}
                >
                  {getAttributeIcon(attr.type)}
                  <span className="text-xs flex-1 text-foreground">{attr.display_name || attr.name}</span>
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">{attr.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-2 mb-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Field Name</Label>
                <Input
                  value={sqlFieldName}
                  onChange={(event) => setSqlFieldName(event.target.value)}
                  placeholder="e.g., calculated_field"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-2">
              <Label className="text-xs font-medium">SQL Statement</Label>
              <div className="relative flex-1 border rounded overflow-hidden">
                <div
                  ref={sqlEditorRef}
                  className="absolute inset-0 w-full h-full p-3 text-xs font-mono pointer-events-none overflow-auto z-0"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {renderSqlWithBadges(sqlStatement)}
                </div>

                <textarea
                  ref={sqlTextareaRef}
                  value={sqlStatement}
                  onChange={(event) => {
                    const value = event.target.value
                    setSqlStatement(value)
                    validateSql(value)
                    const cursorPos = event.target.selectionStart
                    const match = value.substring(0, cursorPos).match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)
                    if (match && selectedDataModelId) {
                      const partialName = match[1].toLowerCase()
                      const suggestions = selectedAttributes.filter((attr) =>
                        attr.name.toLowerCase().startsWith(partialName) ||
                        attr.display_name.toLowerCase().startsWith(partialName))
                      setAttributeSuggestions(suggestions)
                      setShowSuggestions(suggestions.length > 0)
                      setSuggestionIndex(0)
                    } else {
                      setShowSuggestions(false)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!showSuggestions || attributeSuggestions.length === 0) return
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      setSuggestionIndex((prev) => (prev + 1) % attributeSuggestions.length)
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      setSuggestionIndex((prev) => (prev - 1 + attributeSuggestions.length) % attributeSuggestions.length)
                    } else if (event.key === 'Enter' || event.key === 'Tab') {
                      event.preventDefault()
                      const selected = attributeSuggestions[suggestionIndex]
                      if (selected) completeSuggestion(selected)
                    } else if (event.key === 'Escape') {
                      setShowSuggestions(false)
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const attrName = event.dataTransfer.getData('text/plain')
                    if (attrName) insertAttribute(attrName)
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  className="absolute inset-0 w-full h-full p-3 text-xs font-mono border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-transparent z-10"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'transparent',
                    caretColor: 'hsl(var(--foreground))'
                  }}
                  placeholder={sqlStatement ? '' : 'SELECT attribute_name * 2 AS calculated_value FROM table...'}
                />

                {sqlValidationError && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-destructive/10 border-t border-destructive/30 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                    <span className="text-[10px] text-destructive">{sqlValidationError}</span>
                  </div>
                )}

                {detectedAttributes.length > 0 && (
                  <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 p-2 bg-primary/10 rounded border border-primary/30">
                    <span className="text-[10px] text-muted-foreground mr-1">Detected attributes:</span>
                    {detectedAttributes.map((attrName, idx) => {
                      const attr = selectedAttributes.find((item) => item.name.toLowerCase() === attrName.toLowerCase())
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/30"
                        >
                          {attr && getAttributeIcon(attr.type)}
                          <span>{attrName}</span>
                        </span>
                      )
                    })}
                  </div>
                )}

                {showSuggestions && attributeSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 bg-background border rounded shadow-lg max-h-48 overflow-y-auto"
                    style={{ top: '100%', left: 0, right: 0 }}
                  >
                    {attributeSuggestions.map((attr, idx) => (
                      <div
                        key={attr.id}
                        onClick={() => completeSuggestion(attr)}
                        className={cn(
                          'px-3 py-2 cursor-pointer hover:bg-primary/10 flex items-center gap-2',
                          idx === suggestionIndex && 'bg-primary/20'
                        )}
                      >
                        {getAttributeIcon(attr.type)}
                        <span className="text-xs">{attr.display_name || attr.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{attr.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={createField}>
            Create Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
