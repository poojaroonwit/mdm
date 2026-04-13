'use client'

import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface WorkflowCodeValidationTableProps {
  code: string
  apiKey?: string
  workflowId?: string
}

interface DetectedVariable {
  name: string
  pattern: string
  willBeReplaced: boolean
  replacementValue?: string
  lineNumber?: number
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  detectedVariables: DetectedVariable[]
  hasRunWorkflow: boolean
  hasRequiredImports: boolean
  missingImports: string[]
}

/**
 * Detect variables in workflow code that will be replaced
 * Only detects workflow ID and API key - everything else is used as-is
 */
function detectVariables(code: string, apiKey?: string, workflowId?: string): DetectedVariable[] {
  if (!code || !code.trim()) return []
  
  const variables: DetectedVariable[] = []
  const lines = code.split('\n')
  const detected = new Set<string>() // Track detected variables to avoid duplicates

  lines.forEach((line, index) => {
    // 1. Detect process.env.OPENAI_API_KEY (only this specific env var)
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

    // 2. Detect workflow_id in traceMetadata
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

  // Remove duplicates based on name and line number
  return variables.filter((v, i, self) => 
    i === self.findIndex(t => t.name === v.name && t.lineNumber === v.lineNumber)
  )
}

/**
 * Validate workflow code
 */
function validateWorkflowCode(code: string): ValidationResult {
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

  // Check for runWorkflow function
  const hasRunWorkflow = /(?:export\s+)?(?:const|async\s+function|function)\s+runWorkflow\s*[=:]\s*async\s*\(/.test(code) ||
                         /export\s+(?:const|async\s+function|function)\s+runWorkflow/.test(code)

  if (!hasRunWorkflow) {
    errors.push('Missing required function: runWorkflow')
  }

  // Check for required imports
  const requiredImports = [
    { name: '@openai/agents', pattern: /from\s+['"]@openai\/agents['"]|require\(['"]@openai\/agents['"]\)/ },
    { name: 'openai', pattern: /from\s+['"]openai['"]|require\(['"]openai['"]\)/ },
  ]

  const missingImports: string[] = []
  requiredImports.forEach(imp => {
    if (!imp.pattern.test(code)) {
      missingImports.push(imp.name)
      warnings.push(`Missing import: ${imp.name}`)
    }
  })

  // Check for syntax errors (basic validation)
  const openBraces = (code.match(/{/g) || []).length
  const closeBraces = (code.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces')
  }

  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses')
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

export function WorkflowCodeValidationTable({ code, apiKey, workflowId }: WorkflowCodeValidationTableProps) {
  const validation = useMemo(() => {
    const baseValidation = validateWorkflowCode(code)
    const variables = detectVariables(code, apiKey, workflowId)
    
    return {
      ...baseValidation,
      detectedVariables: variables,
    }
  }, [code, apiKey, workflowId])

  if (!code || !code.trim()) {
    return null
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Workflow Code Validation</Label>
      
      {/* Overall Status */}
      <Alert variant={validation.isValid ? "default" : "destructive"}>
        <div className="flex items-start gap-2">
          {validation.isValid ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 mt-0.5" />
          )}
          <AlertDescription>
            {validation.isValid ? (
              <span className="text-green-700 dark:text-green-400">Code is valid and ready to use</span>
            ) : (
              <span>Code has errors that need to be fixed</span>
            )}
          </AlertDescription>
        </div>
      </Alert>

      {/* Validation Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">runWorkflow Function</TableCell>
              <TableCell>
                {validation.hasRunWorkflow ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Found
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    Missing
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {validation.hasRunWorkflow 
                  ? 'Required function is present' 
                  : 'The code must export a runWorkflow function'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Required Imports</TableCell>
              <TableCell>
                {validation.hasRequiredImports ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Missing
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {validation.hasRequiredImports 
                  ? 'All required imports are present' 
                  : `Missing: ${validation.missingImports.join(', ')}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Syntax Validation</TableCell>
              <TableCell>
                {validation.errors.length === 0 ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    Errors Found
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {validation.errors.length === 0 
                  ? 'No syntax errors detected' 
                  : validation.errors.join('; ')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
