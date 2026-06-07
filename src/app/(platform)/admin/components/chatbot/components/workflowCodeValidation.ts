export interface DetectedVariable {
  name: string
  pattern: string
  willBeReplaced: boolean
  replacementValue?: string
  lineNumber?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  detectedVariables: DetectedVariable[]
  hasRunWorkflow: boolean
  hasRequiredImports: boolean
  missingImports: string[]
}

export function detectVariables(code: string, apiKey?: string, workflowId?: string): DetectedVariable[] {
  const variables: DetectedVariable[] = []
  const lines = code.split('\n')
  const detected = new Set<string>()

  lines.forEach((line, index) => {
    const envVarPatterns = [
      /process\.env\.OPENAI_API_KEY/g,
      /process\.env\['OPENAI_API_KEY'\]/g,
      /process\.env\["OPENAI_API_KEY"\]/g,
    ]

    envVarPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        const key = `env_OPENAI_API_KEY_${index}`
        if (!detected.has(key)) {
          detected.add(key)
          variables.push({
            name: 'OPENAI_API_KEY',
            pattern: 'process.env.OPENAI_API_KEY',
            willBeReplaced: !!apiKey,
            replacementValue: apiKey ? `"${apiKey.substring(0, 10)}..."` : undefined,
            lineNumber: index + 1,
          })
        }
      }
    })

    const workflowIdPatterns = [
      /workflow_id:\s*"wf_[^"]*"/g,
      /workflow_id:\s*'wf_[^']*'/g,
      /workflow_id:\s*`wf_[^`]*`/g,
    ]

    workflowIdPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        const key = `workflow_id_${index}`
        if (!detected.has(key)) {
          detected.add(key)
          variables.push({
            name: 'workflow_id',
            pattern: 'workflow_id (in traceMetadata)',
            willBeReplaced: !!workflowId,
            replacementValue: workflowId || undefined,
            lineNumber: index + 1,
          })
        }
      }
    })
  })

  return variables.filter((v, i, self) =>
    i === self.findIndex(t => t.name === v.name && t.lineNumber === v.lineNumber)
  )
}

export function validateWorkflowCode(code: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const detectedVariables: DetectedVariable[] = []

  if (!code || !code.trim()) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      detectedVariables: [],
      hasRunWorkflow: false,
      hasRequiredImports: false,
      missingImports: [],
    }
  }

  const hasRunWorkflow = /(?:export\s+)?(?:const|async\s+function|function)\s+runWorkflow\s*[=:]\s*async\s*\(/.test(code) ||
                         /export\s+(?:const|async\s+function|function)\s+runWorkflow/.test(code)

  if (!hasRunWorkflow) {
    errors.push('Missing required function: runWorkflow. The code must export a runWorkflow function.')
  }

  const requiredImports = [
    { name: '@openai/agents', pattern: /from\s+['"]@openai\/agents['"]|require\(['"]@openai\/agents['"]\)/ },
    { name: 'openai', pattern: /from\s+['"]openai['"]|require\(['"]openai['"]\)/ },
  ]

  const missingImports: string[] = []
  requiredImports.forEach(imp => {
    if (!imp.pattern.test(code)) {
      missingImports.push(imp.name)
      warnings.push(`Missing import: ${imp.name}. This may be required for the workflow to function.`)
    }
  })

  try {
    const openBraces = (code.match(/{/g) || []).length
    const closeBraces = (code.match(/}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces detected. Please check your code syntax.')
    }

    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses detected. Please check your code syntax.')
    }
  } catch (e) {
    // Ignore parsing errors for this lightweight validation pass.
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedVariables,
    hasRunWorkflow,
    hasRequiredImports: missingImports.length === 0,
    missingImports,
  }
}
