'use client'

import { useState, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
// @ts-ignore - Type definitions may not be available but package is installed
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle, Info, Code2, Save, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { useThemeSafe } from '@/hooks/use-theme-safe'
import toast from 'react-hot-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface WorkflowCodeModalProps {
  value: string
  onChange: (value: string) => void
  apiKey?: string
  workflowId?: string
  chatbotId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
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
    errors.push('Missing required function: runWorkflow. The code must export a runWorkflow function.')
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
      warnings.push(`Missing import: ${imp.name}. This may be required for the workflow to function.`)
    }
  })

  // Check for syntax errors (basic validation)
  try {
    // Try to parse as JavaScript (basic check)
    // We'll use a simple check - if it has balanced braces
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
    // Ignore parsing errors for now
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

export function WorkflowCodeModal({ value, onChange, apiKey, workflowId, chatbotId, open, onOpenChange }: WorkflowCodeModalProps) {
  const { isDark } = useThemeSafe()
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)

  // Detect variables and validate code
  const validation = useMemo(() => {
    const baseValidation = validateWorkflowCode(value)
    const variables = detectVariables(value, apiKey, workflowId)
    
    return {
      ...baseValidation,
      detectedVariables: variables,
    }
  }, [value, apiKey, workflowId])

  // Save workflow code to database
  const handleSave = async () => {
    if (!chatbotId) {
      toast.error('Chatbot ID is required to save workflow code')
      return
    }

    if (!value || !value.trim()) {
      toast.error('Please enter workflow code before saving')
      return
    }

    if (!validation.isValid) {
      toast.error('Please fix validation errors before saving')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiAgentSdkWorkflowCode: value,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save workflow code')
      }

      toast.success('Workflow code saved successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving workflow code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save workflow code')
    } finally {
      setIsSaving(false)
    }
  }

  // Clear workflow code
  const handleClear = async () => {
    if (!chatbotId) {
      toast.error('Chatbot ID is required to clear workflow code')
      return
    }

    if (!confirm('Are you sure you want to clear the workflow code? This action cannot be undone.')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiAgentSdkWorkflowCode: null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clear workflow code')
      }

      onChange('')
      toast.success('Workflow code cleared successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error clearing workflow code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to clear workflow code')
    } finally {
      setIsClearing(false)
    }
  }

  // Resync workflow code from database
  const handleResync = async () => {
    if (!chatbotId) {
      toast.error('Chatbot ID is required to resync workflow code')
      return
    }

    setIsResyncing(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch workflow code')
      }

      const data = await response.json()
      const chatbot = data.chatbot
      
      // Get workflow code from the merged chatbot object (already decrypted by API)
      // The API merges version config into the chatbot object, so workflow code is at the top level
      const workflowCode = chatbot?.openaiAgentSdkWorkflowCode || ''

      if (workflowCode) {
        onChange(workflowCode)
        toast.success('Workflow code resynced from database')
      } else {
        onChange('')
        toast('No workflow code found in database', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error('Error resyncing workflow code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to resync workflow code')
    } finally {
      setIsResyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Workflow Code Editor
          </DialogTitle>
          <DialogDescription>
            Paste your workflow code from Agent Builder. The platform will automatically replace variables like process.env.OPENAI_API_KEY with your actual API key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Code Editor */}
          <div className="space-y-2">
            <Label>Workflow Code</Label>
            <div className="border rounded-lg overflow-hidden">
              <CodeMirror
                value={value}
                onChange={(val) => onChange(val)}
                height="400px"
                extensions={[javascript({ jsx: false, typescript: false })]}
                theme={isDark ? oneDark : undefined}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: false,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightSelectionMatches: true,
                }}
              />
            </div>
          </div>

          {/* Validation Panel */}
          {value && value.trim() && (
            <div className="space-y-4">
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

              {/* Detected Variables Table */}
              {validation.detectedVariables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Detected Variables</Label>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variable</TableHead>
                          <TableHead>Pattern</TableHead>
                          <TableHead>Line</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Replacement Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validation.detectedVariables.map((variable, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{variable.name}</TableCell>
                            <TableCell className="font-mono text-xs">{variable.pattern}</TableCell>
                            <TableCell>{variable.lineNumber || '-'}</TableCell>
                            <TableCell>
                              {variable.willBeReplaced ? (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Will Replace
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  Missing Value
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {variable.replacementValue || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Validation Table */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Code Validation</Label>
                <div className="border rounded-lg">
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
                        <TableCell>runWorkflow Function</TableCell>
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
                        <TableCell>Required Imports</TableCell>
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
                        <TableCell>Syntax Validation</TableCell>
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

              {/* Errors */}
              {validation.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4 mt-0.5" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Warnings:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResync}
              disabled={isResyncing || isSaving || isClearing}
            >
              {isResyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resyncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resync
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isClearing || isSaving || isResyncing}
            >
              {isClearing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </>
              )}
            </Button>
          </div>
          <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isClearing || isResyncing || !validation.isValid}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

