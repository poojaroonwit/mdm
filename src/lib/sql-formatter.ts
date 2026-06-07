/**
 * SQL Query Formatter/Beautifier
 * Formats SQL queries with proper indentation and line breaks
 */

export function formatSQL(query: string): string {
  if (!query || !query.trim()) return query

  const formatted = query.trim()
  let indentLevel = 0
  const indentSize = 2
  const result: string[] = []
  let currentLine = ''
  let inString = false
  let stringChar = ''
  const i = 0

  // SQL keywords that should be on new line
  const keywordsStartLine = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 
                            'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT', 'GROUP BY', 'ORDER BY', 'HAVING', 
                            'INSERT INTO', 'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE']
  
  // SQL keywords that increase indent
  const indentKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN',
                          'GROUP BY', 'ORDER BY', 'HAVING', 'CASE', 'WHEN', 'IF']
  
  // SQL keywords that decrease indent (after closing)
  const deindentKeywords = ['END', 'ELSE']

  const isKeyword = (word: string): boolean => {
    const upperWord = word.toUpperCase().trim()
    return keywordsStartLine.includes(upperWord) || indentKeywords.includes(upperWord) || deindentKeywords.includes(upperWord)
  }

  const getIndent = (level: number): string => {
    return ' '.repeat(level * indentSize)
  }

  // Simple tokenizer
  const tokens: string[] = []
  let token = ''
  
  for (let j = 0; j < formatted.length; j++) {
    const char = formatted[j]
    
    if ((char === "'" || char === '"') && (j === 0 || formatted[j - 1] !== '\\')) {
      if (token) {
        tokens.push(token)
        token = ''
      }
      tokens.push(char)
      inString = !inString
      stringChar = inString ? char : ''
    } else if (inString) {
      token += char
    } else if (/\s/.test(char)) {
      if (token) {
        tokens.push(token)
        token = ''
      }
      tokens.push(char)
    } else if (/[(),;]/.test(char)) {
      if (token) {
        tokens.push(token)
        token = ''
      }
      tokens.push(char)
    } else {
      token += char
    }
  }
  
  if (token) tokens.push(token)

  // Process tokens
  inString = false
  let prevToken = ''
  
  for (const token of tokens) {
    const upperToken = token.toUpperCase().trim()
    
    if (token === "'" || token === '"') {
      inString = !inString
      currentLine += token
      continue
    }
    
    if (inString) {
      currentLine += token
      continue
    }

    // Handle deindent keywords
    if (deindentKeywords.includes(upperToken)) {
      if (indentLevel > 0) indentLevel--
    }

    // Handle commas
    if (token === ',') {
      currentLine += token
      result.push(currentLine.trim())
      currentLine = getIndent(indentLevel + 1)
      continue
    }

    // Handle parentheses
    if (token === '(') {
      if (currentLine.trim()) {
        result.push(currentLine.trim())
      }
      result.push(getIndent(indentLevel) + token)
      indentLevel++
      currentLine = getIndent(indentLevel)
      continue
    }

    if (token === ')') {
      if (currentLine.trim()) {
        result.push(currentLine.trim())
      }
      indentLevel = Math.max(0, indentLevel - 1)
      currentLine = getIndent(indentLevel) + token
      continue
    }

    // Handle semicolons (end of statement)
    if (token === ';') {
      currentLine += token
      result.push(currentLine.trim())
      currentLine = ''
      indentLevel = 0
      continue
    }

    // Handle keywords that should start a new line
    if (isKeyword(upperToken) && currentLine.trim() && !prevToken.match(/^[\(\[]$/)) {
      result.push(currentLine.trim())
      currentLine = getIndent(indentLevel)
    }

    // Increase indent for certain keywords
    if (indentKeywords.includes(upperToken) && !result.length) {
      currentLine = getIndent(indentLevel)
    }

    // Add token to current line
    if (currentLine && !currentLine.endsWith(' ')) {
      currentLine += ' '
    }
    currentLine += token

    // Handle keywords that increase indent after them
    if (indentKeywords.includes(upperToken) && ['SELECT', 'FROM', 'WHERE'].includes(upperToken)) {
      indentLevel++
    }

    prevToken = token
  }

  if (currentLine.trim()) {
    result.push(currentLine.trim())
  }

  // Clean up: remove empty lines, fix spacing
  return result
    .filter(line => line.trim())
    .map(line => {
      // Fix multiple spaces
      return line.replace(/\s+/g, ' ').trim()
    })
    .join('\n')
}

/**
 * Compact SQL formatter (single line with minimal formatting)
 */
export function compactSQL(query: string): string {
  if (!query || !query.trim()) return query
  
  return query
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),;])\s*/g, '$1')
    .replace(/\s*=\s*/g, '=')
    .replace(/\s*,\s*/g, ', ')
    .trim()
}

