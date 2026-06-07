'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { createSQLAutocomplete, fetchDatabaseSchema } from '@/lib/sql-autocomplete'
import { CodeEditorTextArea } from './code-editor-textarea'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
  placeholder?: string
  readOnly?: boolean
  theme?: 'dark' | 'light'
  options?: {
    fontSize?: number
    fontFamily?: string
    tabSize?: number
    wordWrap?: boolean
    showLineNumbers?: boolean
    showGutter?: boolean
    enableBracketMatching?: boolean
    enableAutoIndent?: boolean
    enableFindReplace?: boolean
    enableCodeFolding?: boolean
    enableMinimap?: boolean
    enableAutoComplete?: boolean
    enableSyntaxValidation?: boolean
    enableErrorHighlighting?: boolean
    enableIntelliSense?: boolean
    enableSnippets?: boolean
    enableBracketPairColorization?: boolean
    enableIndentGuides?: boolean
    enableWordHighlight?: boolean
    enableCurrentLineHighlight?: boolean
    enableSelectionHighlight?: boolean
  }
  className?: string
  onJumpToLine?: (line: number, column?: number) => void
  editorRef?: React.RefObject<any>
}

export function CodeEditor({
  value,
  onChange,
  language = 'sql',
  height = '300px',
  placeholder,
  readOnly = false,
  theme = 'light',
  options = {},
  className = '',
  onJumpToLine,
  editorRef
}: CodeEditorProps) {
  const [dbSchema, setDbSchema] = useState<any>(null)
  const [sqlAutocomplete, setSqlAutocomplete] = useState<any>(null)
  const internalEditorRef = useRef<any>(null)
  const viewRef = useRef<EditorView | null>(null)

  // Use provided ref or internal ref
  const codeMirrorRef = editorRef || internalEditorRef

  // For SQL language, use CodeMirror with proper autocomplete
  const isSQL = language.toLowerCase() === 'sql'

  // Expose jump to line function via ref
  useEffect(() => {
    if (codeMirrorRef && onJumpToLine) {
      const jumpToLine = (line: number, column?: number) => {
        if (viewRef.current) {
          const lineNumber = Math.max(1, Math.min(line, value.split('\n').length))
          const doc = viewRef.current.state.doc
          const linePos = doc.line(lineNumber).from
          const pos = column ? linePos + Math.max(0, column - 1) : linePos

          viewRef.current.dispatch({
            selection: { anchor: pos, head: pos },
            effects: EditorView.scrollIntoView(pos, { y: 'center' })
          })
          viewRef.current.focus()
        }
      }

      // Store jump function in ref
      if (codeMirrorRef.current) {
        codeMirrorRef.current.jumpToLine = jumpToLine
      }
    }
  }, [codeMirrorRef, onJumpToLine, value])

  // Fetch database schema for SQL autocomplete
  useEffect(() => {
    // Skip during build time - API won't be available
    if (typeof process !== 'undefined' && process.env?.NEXT_PHASE === 'phase-production-build') {
      // Set default autocomplete during build
      const defaultAutocomplete = createSQLAutocomplete(undefined, 'postgresql')
      setSqlAutocomplete(defaultAutocomplete)
      return
    }

    if (isSQL && options.enableAutoComplete !== false) {
      fetchDatabaseSchema()
        .then(schema => {
          if (schema && schema.tables && Array.isArray(schema.tables)) {
            setDbSchema(schema)
            const autocomplete = createSQLAutocomplete(schema, 'postgresql')
            setSqlAutocomplete(autocomplete)
          } else {
            // Fallback to default autocomplete
            const defaultAutocomplete = createSQLAutocomplete(undefined, 'postgresql')
            setSqlAutocomplete(defaultAutocomplete)
          }
        })
        .catch(err => {
          // Suppress errors during build time
          if (typeof process === 'undefined' || process.env?.NEXT_PHASE !== 'phase-production-build') {
            console.error('Failed to load database schema:', err)
          }
          // Fallback to default autocomplete on error
          const defaultAutocomplete = createSQLAutocomplete(undefined, 'postgresql')
          setSqlAutocomplete(defaultAutocomplete)
        })
    }
  }, [isSQL, options.enableAutoComplete])

  // Memoize SQL extensions to avoid recreating them on every render
  const sqlExtensions = useMemo(() => {
    if (!isSQL) return []

    // Check if sql function is available
    if (typeof sql !== 'function') {
      console.warn('SQL extension not available, falling back to basic editor')
      return [
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
            height: height === '100%' ? '100%' : null,
            minHeight: height === '100%' ? null : height
          },
          '.cm-content': {
            padding: '8px',
            minHeight: height === '100%' ? '100%' : height
          },
          '.cm-scroller': {
            overflow: 'auto'
          }
        })
      ]
    }

    try {
      // Call sql function with error handling
      let sqlExtension
      try {
        sqlExtension = sql({ dialect: 'postgresql', upperCaseKeywords: true })

        // Verify the extension was created successfully
        if (!sqlExtension || (Array.isArray(sqlExtension) && sqlExtension.length === 0)) {
          throw new Error('SQL extension returned empty result')
        }
      } catch (sqlError: any) {
        // Log the error for debugging (only in development, not during build)
        // During build, NODE_ENV is 'production', so this won't log
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to initialize SQL extension:', sqlError?.message || sqlError)
        }
        // Fallback to basic editor without SQL extension
        return [
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              fontSize: options.fontSize || 14,
              fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
              height: height === '100%' ? '100%' : null,
              minHeight: height === '100%' ? null : height
            },
            '.cm-content': {
              padding: '8px',
              minHeight: height === '100%' ? '100%' : height
            },
            '.cm-scroller': {
              overflow: 'auto'
            }
          })
        ]
      }

      // Define syntax highlighting styles
      const highlightStyle = HighlightStyle.define([
        { tag: tags.keyword, color: '#0077aa', fontWeight: 'bold' },
        { tag: tags.string, color: '#669900' },
        { tag: tags.comment, color: '#999988', fontStyle: 'italic' },
        { tag: tags.number, color: '#990055' },
        { tag: tags.definition(tags.variableName), color: '#0077aa' },
        { tag: tags.variableName, color: theme === 'dark' ? '#e6e6e6' : '#1a1a1a' },
        { tag: tags.operator, color: '#a67f59' },
        { tag: tags.typeName, color: '#0077aa' },
        { tag: tags.propertyName, color: '#0077aa' },
        { tag: tags.function(tags.variableName), color: '#6f42c1' },
        { tag: tags.className, color: '#0077aa' },
      ])

      // Configure autocomplete - always include it
      // If we have custom autocomplete, use it; otherwise use default SQL autocomplete
      const autocompleteExtension = sqlAutocomplete
        ? autocompletion({
          override: [sqlAutocomplete],
          activateOnTyping: true,
          maxRenderedOptions: 10,
          defaultKeymap: true
        })
        : autocompletion({
          activateOnTyping: true,
          maxRenderedOptions: 10,
          defaultKeymap: true
        })

      return [
        sqlExtension, // Language extension first for syntax highlighting
        autocompleteExtension, // Autocomplete extension
        syntaxHighlighting(highlightStyle), // Explicit syntax highlighting
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
            height: height === '100%' ? '100%' : null,
            minHeight: height === '100%' ? null : height
          },
          '.cm-content': {
            padding: '8px',
            minHeight: height === '100%' ? '100%' : height
          },
          '.cm-scroller': {
            overflow: 'auto'
          }
        })
      ]
    } catch (error) {
      // Suppress errors during build time - SQL extensions may not be available during SSR/build
      if (typeof process === 'undefined' || process.env?.NEXT_PHASE !== 'phase-production-build') {
        console.error('Error initializing SQL extensions:', error)
      }
      return [
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: options.fontSize || 14,
            fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
            height: height === '100%' ? '100%' : null,
            minHeight: height === '100%' ? null : height
          },
          '.cm-content': {
            padding: '8px',
            minHeight: height === '100%' ? '100%' : height
          },
          '.cm-scroller': {
            overflow: 'auto'
          }
        })
      ]
    }
  }, [isSQL, sqlAutocomplete, options.fontSize, options.fontFamily, height, theme])

  // If SQL language, use CodeMirror with proper autocomplete
  if (isSQL) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          height={height}
          theme={theme === 'dark' ? oneDark : undefined}
          extensions={[
            ...sqlExtensions,
            EditorView.updateListener.of((update) => {
              if (update.view && !viewRef.current) {
                viewRef.current = update.view
              }
            })
          ]}
          basicSetup={{
            lineNumbers: options.showLineNumbers !== false,
            highlightActiveLine: true,
            bracketMatching: options.enableBracketMatching !== false,
            closeBrackets: true,
            autocompletion: options.enableAutoComplete !== false,
            searchKeymap: true,
            history: true,
            indentOnInput: true,
            defaultKeymap: true,
            foldGutter: options.enableCodeFolding !== false,
            tabSize: options.tabSize || 2
          }}
        />
      </div>
    )
  }

  return (
    <CodeEditorTextArea
      value={value}
      onChange={onChange}
      language={language}
      height={height}
      placeholder={placeholder}
      readOnly={readOnly}
      theme={theme}
      options={options}
      className={className}
    />
  )}
