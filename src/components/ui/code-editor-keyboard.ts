// @ts-nocheck
import React from 'react'

export function handleCodeEditorKeyboardShortcuts(ctx: any, e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const {
    setShowFindReplace,
    setShowSnippets,
    getCodeSnippets,
    language,
    setSnippetSuggestions,
    textareaRef,
    value,
    onChange,
  } = ctx
    // Ctrl+F for find
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault()
      setShowFindReplace(true)
      return
    }

    // Ctrl+H for find and replace
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault()
      setShowFindReplace(true)
      return
    }

    // Ctrl+Shift+P for snippets
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      setShowSnippets(true)
      const snippets = getCodeSnippets(language)
      setSnippetSuggestions(snippets)
      return
    }

    // Ctrl+A for select all
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      if (textareaRef.current) {
        textareaRef.current.select()
      }
      return
    }

    // Ctrl+Z for undo (basic implementation)
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      // Note: This is a basic implementation. For full undo/redo, you'd need a history stack
      return
    }

    // Ctrl+Y for redo
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault()
      return
    }

    // Ctrl+D for duplicate line
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const newValue = value.substring(0, end) + selectedText + value.substring(end)
      onChange(newValue)
      return
    }
}