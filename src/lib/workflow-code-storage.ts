/**
 * Utility to store and retrieve workflow code from MinIO
 * This avoids the complexity of transforming ES6 code inline
 * 
 * SERVER-ONLY: This file uses Node.js APIs and must only be used on the server
 */

import { writeFile, readFile, unlink, mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { createHash } from 'crypto'

interface MinIOConfig {
  endpoint: string
  access_key: string
  secret_key: string
  bucket: string
  region: string
  use_ssl: boolean
}

/**
 * Get MinIO client from environment or default config
 * Uses dynamic import to avoid bundling issues
 */
async function getMinIOClient() {
  const { Client: MinioClient } = await import('minio')
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
  const endpointUrl = new URL(endpoint)
  const port = endpointUrl.port ? parseInt(endpointUrl.port) : (endpointUrl.protocol === 'https:' ? 443 : 80)
  const useSSL = endpointUrl.protocol === 'https:' || process.env.MINIO_USE_SSL === 'true'

  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in .env')
  }

  return new MinioClient({
    endPoint: endpointUrl.hostname,
    port,
    useSSL,
    accessKey,
    secretKey,
    region: process.env.MINIO_REGION || 'us-east-1'
  })
}

/**
 * Store workflow code in MinIO
 */
export async function storeWorkflowCode(
  workflowId: string,
  code: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const client = await getMinIOClient()
    const bucket = process.env.MINIO_BUCKET || 'attachments'
    const objectName = `workflows/${workflowId}.js`

    // Ensure bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      await client.makeBucket(bucket, process.env.MINIO_REGION || 'us-east-1')
    }

    // Upload workflow code
    const buffer = Buffer.from(code, 'utf-8')
    await client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': 'application/javascript',
      'Content-Disposition': `attachment; filename="${workflowId}.js"`
    })

    return { success: true, path: objectName }
  } catch (error) {
    console.error('Failed to store workflow code in MinIO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Retrieve workflow code from MinIO
 */
export async function getWorkflowCode(
  workflowId: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const client = await getMinIOClient()
    const bucket = process.env.MINIO_BUCKET || 'attachments'
    const objectName = `workflows/${workflowId}.js`

    // Check if object exists
    try {
      await client.statObject(bucket, objectName)
    } catch (statError: any) {
      if (statError.code === 'NotFound' || statError.code === 'NoSuchKey') {
        return { success: false, error: 'Workflow code not found in MinIO' }
      }
      throw statError
    }

    // Download workflow code
    const stream = await client.getObject(bucket, objectName)
    const chunks: Buffer[] = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    const code = Buffer.concat(chunks).toString('utf-8')
    return { success: true, code }
  } catch (error) {
    console.error('Failed to retrieve workflow code from MinIO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete workflow code from MinIO
 */
export async function deleteWorkflowCode(
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getMinIOClient()
    const bucket = process.env.MINIO_BUCKET || 'attachments'
    const objectName = `workflows/${workflowId}.js`

    await client.removeObject(bucket, objectName)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete workflow code from MinIO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Execute workflow code from MinIO storage
 * Downloads the code from MinIO, writes to temp file, then executes it
 * This allows proper ES6 module support using Node.js dynamic import()
 */
export async function executeWorkflowCodeFromMinIO(
  workflowId: string,
  apiKey: string,
  input: string,
  conversationHistory: any[]
): Promise<{ success: boolean; output?: string; error?: string }> {
  const tempDir = join(tmpdir(), 'workflows')
  const tempFile = join(tempDir, `${workflowId}-${Date.now()}.mjs`) // Use .mjs for ES modules

  try {
    // Ensure temp directory exists
    await mkdir(tempDir, { recursive: true })

    // Get workflow code from MinIO
    const codeResult = await getWorkflowCode(workflowId)
    if (!codeResult.success || !codeResult.code) {
      throw new Error(`Failed to retrieve workflow code from MinIO: ${codeResult.error || 'Code not found'}`)
    }

    const code = codeResult.code

    // Replace variables in code before writing
    let processedCode = code
      .replace(/process\.env\.OPENAI_API_KEY/g, `"${apiKey}"`)
      .replace(/process\.env\['OPENAI_API_KEY'\]/g, `"${apiKey}"`)
      .replace(/process\.env\["OPENAI_API_KEY"\]/g, `"${apiKey}"`)

    // Replace workflow_id in traceMetadata if present
    processedCode = processedCode.replace(
      /workflow_id:\s*"wf_[^"]*"/g,
      `workflow_id: "${workflowId}"`
    )
    processedCode = processedCode.replace(
      /workflow_id:\s*'wf_[^']*'/g,
      `workflow_id: "${workflowId}"`
    )

    // Write code to temporary file (downloaded from MinIO)
    console.log('WorkflowCodeStorage: Writing workflow code to temp file', {
      workflowId,
      tempFile,
      codeLength: processedCode.length
    })
    await writeFile(tempFile, processedCode, 'utf-8')

    // Verify file exists before importing
    try {
      const fileContent = await readFile(tempFile, 'utf-8')
      if (!fileContent || fileContent.length === 0) {
        throw new Error('Temp file is empty')
      }
    } catch (readError) {
      throw new Error(`Temp file was not created or is invalid: ${tempFile}. Error: ${readError instanceof Error ? readError.message : String(readError)}`)
    }

    // Use dynamic import to load the module
    // This properly handles ES6 imports/exports without transformation
    // Note: Node.js requires a file path - we cannot import from memory or MinIO directly
    // On Windows, we need to use pathToFileURL for proper URL encoding
    const { pathToFileURL } = await import('url')
    const fileUrl = pathToFileURL(tempFile).href

    console.log('WorkflowCodeStorage: Importing module from file', {
      tempFile,
      fileUrl,
      platform: process.platform,
      fileExists: true
    })

    const module = await import(fileUrl)

    // Get the runWorkflow function
    // Handle various export patterns:
    // - export default function runWorkflow(...)
    // - export { runWorkflow }
    // - export default { runWorkflow }
    const runWorkflow =
      module.default?.runWorkflow ||
      module.runWorkflow ||
      (typeof module.default === 'function' ? module.default : null)

    if (!runWorkflow || typeof runWorkflow !== 'function') {
      throw new Error(`runWorkflow function not found in workflow code. Available exports: ${Object.keys(module).join(', ')}`)
    }

    // Set environment variable for the code execution
    const originalApiKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = apiKey

    try {
      // Execute the workflow
      const result = await runWorkflow({
        input_as_text: input,
      })

      // Extract output
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
          output = JSON.stringify(result)
        }
      }

      return { success: true, output }
    } finally {
      // Restore original API key
      if (originalApiKey !== undefined) {
        process.env.OPENAI_API_KEY = originalApiKey
      } else {
        delete process.env.OPENAI_API_KEY
      }
    }
  } catch (error) {
    console.error('Error executing workflow code from MinIO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error executing workflow code'
    }
  } finally {
    // Clean up temporary file
    try {
      await unlink(tempFile)
      console.log('WorkflowCodeStorage: Cleaned up temp file', { tempFile })
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError)
    }
  }
}

/**
 * Get permanent storage path for workflow code
 * Uses a persistent directory instead of temp
 */
function getWorkflowStoragePath(): string {
  // Use a permanent location in the project or system
  // Try project root first, fallback to user's app data
  if (process.env.WORKFLOW_STORAGE_PATH) {
    return process.env.WORKFLOW_STORAGE_PATH
  }

  // Use a persistent location in the user's app data (Windows) or home directory
  const homeDir = process.env.APPDATA || process.env.HOME || tmpdir()
  return join(homeDir, '.mdm', 'workflows')
}

/**
 * Get file path for a workflow
 */
function getWorkflowFilePath(workflowId: string): string {
  const storageDir = getWorkflowStoragePath()
  return join(storageDir, `${workflowId}.mjs`)
}

/**
 * Execute workflow code directly from MinIO
 * Downloads from MinIO to a temporary file, executes, then cleans up
 * This is the standard approach - Node.js requires file paths for ES modules
 */
export async function executeWorkflowCodeFromFile(
  code: string,
  workflowId: string,
  apiKey: string,
  input: string,
  conversationHistory: any[]
): Promise<{ success: boolean; output?: string; error?: string }> {
  // Always download from MinIO first (this is the source of truth)
  console.log('WorkflowCodeStorage: Downloading workflow code from MinIO', {
    workflowId
  })

  const codeResult = await getWorkflowCode(workflowId)
  if (codeResult.success && codeResult.code) {
    // Use code from MinIO (preferred)
    code = codeResult.code
    console.log('WorkflowCodeStorage: Using code from MinIO', {
      workflowId,
      codeLength: code.length
    })
  } else {
    // Fallback to provided code if MinIO fails
    console.log('WorkflowCodeStorage: Code not in MinIO, using provided code', {
      workflowId,
      codeLength: code.length
    })
  }

  // Create a temporary file for execution (required by Node.js for ES modules)
  // This is a standard practice - we can't execute ES modules from memory/streams
  const tempDir = join(tmpdir(), 'workflows')
  const tempFile = join(tempDir, `${workflowId}-${Date.now()}.mjs`)

  // Ensure temp directory exists
  await mkdir(tempDir, { recursive: true })

  try {
    // Replace variables in code before writing
    let processedCode = code
      .replace(/process\.env\.OPENAI_API_KEY/g, `"${apiKey}"`)
      .replace(/process\.env\['OPENAI_API_KEY'\]/g, `"${apiKey}"`)
      .replace(/process\.env\["OPENAI_API_KEY"\]/g, `"${apiKey}"`)

    // Replace workflow_id in traceMetadata if present
    processedCode = processedCode.replace(
      /workflow_id:\s*"wf_[^"]*"/g,
      `workflow_id: "${workflowId}"`
    )
    processedCode = processedCode.replace(
      /workflow_id:\s*'wf_[^']*'/g,
      `workflow_id: "${workflowId}"`
    )

    // Write code to temporary file (downloaded from MinIO)
    // This is required - Node.js cannot import ES modules from memory/streams
    console.log('WorkflowCodeStorage: Writing workflow code to temp file (from MinIO)', {
      workflowId,
      tempFile,
      codeLength: processedCode.length,
      source: 'MinIO'
    })
    await writeFile(tempFile, processedCode, 'utf-8')

    // Verify file was created
    try {
      const fileStats = await stat(tempFile)
      if (fileStats.size === 0) {
        throw new Error('Temp file is empty')
      }
    } catch (readError: any) {
      throw new Error(`Failed to create temp file: ${tempFile}. Error: ${readError instanceof Error ? readError.message : String(readError)}`)
    }

    // Use dynamic import to load the module
    // This properly handles ES6 imports/exports without transformation
    // Note: Node.js requires a file path - this is a limitation of ES modules
    const { pathToFileURL } = await import('url')
    const fileUrl = pathToFileURL(tempFile).href

    console.log('WorkflowCodeStorage: Importing module from temp file (code from MinIO)', {
      tempFile,
      fileUrl,
      platform: process.platform,
      source: 'MinIO -> Temp File -> Import'
    })

    const module = await import(fileUrl)

    // Get the runWorkflow function
    // Handle various export patterns:
    // - export default function runWorkflow(...)
    // - export { runWorkflow }
    // - export default { runWorkflow }
    const runWorkflow =
      module.default?.runWorkflow ||
      module.runWorkflow ||
      (typeof module.default === 'function' ? module.default : null)

    if (!runWorkflow || typeof runWorkflow !== 'function') {
      throw new Error(`runWorkflow function not found in workflow code. Available exports: ${Object.keys(module).join(', ')}`)
    }

    // Set environment variable for the code execution
    const originalApiKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = apiKey

    try {
      // Execute the workflow
      const result = await runWorkflow({
        input_as_text: input,
      })

      // Extract output
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
          output = JSON.stringify(result)
        }
      }

      return { success: true, output }
    } finally {
      // Restore original API key
      if (originalApiKey !== undefined) {
        process.env.OPENAI_API_KEY = originalApiKey
      } else {
        delete process.env.OPENAI_API_KEY
      }
    }
  } catch (error) {
    console.error('Error executing workflow code from MinIO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error executing workflow code'
    }
  } finally {
    // Always clean up temp file after execution
    // This is the standard practice - download from MinIO, execute, cleanup
    try {
      await unlink(tempFile)
      console.log('WorkflowCodeStorage: Cleaned up temp file', { tempFile })
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file (non-critical):', cleanupError)
    }
  }
}
