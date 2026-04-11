/**
 * Workflow Code Executor - SIMPLEST APPROACH
 * 
 * SECURITY: This is SERVER-SIDE ONLY
 * - Workflow code is NEVER sent to the client
 * - Code is stored in database (encrypted) - server-side only
 * - Code is loaded from database at runtime - server-side only
 * - Code is executed server-side - never exposed to client
 * - Only the OUTPUT is returned to client - never the code itself
 * 
 * Simple Approach:
 * 1. Replace variables (API key, workflow ID)
 * 2. Write to temp file as ES module (.mjs)
 * 3. Import using dynamic import()
 * 4. Execute runWorkflow function
 * 5. Cleanup temp file
 */

import { query } from './db'
import { getGlobalOpenAIApiKey } from './openai-config'

interface ExecuteWorkflowCodeOptions {
  workflowCode: string
  workflowId: string
  apiKey: string
  input: string
  conversationHistory: any[]
}

interface WorkflowCodeResult {
  success: boolean
  output?: string
  error?: string
  records_processed?: number
  records_updated?: number
}

interface ExecuteWorkflowResult {
  success: boolean
  records_processed?: number
  records_updated?: number
  error?: string
}

/**
 * Execute workflow code - SIMPLEST APPROACH
 * Just replace variables, write to temp file, import as ES module, execute, cleanup
 */
export async function executeWorkflowCode(
  options: ExecuteWorkflowCodeOptions
): Promise<WorkflowCodeResult> {
  const { workflowCode, workflowId, apiKey, input, conversationHistory } = options

        try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const os = await import('os')
    const { pathToFileURL } = await import('url')
    
    // Step 1: Simple variable replacement only
    let code = workflowCode
    code = code.replace(/process\.env\.OPENAI_API_KEY/g, `"${apiKey.replace(/"/g, '\\"')}"`)
    code = code.replace(/process\.env\['OPENAI_API_KEY'\]/g, `"${apiKey.replace(/"/g, '\\"')}"`)
    code = code.replace(/process\.env\["OPENAI_API_KEY"\]/g, `"${apiKey.replace(/"/g, '\\"')}"`)
    code = code.replace(/workflow_id:\s*"wf_[^"]*"/g, `workflow_id: "${workflowId}"`)
    code = code.replace(/workflow_id:\s*'wf_[^']*'/g, `workflow_id: "${workflowId}"`)
    
    // Step 2: Write to temp file
    const tempFile = path.join(os.tmpdir(), `workflow-${Date.now()}.mjs`)
    await fs.writeFile(tempFile, code, 'utf-8')
    
    try {
      // Step 3: Import as ES module
      // Dynamic import with expression is intentional for workflow code execution
      // This allows loading user-provided workflow code at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = await import(/* @vite-ignore */ /* webpackIgnore: true */ pathToFileURL(tempFile).href)
      
      // Step 4: Get runWorkflow function
      const runWorkflow = module.default || module.runWorkflow
      if (!runWorkflow || typeof runWorkflow !== 'function') {
        throw new Error(`runWorkflow not found. Exports: ${Object.keys(module).join(', ')}`)
      }
      
      // Step 5: Execute
      const result = await runWorkflow({ input_as_text: input })
      
      // Step 6: Extract output
      const output = typeof result === 'string' 
        ? result 
        : result?.output_text || result?.finalOutput || result?.response || result?.message || JSON.stringify(result)
      
      return { success: true, output: String(output) }
    } finally {
      // Step 7: Cleanup
      await fs.unlink(tempFile).catch(() => {})
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Execute workflow by ID - wrapper function that loads workflow from database
 */
export async function executeWorkflow(workflowId: string): Promise<ExecuteWorkflowResult> {
  try {
    // Load workflow from database
    const workflowResult = await query(
      `SELECT id, name, code, api_key FROM public.workflows WHERE id = $1::uuid AND is_active = true`,
      [workflowId]
    )

    if (workflowResult.rows.length === 0) {
      return {
        success: false,
        error: 'Workflow not found or inactive'
      }
    }

    const workflow = workflowResult.rows[0]
    const workflowCode = workflow.code || ''
    const apiKey = workflow.api_key || await getGlobalOpenAIApiKey() || ''

    if (!workflowCode) {
      return {
        success: false,
        error: 'Workflow code is empty'
      }
    }

    // Execute workflow code
    const result = await executeWorkflowCode({
      workflowCode,
      workflowId: workflow.id,
      apiKey,
      input: '',
      conversationHistory: []
    })

    return {
      success: result.success,
      records_processed: result.success ? 1 : 0,
      records_updated: result.success ? 1 : 0,
      error: result.error
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
