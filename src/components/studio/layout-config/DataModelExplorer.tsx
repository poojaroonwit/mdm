'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Database, ChevronRight, ChevronDown, Hash, Calendar, Type, DollarSign, TrendingUp, Plus, X, Search, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import { DataModelDialog } from '@/app/admin/features/data/components/DataModelDialog'

interface Space {
  id: string
  name: string
  slug?: string
}

interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
}

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required?: boolean
  is_unique?: boolean
}

interface DataModelExplorerProps {
  spaceId: string
  selectedDataModelId?: string
  onDataModelSelect?: (modelId: string | null) => void
  className?: string
  onFieldCreated?: () => void
}

export function DataModelExplorer({
  spaceId,
  selectedDataModelId,
  onDataModelSelect,
  className,
  onFieldCreated
}: DataModelExplorerProps) {
  if (!spaceId) return null

  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())
  const [attributesMap, setAttributesMap] = useState<Record<string, Attribute[]>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSqlDialog, setShowSqlDialog] = useState(false)
  const [sqlFieldName, setSqlFieldName] = useState('')
  const [sqlStatement, setSqlStatement] = useState('')
  const [sqlCursorPos, setSqlCursorPos] = useState(0)
  const [attributeSuggestions, setAttributeSuggestions] = useState<Attribute[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [attributeSearchQuery, setAttributeSearchQuery] = useState('')
  const [sqlValidationError, setSqlValidationError] = useState<string | null>(null)

  const [showCreateModelDialog, setShowCreateModelDialog] = useState(false)
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)

  const sqlTextareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const sqlEditorRef = useRef<HTMLDivElement>(null)

  const loadDataModels = React.useCallback(async () => {
    if (!spaceId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/data-models`)
      if (!res.ok) throw new Error('Failed to load data models')
      const json = await res.json()
      setDataModels(json.dataModels || [])

      // Auto-expand selected model
      if (selectedDataModelId) {
        setExpandedModels(new Set([selectedDataModelId]))
        loadAttributes(selectedDataModelId)
      }
    } catch (error) {
      console.error('Error loading data models:', error)
    } finally {
      setLoading(false)
    }
  }, [spaceId, selectedDataModelId])

  // Load data models for the space
  useEffect(() => {
    loadDataModels()
  }, [loadDataModels])

  // Load current space details
  useEffect(() => {
    const loadSpace = async () => {
      if (!spaceId) return
      try {
        const res = await fetch(`/api/spaces/${spaceId}`)
        if (!res.ok) throw new Error('Failed to load space')
        const json = await res.json()
        setCurrentSpace(json.space)
      } catch (error) {
        console.error('Error loading space:', error)
      }
    }
    loadSpace()
  }, [spaceId])

  // Load attributes for a specific model
  const loadAttributes = async (modelId: string) => {
    if (attributesMap[modelId]) return // Already loaded

    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      if (!res.ok) throw new Error('Failed to load attributes')
      const json = await res.json()
      setAttributesMap(prev => ({
        ...prev,
        [modelId]: json.attributes || []
      }))
    } catch (error) {
      console.error('Error loading attributes:', error)
      setAttributesMap(prev => ({
        ...prev,
        [modelId]: []
      }))
    }
  }

  const toggleModel = (modelId: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
        loadAttributes(modelId)
      }
      return next
    })
  }

  const handleAttributeDragStart = (e: React.DragEvent, attribute: Attribute, model: DataModel) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      attribute,
      model,
      type: 'attribute'
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  // Helper to validate SQL
  const validateSql = (sql: string) => {
    if (!sql.trim()) {
      setSqlValidationError(null)
      return
    }

    const errors: string[] = []

    // Check for basic SQL structure
    const trimmed = sql.trim()
    if (!trimmed) {
      setSqlValidationError(null)
      return
    }

    // Check for unmatched parentheses
    const openParens = (sql.match(/\(/g) || []).length
    const closeParens = (sql.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push('Unmatched parentheses')
    }

    // Check for unmatched quotes
    const singleQuotes = (sql.match(/'/g) || []).length
    const doubleQuotes = (sql.match(/"/g) || []).length
    if (singleQuotes % 2 !== 0) {
      errors.push('Unmatched single quotes')
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push('Unmatched double quotes')
    }

    // Check for potentially dangerous SQL keywords (basic check)
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE']
    const upperSql = sql.toUpperCase()
    if (dangerousKeywords.some(keyword => upperSql.includes(keyword))) {
      // Only warn if these are standalone keywords (not part of other words)
      const keywordRegex = new RegExp(`\\b(${dangerousKeywords.join('|')})\\b`, 'i')
      if (keywordRegex.test(sql)) {
        errors.push('Potentially dangerous SQL keyword detected')
      }
    }

    setSqlValidationError(errors.length > 0 ? errors.join(', ') : null)
  }

  // Helper to extract plain text from contentEditable (removing badge formatting)
  const extractPlainTextFromEditor = (html: string): string => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // Helper to create attribute badge DOM element
  const createAttributeBadge = (attr: Attribute, attrName: string): HTMLSpanElement => {
    const badge = document.createElement('span')
    badge.className = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/30 mr-1'
    badge.setAttribute('data-attribute', attrName)
    badge.contentEditable = 'false'

    // Create icon wrapper
    const iconWrapper = document.createElement('span')
    iconWrapper.className = 'inline-flex items-center'
    badge.appendChild(iconWrapper)

    // Create text
    const text = document.createTextNode(attrName)
    badge.appendChild(text)

    return badge
  }

  // Helper to render SQL with badges
  const renderSqlWithBadges = (sql: string): React.ReactNode => {
    if (!sql || !selectedDataModelId) {
      return <span className="text-muted-foreground">SELECT attribute_name * 2 AS calculated_value FROM table...</span>
    }

    const attrs = attributesMap[selectedDataModelId] || []
    const attrNames = attrs.map(a => a.name.toLowerCase())
    const attrMap = new Map(attrs.map(a => [a.name.toLowerCase(), a]))

    // Split SQL into parts: attributes and other text
    const parts: Array<{ type: 'text' | 'attribute'; content: string; attr?: Attribute }> = []
    let lastIndex = 0

    // Find all attribute names (word boundaries)
    const words = sql.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
    const positions: Array<{ start: number; end: number; attr: Attribute }> = []

    for (const word of words) {
      const attr = attrMap.get(word.toLowerCase())
      if (attr) {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        let match
        while ((match = regex.exec(sql)) !== null) {
          positions.push({
            start: match.index,
            end: match.index + word.length,
            attr
          })
        }
      }
    }

    // Sort positions by start index
    positions.sort((a, b) => a.start - b.start)

    // Build parts array
    for (const pos of positions) {
      if (pos.start > lastIndex) {
        parts.push({ type: 'text', content: sql.substring(lastIndex, pos.start) })
      }
      parts.push({ type: 'attribute', content: pos.attr.name, attr: pos.attr })
      lastIndex = pos.end
    }

    if (lastIndex < sql.length) {
      parts.push({ type: 'text', content: sql.substring(lastIndex) })
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content: sql })
    }

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

  const getAttributeIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('number') || lowerType.includes('integer') || lowerType.includes('decimal')) {
      return <Hash className="h-3 w-3 text-primary" />
    }
    if (lowerType.includes('date') || lowerType.includes('time')) {
      return <Calendar className="h-3 w-3 text-primary" />
    }
    if (lowerType.includes('money') || lowerType.includes('currency')) {
      return <DollarSign className="h-3 w-3 text-warning" />
    }
    return <Type className="h-3 w-3 text-muted-foreground" />
  }

  const isNumeric = (type: string): boolean => {
    const lowerType = type.toLowerCase()
    return lowerType.includes('number') ||
      lowerType.includes('integer') ||
      lowerType.includes('decimal') ||
      lowerType.includes('float') ||
      lowerType.includes('money') ||
      lowerType.includes('currency')
  }

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return dataModels

    const query = searchQuery.toLowerCase()
    return dataModels.filter(model =>
      model.name.toLowerCase().includes(query) ||
      model.display_name.toLowerCase().includes(query)
    )
  }, [dataModels, searchQuery])

  const filteredAttributes = (modelId: string): Attribute[] => {
    const attrs = attributesMap[modelId] || []
    if (!searchQuery.trim()) return attrs

    const query = searchQuery.toLowerCase()
    return attrs.filter(attr =>
      attr.name.toLowerCase().includes(query) ||
      attr.display_name.toLowerCase().includes(query)
    )
  }

  return (
    <div className={cn("flex h-full flex-col border-l bg-card text-card-foreground", className)}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Data Models</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowCreateModelDialog(true)}
            title="Add Data Model"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <input
          type="text"
          placeholder="Search models or attributes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Loading data models...</div>
        ) : filteredModels.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No models found' : 'No data models available'}
          </div>
        ) : (
          <div className="p-2">
            {filteredModels.map((model) => {
              const isExpanded = expandedModels.has(model.id)
              const isSelected = selectedDataModelId === model.id
              const attributes = filteredAttributes(model.id)
              const numericAttributes = attributes.filter(attr => isNumeric(attr.type))
              const dimensionAttributes = attributes.filter(attr => !isNumeric(attr.type))

              return (
                <div key={model.id} className="mb-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted transition-colors",
                      isSelected && "bg-primary/10 border border-primary/30"
                    )}
                    onClick={() => {
                      toggleModel(model.id)
                      onDataModelSelect?.(model.id)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium flex-1">{model.display_name || model.name}</span>
                    {attributes.length > 0 && (
                      <span className="text-xs text-muted-foreground">{attributes.length}</span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-3">
                      {/* Dimensions Section */}
                      {dimensionAttributes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1 px-1">
                            Dimensions
                          </div>
                          <div className="space-y-0.5">
                            {dimensionAttributes.map((attr) => (
                              <div
                                key={attr.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleAttributeDragStart(e, attr, model)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 cursor-grab active:cursor-grabbing group transition-colors bg-background border border-transparent hover:border-primary/30"
                                title={`Drag to dimensions: ${attr.display_name || attr.name} (${attr.type})`}
                              >
                                {getAttributeIcon(attr.type)}
                                <span className="text-xs flex-1 text-foreground">{attr.display_name || attr.name}</span>
                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                  {attr.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Measures Section */}
                      {numericAttributes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1 px-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Measures
                          </div>
                          <div className="space-y-0.5">
                            {numericAttributes.map((attr) => (
                              <div
                                key={attr.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleAttributeDragStart(e, attr, model)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 cursor-grab active:cursor-grabbing group transition-colors bg-background border border-transparent hover:border-primary/30"
                                title={`Drag to measures: ${attr.display_name || attr.name} (${attr.type})`}
                              >
                                {getAttributeIcon(attr.type)}
                                <span className="text-xs flex-1 text-foreground">{attr.display_name || attr.name}</span>
                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                  {attr.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {attributes.length === 0 && (
                        <div className="text-xs text-muted-foreground px-2 py-1">No attributes found</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create SQL Field Button */}
      <div className="p-3 border-t">
        <Button
          onClick={() => {
            if (!selectedDataModelId) {
              alert('Please select a data model first')
              return
            }
            setShowSqlDialog(true)
            setSqlFieldName('')
            setSqlStatement('')
          }}
          className="w-full text-xs"
          size="sm"
          variant="outline"
        >
          <Plus className="h-3 w-3 mr-2" />
          Create SQL Field
        </Button>
      </div>

      {/* SQL Field Creation Dialog */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">Create SQL Field</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Left Panel - Attributes */}
            <div className="w-64 border-r flex flex-col overflow-hidden">
              <div className="p-2 border-b">
                <Label className="text-xs font-semibold">Attributes</Label>
                <p className="text-[10px] text-muted-foreground mt-1">Drag to SQL or click to insert</p>
              </div>
              {/* Search */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="text"
                    value={attributeSearchQuery}
                    onChange={(e) => setAttributeSearchQuery(e.target.value)}
                    placeholder="Search attributes..."
                    className="h-7 text-xs pl-7"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {selectedDataModelId && (() => {
                  const attrs = attributesMap[selectedDataModelId] || []
                  const filtered = attributeSearchQuery.trim()
                    ? attrs.filter(attr =>
                      attr.name.toLowerCase().includes(attributeSearchQuery.toLowerCase()) ||
                      attr.display_name.toLowerCase().includes(attributeSearchQuery.toLowerCase())
                    )
                    : attrs
                  return filtered.map((attr) => (
                    <div
                      key={attr.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', attr.name)
                        e.dataTransfer.setData('application/json', JSON.stringify({ attribute: attr, type: 'attribute' }))
                      }}
                      onClick={() => {
                        const textarea = sqlTextareaRef.current
                        if (textarea) {
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const text = sqlStatement
                          const before = text.substring(0, start)
                          const after = text.substring(end)
                          const newText = `${before}${attr.name}${after}`
                          setSqlStatement(newText)
                          validateSql(newText)
                          setTimeout(() => {
                            textarea.focus()
                            const newPos = start + attr.name.length
                            textarea.setSelectionRange(newPos, newPos)
                          }, 0)
                        }
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 cursor-pointer group transition-colors bg-background border border-transparent hover:border-primary/30"
                      title={`Drag or click to insert: ${attr.name}`}
                    >
                      {getAttributeIcon(attr.type)}
                      <span className="text-xs flex-1 text-foreground">{attr.display_name || attr.name}</span>
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                        {attr.type}
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Right Panel - SQL Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="space-y-2 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Field Name</Label>
                  <Input
                    value={sqlFieldName}
                    onChange={(e) => setSqlFieldName(e.target.value)}
                    placeholder="e.g., calculated_field"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col space-y-2">
                <Label className="text-xs font-medium">SQL Statement</Label>
                <div className="relative flex-1 border rounded overflow-hidden">
                  {/* Visible badge overlay (renders badges) */}
                  <div
                    ref={sqlEditorRef}
                    className="absolute inset-0 w-full h-full p-3 text-xs font-mono pointer-events-none overflow-auto z-0"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {renderSqlWithBadges(sqlStatement)}
                  </div>

                  {/* Visible textarea for editing (on top, with transparent text so badges show through) */}
                  <textarea
                    ref={sqlTextareaRef}
                    value={sqlStatement}
                    onChange={(e) => {
                      const value = e.target.value
                      setSqlStatement(value)
                      validateSql(value)
                      const cursorPos = e.target.selectionStart
                      setSqlCursorPos(cursorPos)

                      // Find attribute name being typed
                      const textBeforeCursor = value.substring(0, cursorPos)
                      const match = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)

                      if (match && selectedDataModelId) {
                        const partialName = match[1].toLowerCase()
                        const attrs = attributesMap[selectedDataModelId] || []
                        const suggestions = attrs.filter(attr =>
                          attr.name.toLowerCase().startsWith(partialName) ||
                          attr.display_name.toLowerCase().startsWith(partialName)
                        )
                        if (suggestions.length > 0) {
                          setAttributeSuggestions(suggestions)
                          setShowSuggestions(true)
                          setSuggestionIndex(0)
                        } else {
                          setShowSuggestions(false)
                        }
                      } else {
                        setShowSuggestions(false)
                      }
                    }}
                    onSelect={(e) => {
                      const cursorPos = (e.target as HTMLTextAreaElement).selectionStart
                      setSqlCursorPos(cursorPos)
                    }}
                    onKeyDown={(e) => {
                      if (showSuggestions && attributeSuggestions.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setSuggestionIndex((prev) => (prev + 1) % attributeSuggestions.length)
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setSuggestionIndex((prev) => (prev - 1 + attributeSuggestions.length) % attributeSuggestions.length)
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault()
                          const selected = attributeSuggestions[suggestionIndex]
                          if (selected) {
                            const textarea = sqlTextareaRef.current
                            if (textarea) {
                              const start = textarea.selectionStart
                              const text = sqlStatement
                              const textBeforeCursor = text.substring(0, start)
                              const match = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)
                              if (match) {
                                const before = text.substring(0, start - match[1].length)
                                const after = text.substring(start)
                                const newText = `${before}${selected.name}${after}`
                                setSqlStatement(newText)
                                validateSql(newText)
                                setTimeout(() => {
                                  textarea.focus()
                                  const newPos = start - match[1].length + selected.name.length
                                  textarea.setSelectionRange(newPos, newPos)
                                }, 0)
                              }
                            }
                            setShowSuggestions(false)
                          }
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false)
                        }
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const attrName = e.dataTransfer.getData('text/plain')
                      if (attrName && sqlTextareaRef.current) {
                        const textarea = sqlTextareaRef.current
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const text = sqlStatement
                        const before = text.substring(0, start)
                        const after = text.substring(end)
                        const newText = `${before}${attrName}${after}`
                        setSqlStatement(newText)
                        validateSql(newText)
                        setTimeout(() => {
                          textarea.focus()
                          const newPos = start + attrName.length
                          textarea.setSelectionRange(newPos, newPos)
                        }, 0)
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="absolute inset-0 w-full h-full p-3 text-xs font-mono border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-transparent z-10"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'transparent',
                      caretColor: 'hsl(var(--foreground))'
                    }}
                    placeholder={sqlStatement ? '' : 'SELECT attribute_name * 2 AS calculated_value FROM table...'}
                  />

                  {/* Validation Error */}
                  {sqlValidationError && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-destructive/10 border-t border-destructive/30 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                      <span className="text-[10px] text-destructive">{sqlValidationError}</span>
                    </div>
                  )}

                  {/* Detected Attributes Preview */}
                  {selectedDataModelId && sqlStatement && !sqlValidationError && (() => {
                    const attrs = attributesMap[selectedDataModelId] || []
                    const attrNames = attrs.map(a => a.name.toLowerCase())
                    const words = sqlStatement.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
                    const detectedAttrs = words.filter(word => attrNames.includes(word.toLowerCase()))
                    const uniqueDetected = Array.from(new Set(detectedAttrs))

                    if (uniqueDetected.length > 0) {
                      return (
                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 p-2 bg-primary/10 rounded border border-primary/30">
                          <span className="text-[10px] text-muted-foreground mr-1">Detected attributes:</span>
                          {uniqueDetected.map((attrName, idx) => {
                            const attr = attrs.find(a => a.name.toLowerCase() === attrName.toLowerCase())
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
                      )
                    }
                    return null
                  })()}

                  {/* Attribute Suggestions */}
                  {showSuggestions && attributeSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 mt-1 bg-background border rounded shadow-lg max-h-48 overflow-y-auto"
                      style={{
                        top: '100%',
                        left: 0,
                        right: 0
                      }}
                    >
                      {attributeSuggestions.map((attr, idx) => (
                        <div
                          key={attr.id}
                          onClick={() => {
                            const textarea = sqlTextareaRef.current
                            if (textarea) {
                              const start = textarea.selectionStart
                              const text = sqlStatement
                              const textBeforeCursor = text.substring(0, start)
                              const match = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)
                              if (match) {
                                const before = text.substring(0, start - match[1].length)
                                const after = text.substring(start)
                                const newText = `${before}${attr.name}${after}`
                                setSqlStatement(newText)
                                setTimeout(() => {
                                  textarea.focus()
                                  const newPos = start - match[1].length + attr.name.length
                                  textarea.setSelectionRange(newPos, newPos)
                                }, 0)
                              }
                            }
                            setShowSuggestions(false)
                          }}
                          className={cn(
                            "px-3 py-2 cursor-pointer hover:bg-primary/10 flex items-center gap-2",
                            idx === suggestionIndex && "bg-primary/20"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSqlDialog(false)
                setSqlFieldName('')
                setSqlStatement('')
                setShowSuggestions(false)
                setAttributeSearchQuery('')
                setSqlValidationError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
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

                  // Reload attributes
                  if (attributesMap[selectedDataModelId]) {
                    loadAttributes(selectedDataModelId)
                  }

                  setShowSqlDialog(false)
                  setSqlFieldName('')
                  setSqlStatement('')
                  setShowSuggestions(false)
                  onFieldCreated?.()
                } catch (error) {
                  console.error('Error creating SQL field:', error)
                  alert('Failed to create SQL field')
                }
              }}
            >
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Data Model Dialog */}
      {currentSpace && (
        <DataModelDialog
          open={showCreateModelDialog}
          onOpenChange={setShowCreateModelDialog}
          model={null}
          spaces={[currentSpace]}
          onSuccess={() => {
            loadDataModels()
            setShowCreateModelDialog(false)
          }}
        />
      )}
    </div>
  )
}

