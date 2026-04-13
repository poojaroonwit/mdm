/**
 * Utility to execute workflow code from Agent Builder with variable replacement
 * 
 * WARNING: Executing user-provided code is a security risk. This should only be used
 * with code from trusted sources (Agent Builder). Consider using a sandboxed environment
 * or worker process in production.
 */

// Note: We import these at runtime to avoid circular dependencies

interface ExecuteWorkflowCodeOptions {
  workflowCode: string
  apiKey: string
  workflowId: string
  input: string
  conversationHistory: any[]
}

interface WorkflowCodeResult {
  success: boolean
  output?: string
  error?: string
}

/**
 * Transform ES6 import statements to CommonJS require statements
 * This allows the code to run in a Function constructor context
 * Order matters: more specific patterns must come before general ones
 */
function transformImportsToRequires(code: string): string {
  let transformedCode = code
  
  // Transform default + named imports FIRST (most specific): import X, { Y, Z } from 'module'
  transformedCode = transformedCode.replace(
    /import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g,
    (match, defaultImport, namedImports, moduleName) => {
      const importList = namedImports.split(',').map((imp: string) => imp.trim()).join(', ')
      return `const ${defaultImport} = require('${moduleName}');\nconst { ${importList} } = require('${moduleName}');`
    }
  )
  
  // Transform namespace imports: import * as X from 'module'
  transformedCode = transformedCode.replace(
    /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g,
    (match, namespaceName, moduleName) => {
      return `const ${namespaceName} = require('${moduleName}');`
    }
  )
  
  // Transform named imports: import { X, Y } from 'module'
  transformedCode = transformedCode.replace(
    /import\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g,
    (match, imports, moduleName) => {
      const importList = imports.split(',').map((imp: string) => imp.trim()).join(', ')
      return `const { ${importList} } = require('${moduleName}');`
    }
  )
  
  // Transform default imports: import X from 'module' (must come after default+named)
  transformedCode = transformedCode.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g,
    (match, importName, moduleName) => {
      return `const ${importName} = require('${moduleName}');`
    }
  )
  
  // Transform side-effect imports LAST (most general): import 'module'
  // This must come last to avoid matching other import patterns
  // Pattern matches: import 'module' or import "module" (no identifier before the quotes)
  transformedCode = transformedCode.replace(
    /import\s+(?![*{a-zA-Z])['"]([^'"]+)['"];?/g,
    (match, moduleName) => {
      return `require('${moduleName}');`
    }
  )
  
  return transformedCode
}

/**
 * Transform ES6 export statements to CommonJS module.exports
 * This allows the code to run in a Function constructor context
 */
function transformExportsToModuleExports(code: string): string {
  let transformedCode = code
  
  // Transform: export { name1, name2 } from 'module' (must come first to avoid conflicts)
  transformedCode = transformedCode.replace(
    /export\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g,
    (match, exports, moduleName) => {
      // This is a re-export, we'll just require the module
      return `const _reexport = require('${moduleName}');\nmodule.exports = _reexport;`
    }
  )
  
  // Transform: export { name1, name2 }
  transformedCode = transformedCode.replace(
    /export\s*\{([^}]+)\};?/g,
    (match, exports) => {
      const exportList = exports.split(',').map((exp: string) => {
        const trimmed = exp.trim()
        // Handle "name as alias" syntax
        if (trimmed.includes(' as ')) {
          const [original, alias] = trimmed.split(' as ').map(s => s.trim())
          return `${original}: ${original}`
        }
        return `${trimmed}: ${trimmed}`
      }).join(', ')
      return `module.exports = { ${exportList} };`
    }
  )
  
  // Transform named exports: export function/const/class Name
  transformedCode = transformedCode.replace(
    /export\s+(function|const|class|async\s+function|let|var)\s+(\w+)/g,
    (match, keyword, name) => {
      return `${keyword} ${name}`
    }
  )
  
  // Transform: export default function/const/class Name
  // This handles: export default function runWorkflow(...) { ... }
  transformedCode = transformedCode.replace(
    /export\s+default\s+(function|const|class|async\s+function)\s+(\w+)/g,
    (match, keyword, name) => {
      return `${keyword} ${name}`
    }
  )
  
  // Transform default exports of objects: export default { ... }
  // This must come after function/const/class to avoid matching those
  transformedCode = transformedCode.replace(
    /export\s+default\s+(\{[\s\S]*?\});?/g,
    (match, obj) => {
      return `module.exports = ${obj};`
    }
  )
  
  // Transform: export default <identifier> (like export default Start)
  // This handles cases like: export default Start; or export default SomeVariable;
  transformedCode = transformedCode.replace(
    /export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*;?/g,
    (match, identifier) => {
      return `module.exports = ${identifier};`
    }
  )
  
  // Transform: export default <expression>
  // This is a catch-all for other default exports (like export default someVariable)
  // We need to be careful not to match multi-line expressions incorrectly
  // Match export default followed by an identifier or expression ending with semicolon or newline
  transformedCode = transformedCode.replace(
    /export\s+default\s+([^;{]+);?$/gm,
    (match, expr) => {
      const trimmed = expr.trim()
      // Skip if it's already been handled (starts with function/const/class or is just an identifier)
      if (/^(function|const|class|async\s+function|let|var)\s+/.test(trimmed) || /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) {
        return match
      }
      // Otherwise, assign to module.exports
      return `module.exports = ${trimmed};`
    }
  )
  
  // Remove any remaining standalone export default statements
  transformedCode = transformedCode.replace(/export\s+default\s*;?/g, '')
  
  return transformedCode
}

/**
 * Replace variables in workflow code with actual values
 * Only replaces workflow ID and API key - everything else is used as-is
 */
function replaceVariables(code: string, variables: Record<string, string>): string {
  let replacedCode = code
  
  // Replace all process.env.OPENAI_API_KEY patterns with actual API key
  if (variables.OPENAI_API_KEY) {
    // Replace various patterns:
    // - process.env.OPENAI_API_KEY
    // - process.env['OPENAI_API_KEY']
    // - process.env["OPENAI_API_KEY"]
    replacedCode = replacedCode.replace(
      /process\.env\.OPENAI_API_KEY|process\.env\['OPENAI_API_KEY'\]|process\.env\["OPENAI_API_KEY"\]/g,
      `"${variables.OPENAI_API_KEY}"`
    )
  }
  
  // Replace workflow_id if needed (in traceMetadata)
  if (variables.workflow_id) {
    // Replace workflow_id in traceMetadata (various quote styles)
    replacedCode = replacedCode.replace(
      /workflow_id:\s*"wf_[^"]*"/g,
      `workflow_id: "${variables.workflow_id}"`
    )
    replacedCode = replacedCode.replace(
      /workflow_id:\s*'wf_[^']*'/g,
      `workflow_id: "${variables.workflow_id}"`
    )
    replacedCode = replacedCode.replace(
      /workflow_id:\s*`wf_[^`]*`/g,
      `workflow_id: "${variables.workflow_id}"`
    )
  }
  
  return replacedCode
}

/**
 * Execute workflow code with variable replacement
 * 
 * This function uses Node.js vm module to execute code directly without temporary files.
 * The workflow code should export a runWorkflow function.
 */
export async function executeWorkflowCode(options: ExecuteWorkflowCodeOptions): Promise<WorkflowCodeResult> {
  const { workflowCode, apiKey, workflowId, input, conversationHistory } = options

  try {
    // First, transform ES6 exports to CommonJS module.exports
    const codeWithoutExports = transformExportsToModuleExports(workflowCode)
    
    // Then transform ES6 imports to CommonJS requires
    const codeWithRequires = transformImportsToRequires(codeWithoutExports)
    
    // Then replace variables in the code
    const replacedCode = replaceVariables(codeWithRequires, {
      OPENAI_API_KEY: apiKey,
      workflow_id: workflowId,
    })

    // Set environment variable for the code execution
    const originalApiKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = apiKey

    try {
      // Use Function constructor to execute code directly (no temp files, no vm module issues)
      // This is safer than eval and doesn't require file system access
      const moduleExports: any = {}
      
      // Create a require function that provides access to needed modules
      const customRequire = (moduleName: string) => {
        if (moduleName === '@openai/agents') {
          return require('@openai/agents')
        }
        if (moduleName === 'openai') {
          return require('openai')
        }
        if (moduleName === '@openai/guardrails') {
          return require('@openai/guardrails')
        }
        if (moduleName === 'zod') {
          return require('zod')
        }
        // For other modules, use standard require
        return require(moduleName)
      }

      // Wrap the code in an IIFE that sets up the environment
      // The code should already have require() statements from transformImportsToRequires
      // We don't redeclare variables here to avoid conflicts with the transformed imports
      const wrappedCode = `(function(require) {
        const module = { exports: {} };
        const exports = module.exports;
        
        // The workflow code should already have all necessary imports transformed to require() statements
        // We don't redeclare them here to avoid "already declared" errors
        
        ${replacedCode}
        
        // Export runWorkflow
        if (typeof runWorkflow !== 'undefined') {
          module.exports = { runWorkflow };
        } else {
          throw new Error('runWorkflow function not found in workflow code');
        }
        
        return module.exports;
      })`

      // Execute the wrapped code using Function constructor
      // Add better error handling to see what's wrong
      let moduleFactory: any
      try {
        moduleFactory = new Function('return ' + wrappedCode)()
      } catch (syntaxError) {
        // Log detailed information about the error for debugging
        const errorMessage = syntaxError instanceof Error ? syntaxError.message : String(syntaxError)
        
        // Try to find where "Start" appears in the code
        const startIndex = replacedCode.indexOf('Start')
        const contextStart = Math.max(0, startIndex - 200)
        const contextEnd = Math.min(replacedCode.length, startIndex + 200)
        const contextSnippet = startIndex >= 0 
          ? replacedCode.substring(contextStart, contextEnd)
          : replacedCode.substring(0, 1000)
        
        // Also check the wrapped code
        const wrappedStartIndex = wrappedCode.indexOf('Start')
        const wrappedContextStart = Math.max(0, wrappedStartIndex - 200)
        const wrappedContextEnd = Math.min(wrappedCode.length, wrappedStartIndex + 200)
        const wrappedContextSnippet = wrappedStartIndex >= 0
          ? wrappedCode.substring(wrappedContextStart, wrappedContextEnd)
          : wrappedCode.substring(0, 1000)
        
        console.error('WorkflowCodeExecutor: Syntax error in wrapped code', {
          error: errorMessage,
          errorStack: syntaxError instanceof Error ? syntaxError.stack : undefined,
          codeLength: replacedCode.length,
          wrappedCodeLength: wrappedCode.length,
          startIndexInCode: startIndex >= 0 ? startIndex : 'not found',
          contextSnippet: contextSnippet,
          wrappedContextSnippet: wrappedContextSnippet,
          first500Chars: replacedCode.substring(0, 500),
          last500Chars: replacedCode.substring(Math.max(0, replacedCode.length - 500)),
        })
        throw new Error(`Syntax error in workflow code: ${errorMessage}. Check the workflow code for syntax issues.`)
      }
      
      let moduleResult: any
      try {
        moduleResult = moduleFactory(customRequire)
      } catch (execError) {
        const errorMessage = execError instanceof Error ? execError.message : String(execError)
        console.error('WorkflowCodeExecutor: Execution error', {
          error: errorMessage,
          stack: execError instanceof Error ? execError.stack : undefined,
        })
        throw execError
      }

      // Get the runWorkflow function
      const runWorkflow = moduleResult?.runWorkflow || moduleExports.runWorkflow

      if (!runWorkflow || typeof runWorkflow !== 'function') {
        throw new Error('runWorkflow function not found or not exported')
      }

      // Execute the workflow
      console.log('WorkflowCodeExecutor: Executing runWorkflow', {
        inputLength: input.length,
        hasHistory: conversationHistory && conversationHistory.length > 0,
        historyLength: conversationHistory?.length || 0,
      })

      const result = await runWorkflow({
        input_as_text: input,
      })

      console.log('WorkflowCodeExecutor: runWorkflow completed', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
      })

      // Extract the output from the result
      let output = ''
      if (result) {
        if (typeof result === 'string') {
          output = result
        } else if (result.output_text) {
          output = result.output_text
        } else if (result.finalOutput) {
          output = typeof result.finalOutput === 'string' ? result.finalOutput : JSON.stringify(result.finalOutput)
        } else if (result.response) {
          output = typeof result.response === 'string' ? result.response : JSON.stringify(result.response)
        } else if (result.message) {
          output = typeof result.message === 'string' ? result.message : JSON.stringify(result.message)
        } else if (result.text) {
          output = typeof result.text === 'string' ? result.text : JSON.stringify(result.text)
        } else if (result.output) {
          output = typeof result.output === 'string' ? result.output : JSON.stringify(result.output)
        } else {
          // Try to extract text from any nested structure
          const stringified = JSON.stringify(result)
          output = stringified
        }
      }

      console.log('WorkflowCodeExecutor: Extracted output', {
        outputLength: output.length,
        outputPreview: output.substring(0, 100),
      })

      return {
        success: true,
        output,
      }
    } finally {
      // Restore original API key
      if (originalApiKey !== undefined) {
        process.env.OPENAI_API_KEY = originalApiKey
      } else {
        delete process.env.OPENAI_API_KEY
      }
    }
  } catch (error) {
    console.error('Error executing workflow code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error executing workflow code',
    }
  }
}

