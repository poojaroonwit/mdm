import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

const execAsync = promisify(exec)

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const limit = 100 // 100 executions per hour
  const window = 60 * 60 * 1000 // 1 hour

  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + window })
    return { allowed: true, remaining: limit - 1 }
  }

  if (userLimit.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: limit - userLimit.count }
}

// Security: Block dangerous operations
const DANGEROUS_PATTERNS = [
  /import\s+os\s*$/m,
  /import\s+subprocess/m,
  /import\s+sys\s*$/m,
  /eval\s*\(/,
  /exec\s*\(/,
  /__import__\s*\(/,
  /open\s*\([^)]*['"]\/etc/,
  /open\s*\([^)]*['"]\/proc/,
  /open\s*\([^)]*['"]\/sys/,
  /subprocess\./,
  /os\.system/,
  /os\.popen/,
  /shutil\./,
  /pickle\.loads/,
]

function isCodeSafe(code: string): { safe: boolean; reason?: string } {
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: 'Code contains potentially dangerous operations' }
    }
  }
  
  return { safe: true }
}

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const userId = session.user.id

    // Rate limiting
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { code, timeout = 30000 } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Python code is required' },
        { status: 400 }
      )
    }

    // Security check
    const safetyCheck = isCodeSafe(code)
    if (!safetyCheck.safe) {
      return NextResponse.json(
        { error: safetyCheck.reason || 'Code contains unsafe operations' },
        { status: 400 }
      )
    }

    // Create temporary file for Python code
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'python-exec-'))
    const tempFile = path.join(tempDir, 'script.py')
    const outputFile = path.join(tempDir, 'output.json')

    try {
      // Write code to temp file
      await fs.writeFile(tempFile, code, 'utf-8')

      // Create output capture script - use exec with code string directly for better security
      const escapedCode = code.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n')
      const captureScript = `
import sys
import json
import io
from contextlib import redirect_stdout, redirect_stderr

output = {'stdout': '', 'stderr': '', 'result': None, 'error': None}

try:
    # Capture stdout and stderr
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    user_code = '''${escapedCode}'''
    
    with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
        # Execute the user's code
        exec(user_code, {'__builtins__': __builtins__})
    
    output['stdout'] = stdout_capture.getvalue()
    output['stderr'] = stderr_capture.getvalue()
    
    # Use stdout as result if available
    if output['stdout']:
        lines = output['stdout'].strip().split('\\n')
        output['result'] = lines[-1] if lines else output['stdout'].strip()
    
except Exception as e:
    import traceback
    output['error'] = str(e)
    output['stderr'] = stderr_capture.getvalue() if 'stderr_capture' in locals() else ''
    if not output['stderr']:
        output['stderr'] = traceback.format_exc()

with open('${outputFile.replace(/\\/g, '/')}', 'w') as f:
    json.dump(output, f)
`

      const captureFile = path.join(tempDir, 'capture.py')
      await fs.writeFile(captureFile, captureScript, 'utf-8')

      // Execute Python with timeout
      const startTime = Date.now()
      
      try {
        const { stdout, stderr } = await Promise.race([
          execAsync(`python3 "${captureFile}"`, {
            cwd: tempDir,
            timeout: timeout,
            maxBuffer: 10 * 1024 * 1024, // 10MB
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Execution timeout')), timeout)
          })
        ])

        const executionTime = Date.now() - startTime

        // Read output file
        let outputData: any = { stdout: '', stderr: '', result: null, error: null }
        try {
          const outputContent = await fs.readFile(outputFile, 'utf-8')
          outputData = JSON.parse(outputContent)
        } catch (e) {
          // If output file doesn't exist or is invalid, use stderr
          outputData.stderr = stderr || 'Failed to capture output'
        }

        // Clean up temp files
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})

        return NextResponse.json({
          stdout: outputData.stdout || stdout || '',
          stderr: outputData.stderr || stderr || '',
          result: outputData.result || null,
          error: outputData.error || null,
          executionTime,
          variables: {}, // Could extract variables from execution context
        })
      } catch (execError: any) {
        const executionTime = Date.now() - startTime

        // Clean up temp files
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})

        if (execError.message === 'Execution timeout') {
          return NextResponse.json(
            { 
              error: 'Execution timeout',
              stderr: `Code execution exceeded ${timeout}ms timeout`,
              executionTime 
            },
            { status: 408 }
          )
        }

        return NextResponse.json({
          error: execError.message || 'Execution failed',
          stderr: execError.stderr || execError.message || '',
          stdout: execError.stdout || '',
          executionTime,
        })
      }
    } catch (fileError: any) {
      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
      
      return NextResponse.json(
        { error: 'Failed to create execution environment', details: fileError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Python execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/notebook/execute-python')
