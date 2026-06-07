// @ts-nocheck
'use client'

import DOMPurify from 'dompurify'

export function CodeEditorTextAreaView(props: any) {
  const {
    isFullHeight, className, language, readOnly, cursorPosition, selectedText,
    value, lineNumbers, options, showFindReplace, setShowFindReplace, findText,
    setFindText, findTextInCode, replaceText, setReplaceText, goToPreviousFind,
    findResults, goToNextFind, currentFindIndex, replaceTextInCode, showLineNumbers,
    lineNumbersRef, getFontFamily, getFontSize, height, syntaxErrors, highlightedCode,
    showSnippets, snippetSuggestions, textareaRef, onChange, updateCursorPosition,
    setShowSnippets, showAutoComplete, autoCompleteSuggestions, autoCompletePosition,
    currentWord, setShowAutoComplete, getTabSize, handleKeyDown, handleScroll,
    handleSelectionChange,
  } = props
  return (
    <div className={`w-full ${isFullHeight ? 'h-full flex flex-col' : ''} ${className} overflow-hidden`}>
      {/* Editor Header */}
      <div className={`flex items-center justify-between px-3 py-2 text-xs border-b bg-muted border-border text-muted-foreground`}>
        <div className="flex items-center gap-4">
          <span className="font-medium">{language.toUpperCase()}</span>
          {!readOnly && (
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          )}
          {selectedText && (
            <span className="text-blue-600">{selectedText.length} chars selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{value.length} chars</span>
          <span>•</span>
          <span>{lineNumbers.length} lines</span>
          {options.enableFindReplace && (
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
            >
              Find
            </button>
          )}
        </div>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && options.enableFindReplace && (
        <div className={`px-3 py-2 border-b bg-muted border-border`}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Find..."
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                findTextInCode(e.target.value)
              }}
              className={`px-2 py-1 text-xs border border-border rounded bg-background text-foreground`}
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className={`px-2 py-1 text-xs border border-border rounded bg-background text-foreground`}
            />
            <button
              onClick={goToPreviousFind}
              disabled={findResults.length === 0}
              className="px-2 py-1 text-xs bg-muted hover:bg-accent text-foreground disabled:opacity-50 rounded"
            >
              ↑
            </button>
            <button
              onClick={goToNextFind}
              disabled={findResults.length === 0}
              className="px-2 py-1 text-xs bg-muted hover:bg-accent text-foreground disabled:opacity-50 rounded"
            >
              ↓
            </button>
            <span className="text-xs text-muted-foreground">
              {findResults.length > 0 ? `${currentFindIndex + 1}/${findResults.length}` : '0/0'}
            </span>
            <button
              onClick={() => replaceTextInCode(findText, replaceText)}
              disabled={!findText || !replaceText}
              className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 disabled:opacity-50 rounded"
            >
              Replace All
            </button>
            <button
              onClick={() => setShowFindReplace(false)}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`flex ${isFullHeight ? 'flex-1 min-h-0' : ''}`}>
        {/* Line Numbers */}
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className={`bg-muted border-r border-border text-muted-foreground px-2 py-3 text-xs select-none ${isFullHeight ? 'overflow-y-auto' : 'overflow-hidden'}`}
            style={{
              fontFamily: getFontFamily(),
              fontSize: getFontSize(),
              ...(isFullHeight ? {} : { minHeight: height }),
              width: '50px'
            }}
          >
            {lineNumbers.map((num, index) => {
              const lineNum = index + 1
              const hasError = syntaxErrors.some(error => error.line === lineNum)
              const hasWarning = syntaxErrors.some(error => error.line === lineNum && error.severity === 'warning')

              return (
                <div
                  key={index}
                  className={`text-right flex items-center justify-between ${lineNum === cursorPosition.line ? 'text-blue-600 font-medium' : ''
                    } ${hasError ? 'text-red-500' : hasWarning ? 'text-yellow-500' : ''}`}
                >
                  <span>{num}</span>
                  {hasError && <span className="text-red-500">●</span>}
                  {hasWarning && <span className="text-yellow-500">●</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Code Editor */}
        <div className={`flex-1 relative ${isFullHeight ? 'min-h-0' : ''}`}>
          {/* Syntax Highlighting Overlay */}
          <div
            className={`absolute inset-0 pointer-events-none p-0 ${isFullHeight ? 'overflow-y-auto' : 'overflow-hidden'} bg-background`}
            style={{
              fontFamily: getFontFamily(),
              fontSize: getFontSize(),
              ...(isFullHeight ? {} : { minHeight: height }),
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: options.wordWrap ? 'break-word' : 'normal'
            }}
            dangerouslySetInnerHTML={{
              __html: typeof window !== 'undefined'
                ? DOMPurify.sanitize(highlightedCode)
                : highlightedCode
            }}
          />

          {/* Code Snippets dropdown */}
          {showSnippets && options.enableSnippets && snippetSuggestions.length > 0 && (
            <div
              className={`absolute z-50 rounded-lg shadow-lg max-h-64 overflow-y-auto bg-background border border-border`}
              style={{
                top: '50px',
                left: '10px',
                minWidth: '300px'
              }}
            >
              <div className={`p-2 border-b bg-muted border-border`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium text-foreground`}>Code Snippets</span>
                  <button
                    onClick={() => setShowSnippets(false)}
                    className={`text-muted-foreground hover:text-foreground`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {snippetSuggestions.map((snippet, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 text-sm cursor-pointer border-b border-border hover:bg-accent text-foreground hover:text-accent-foreground`}
                  onClick={() => {
                    // Insert snippet
                    const textarea = textareaRef.current
                    if (textarea) {
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const newValue = value.substring(0, start) + snippet.content + value.substring(end)
                      onChange(newValue)

                      setTimeout(() => {
                        textarea.focus()
                        updateCursorPosition()
                      }, 0)
                    }
                    setShowSnippets(false)
                  }}
                >
                  <div className="font-medium">{snippet.trigger}</div>
                  <div className="text-xs text-muted-foreground">{snippet.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-completion dropdown */}
          {showAutoComplete && options.enableAutoComplete && autoCompleteSuggestions.length > 0 && (
            <div
              className={`absolute z-50 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto`}
              style={{
                top: autoCompletePosition.top,
                left: autoCompletePosition.left,
                minWidth: '200px'
              }}
            >
              {autoCompleteSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground`}
                  onClick={() => {
                    // Insert suggestion
                    const textarea = textareaRef.current
                    if (textarea) {
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const beforeCursor = value.substring(0, start - currentWord.length)
                      const afterCursor = value.substring(end)
                      const newValue = beforeCursor + suggestion + afterCursor
                      onChange(newValue)

                      setTimeout(() => {
                        textarea.focus()
                        textarea.selectionStart = textarea.selectionEnd = start - currentWord.length + suggestion.length
                        updateCursorPosition()
                      }, 0)
                    }
                    setShowAutoComplete(false)
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Error tooltips */}
          {syntaxErrors.map((error, index) => (
            <div
              key={index}
              className={`absolute z-40 px-2 py-1 text-xs rounded shadow-lg ${error.severity === 'error'
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
                  : error.severity === 'warning'
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800'
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                }`}
              style={{
                top: `${(error.line - 1) * 20 + 12}px`,
                left: `${error.column * 8 + 60}px`
              }}
            >
              {error.message}
            </div>
          ))}

          {/* Transparent textarea for input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              updateCursorPosition()
            }}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full h-full resize-none border-0 focus:ring-0 focus:outline-none p-0 relative z-10 bg-transparent text-transparent placeholder:text-muted-foreground caret-foreground`}
            style={{
              fontFamily: getFontFamily(),
              fontSize: getFontSize(),
              ...(isFullHeight ? { height: '100%' } : { minHeight: height }),
              tabSize: getTabSize(),
              wordWrap: options.wordWrap ? 'break-word' : 'normal',
              lineHeight: '1.5'
            }}
          />
        </div>
      </div>
    </div>
  )
}