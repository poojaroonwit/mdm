// @ts-nocheck
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import hljs from 'highlight.js'
import { getCodeSnippets } from './code-editor-snippets'
import { CodeEditorTextAreaView } from './code-editor-textarea-view'
import { handleCodeEditorKeyboardShortcuts } from './code-editor-keyboard'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/github-dark.css'
export function CodeEditorTextArea(props: any) {
  const {
    value,
    onChange,
    language = 'sql',
    height = '300px',
    placeholder,
    readOnly = false,
    theme = 'light',
    options = {},
    className = '',
  } = props
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineNumbers, setLineNumbers] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedText, setSelectedText] = useState('')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findResults, setFindResults] = useState<number[]>([])
  const [currentFindIndex, setCurrentFindIndex] = useState(0)
  const [foldedLines, setFoldedLines] = useState<Set<number>>(new Set())
  const [highlightedCode, setHighlightedCode] = useState<string>('')
  const [syntaxErrors, setSyntaxErrors] = useState<Array<{ line: number, column: number, message: string, severity: 'error' | 'warning' | 'info' }>>([])
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([])
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [autoCompletePosition, setAutoCompletePosition] = useState({ top: 0, left: 0 })
  const [currentWord, setCurrentWord] = useState('')
  const [bracketPairs, setBracketPairs] = useState<Array<{ open: number, close: number, type: string }>>([])
  const [wordOccurrences, setWordOccurrences] = useState<number[]>([])
  const [currentLineHighlight, setCurrentLineHighlight] = useState<number>(1)
  const [codeSnippets, setCodeSnippets] = useState<Array<{ trigger: string, content: string, description: string }>>([])
  const [showSnippets, setShowSnippets] = useState(false)
  const [snippetSuggestions, setSnippetSuggestions] = useState<Array<{ trigger: string, content: string, description: string }>>([])
  const highlightSyntax = useCallback((code: string, lang: string) => {
    if (!code) return ''
    try {
      const languageMap: { [key: string]: string } = {
        'sql': 'sql',
        'javascript': 'javascript',
        'js': 'javascript',
        'python': 'python',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'markdown': 'markdown',
        'md': 'markdown',
        'bash': 'bash',
        'shell': 'bash',
        'typescript': 'typescript',
        'ts': 'typescript',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'csharp': 'csharp',
        'php': 'php',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'scala': 'scala',
        'r': 'r',
        'matlab': 'matlab',
        'dart': 'dart'
      }
      const hljsLang = languageMap[lang.toLowerCase()] || 'plaintext'
      if (hljsLang === 'plaintext') {
        return code
      }
      const highlighted = hljs.highlight(code, { language: hljsLang })
      return highlighted.value
    } catch (error) {
      console.warn('Syntax highlighting failed:', error)
      return code
    }
  }, [])
  const getAutoCompleteSuggestions = useCallback((word: string, language: string) => {
    const suggestions: { [key: string]: string[] } = {
      sql: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
        'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA',
        'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN',
        'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING',
        'UNION', 'DISTINCT', 'LIMIT', 'OFFSET', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING', 'CONCAT',
        'users', 'spaces', 'data_models', 'attributes', 'entities', 'entity_types', 'values',
        'relationships', 'notifications', 'user_roles', 'space_permissions', 'data_model_spaces',
        'attribute_values', 'entity_attributes', 'model_relationships', 'space_associations'
      ],
      javascript: [
        'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
        'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this',
        'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'promise',
        'console', 'log', 'error', 'warn', 'info', 'debug', 'setTimeout', 'setInterval',
        'document', 'window', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage'
      ],
      python: [
        'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
        'import', 'from', 'as', 'return', 'yield', 'lambda', 'with', 'as', 'pass', 'break',
        'continue', 'raise', 'assert', 'del', 'global', 'nonlocal', 'and', 'or', 'not',
        'in', 'is', 'True', 'False', 'None', 'print', 'len', 'str', 'int', 'float', 'list',
        'dict', 'tuple', 'set', 'range', 'enumerate', 'zip', 'map', 'filter', 'reduce'
      ],
      html: [
        'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'div', 'span',
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table',
        'tr', 'td', 'th', 'form', 'input', 'button', 'textarea', 'select', 'option',
        'class', 'id', 'src', 'href', 'alt', 'title', 'style', 'onclick', 'onload'
      ],
      css: [
        'color', 'background', 'font', 'margin', 'padding', 'border', 'width', 'height',
        'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'opacity',
        'transform', 'transition', 'animation', 'flex', 'grid', 'float', 'clear',
        'text-align', 'text-decoration', 'line-height', 'letter-spacing', 'word-spacing'
      ]
    }
    const langSuggestions = suggestions[language.toLowerCase()] || []
    return langSuggestions.filter(suggestion =>
      suggestion.toLowerCase().startsWith(word.toLowerCase())
    ).slice(0, 10)
  }, [])
  const validateSyntax = useCallback((code: string, language: string) => {
    const errors: Array<{ line: number, column: number, message: string, severity: 'error' | 'warning' | 'info' }> = []
    if (language === 'sql') {
      const lines = code.split('\n')
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim()
        const singleQuotes = (line.match(/'/g) || []).length
        const doubleQuotes = (line.match(/"/g) || []).length
        if (singleQuotes % 2 !== 0) {
          errors.push({
            line: lineIndex + 1,
            column: line.indexOf("'") + 1,
            message: 'Unmatched single quote',
            severity: 'error'
          })
        }
        if (doubleQuotes % 2 !== 0) {
          errors.push({
            line: lineIndex + 1,
            column: line.indexOf('"') + 1,
            message: 'Unmatched double quote',
            severity: 'error'
          })
        }
        if (trimmedLine.startsWith('SELECT') && !trimmedLine.includes('FROM')) {
          errors.push({
            line: lineIndex + 1,
            column: 1,
            message: 'SELECT statement should have FROM clause',
            severity: 'warning'
          })
        }
      })
    } else if (language === 'javascript') {
      const lines = code.split('\n')
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim()
        const openBrackets = (line.match(/[{[\(]/g) || []).length
        const closeBrackets = (line.match(/[}\]\)]/g) || []).length
        if (openBrackets !== closeBrackets) {
          errors.push({
            line: lineIndex + 1,
            column: 1,
            message: 'Unmatched brackets',
            severity: 'error'
          })
        }
        if (trimmedLine && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}')) {
          if (trimmedLine.includes('=') || trimmedLine.includes('return')) {
            errors.push({
              line: lineIndex + 1,
              column: trimmedLine.length,
              message: 'Consider adding semicolon',
              severity: 'info'
            })
          }
        }
      })
    }
    return errors
  }, [])
  const findBracketPairs = useCallback((code: string) => {
    const pairs: Array<{ open: number, close: number, type: string }> = []
    const stack: Array<{ pos: number, type: string }> = []
    const bracketMap: { [key: string]: string } = {
      '(': ')',
      '[': ']',
      '{': '}',
      '<': '>'
    }
    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      if (['(', '[', '{', '<'].includes(char)) {
        stack.push({ pos: i, type: char })
      } else if ([')', ']', '}', '>'].includes(char)) {
        const lastOpen = stack.pop()
        if (lastOpen && bracketMap[lastOpen.type] === char) {
          pairs.push({
            open: lastOpen.pos,
            close: i,
            type: lastOpen.type + char
          })
        }
      }
    }
    return pairs
  }, [])
  const findWordOccurrences = useCallback((code: string, word: string) => {
    const occurrences: number[] = []
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    let match
    while ((match = regex.exec(code)) !== null) {
      occurrences.push(match.index)
    }
    return occurrences
  }, [])
  useEffect(() => {
    const lines = value.split('\n')
    const numbers = lines.map((_, index) => (index + 1).toString())
    setLineNumbers(numbers)
    const highlighted = highlightSyntax(value, language)
    setHighlightedCode(highlighted)
    if (options.enableSyntaxValidation) {
      const errors = validateSyntax(value, language)
      setSyntaxErrors(errors)
    }
    if (options.enableBracketMatching) {
      const pairs = findBracketPairs(value)
      setBracketPairs(pairs)
    }
    setCurrentLineHighlight(cursorPosition.line)
    if (options.enableSnippets) {
      const snippets = getCodeSnippets(language)
      setCodeSnippets(snippets)
    }
  }, [value, language, highlightSyntax, validateSyntax, findBracketPairs, getCodeSnippets, options.enableSyntaxValidation, options.enableBracketMatching, options.enableSnippets, cursorPosition.line])
  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const textBeforeCursor = value.substring(0, start)
      const lines = textBeforeCursor.split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1
      setCursorPosition({ line, column })
      if (start !== end) {
        setSelectedText(value.substring(start, end))
      } else {
        setSelectedText('')
      }
    }
  }
  const findTextInCode = useCallback((searchText: string) => {
    if (!searchText) {
      setFindResults([])
      setCurrentFindIndex(0)
      return
    }
    const results: number[] = []
    const lines = value.split('\n')
    let currentIndex = 0
    lines.forEach((line, lineIndex) => {
      const lineStart = currentIndex
      const lineEnd = currentIndex + line.length
      let searchIndex = line.indexOf(searchText)
      while (searchIndex !== -1) {
        results.push(lineStart + searchIndex)
        searchIndex = line.indexOf(searchText, searchIndex + 1)
      }
      currentIndex = lineEnd + 1 // +1 for newline
    })
    setFindResults(results)
    setCurrentFindIndex(0)
  }, [value])
  const replaceTextInCode = useCallback((searchText: string, replaceText: string) => {
    const newValue = value.replace(new RegExp(searchText, 'g'), replaceText)
    onChange(newValue)
    findTextInCode(searchText)
  }, [value, onChange, findTextInCode])
  const goToNextFind = () => {
    if (findResults.length > 0) {
      const nextIndex = (currentFindIndex + 1) % findResults.length
      setCurrentFindIndex(nextIndex)
      selectTextAtPosition(findResults[nextIndex], findText.length)
    }
  }
  const goToPreviousFind = () => {
    if (findResults.length > 0) {
      const prevIndex = currentFindIndex === 0 ? findResults.length - 1 : currentFindIndex - 1
      setCurrentFindIndex(prevIndex)
      selectTextAtPosition(findResults[prevIndex], findText.length)
    }
  }
  const selectTextAtPosition = (start: number, length: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(start, start + length)
    }
  }
  const toggleLineFold = (lineNumber: number) => {
    const newFoldedLines = new Set(foldedLines)
    if (newFoldedLines.has(lineNumber)) {
      newFoldedLines.delete(lineNumber)
    } else {
      newFoldedLines.add(lineNumber)
    }
    setFoldedLines(newFoldedLines)
  }
  const handleKeyboardShortcuts = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleCodeEditorKeyboardShortcuts({
      setShowFindReplace,
      setShowSnippets,
      getCodeSnippets,
      language,
      setSnippetSuggestions,
      textareaRef,
      value,
      onChange,
    }, e)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleKeyboardShortcuts(e)
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const tabSize = options.tabSize || 2
      const spaces = ' '.repeat(tabSize)
      const newValue = value.substring(0, start) + spaces + value.substring(end)
      onChange(newValue)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize
        updateCursorPosition()
      }, 0)
    } else if (e.key === 'Enter') {
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const textBeforeCursor = value.substring(0, start)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      const indent = currentLine.match(/^(\s*)/)?.[1] || ''
      setTimeout(() => {
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start)
        onChange(newValue)
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length
        updateCursorPosition()
      }, 0)
    } else if (e.key === 'ArrowDown' && showAutoComplete && autoCompleteSuggestions.length > 0) {
      e.preventDefault()
    } else if (e.key === 'ArrowUp' && showAutoComplete && autoCompleteSuggestions.length > 0) {
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setShowAutoComplete(false)
    } else if (options.enableAutoComplete && (e.key === ' ' || e.key === '.' || e.key === '(')) {
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const textBeforeCursor = value.substring(0, start)
      const words = textBeforeCursor.split(/\s+/)
      const currentWord = words[words.length - 1]
      if (currentWord.length > 1) {
        const suggestions = getAutoCompleteSuggestions(currentWord, language)
        if (suggestions.length > 0) {
          setAutoCompleteSuggestions(suggestions)
          setCurrentWord(currentWord)
          setShowAutoComplete(true)
          const rect = textarea.getBoundingClientRect()
          setAutoCompletePosition({
            top: rect.top + 20,
            left: rect.left + 10
          })
        }
      }
    } else if (options.enableSnippets && e.key === 'Tab') {
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const textBeforeCursor = value.substring(0, start)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      const matchingSnippet = codeSnippets.find(snippet =>
        currentLine.trim().endsWith(snippet.trigger)
      )
      if (matchingSnippet) {
        e.preventDefault()
        const beforeTrigger = currentLine.substring(0, currentLine.lastIndexOf(matchingSnippet.trigger))
        const afterCursor = value.substring(start)
        const newValue = value.substring(0, start - matchingSnippet.trigger.length) +
          matchingSnippet.content + afterCursor
        onChange(newValue)
        setTimeout(() => {
          textarea.focus()
          updateCursorPosition()
        }, 0)
        return
      }
    } else {
      updateCursorPosition()
    }
  }
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }
  const handleSelectionChange = () => {
    updateCursorPosition()
  }
  const getFontSize = () => {
    return options.fontSize || 14
  }
  const getFontFamily = () => {
    return options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace'
  }
  const getTabSize = () => {
    return options.tabSize || 2
  }
  const showLineNumbers = options.showLineNumbers !== false
  const isFullHeight = height === '100%'
  return (
    <CodeEditorTextAreaView
      isFullHeight={isFullHeight}
      className={className}
      language={language}
      readOnly={readOnly}
      cursorPosition={cursorPosition}
      selectedText={selectedText}
      value={value}
      lineNumbers={lineNumbers}
      options={options}
      showFindReplace={showFindReplace}
      setShowFindReplace={setShowFindReplace}
      findText={findText}
      setFindText={setFindText}
      findTextInCode={findTextInCode}
      replaceText={replaceText}
      setReplaceText={setReplaceText}
      goToPreviousFind={goToPreviousFind}
      findResults={findResults}
      goToNextFind={goToNextFind}
      currentFindIndex={currentFindIndex}
      replaceTextInCode={replaceTextInCode}
      showLineNumbers={showLineNumbers}
      lineNumbersRef={lineNumbersRef}
      getFontFamily={getFontFamily}
      getFontSize={getFontSize}
      height={height}
      syntaxErrors={syntaxErrors}
      highlightedCode={highlightedCode}
      showSnippets={showSnippets}
      snippetSuggestions={snippetSuggestions}
      textareaRef={textareaRef}
      onChange={onChange}
      updateCursorPosition={updateCursorPosition}
      setShowSnippets={setShowSnippets}
      showAutoComplete={showAutoComplete}
      autoCompleteSuggestions={autoCompleteSuggestions}
      autoCompletePosition={autoCompletePosition}
      currentWord={currentWord}
      setShowAutoComplete={setShowAutoComplete}
      getTabSize={getTabSize}
      handleKeyDown={handleKeyDown}
      handleScroll={handleScroll}
      handleSelectionChange={handleSelectionChange}
    />
  )}
