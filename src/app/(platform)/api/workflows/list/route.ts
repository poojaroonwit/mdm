import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { logger } from '@/lib/logger'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'

export async function GET() {
  const startTime = Date.now()
  try {
    const workflowsDir = join(process.cwd(), 'src', 'lib', 'workflows')
    logger.apiRequest('GET', '/api/workflows/list')
    
    // Read all TypeScript files in the workflows directory
    const files = await readdir(workflowsDir)
    const workflowFiles = files
      .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
      .map(file => ({
        name: file.replace('.ts', ''),
        filename: file,
        path: `@/lib/workflows/${file.replace('.ts', '')}`
      }))
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/workflows/list', 200, duration, { count: workflowFiles.length })
    return addSecurityHeaders(NextResponse.json({ workflows: workflowFiles }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/workflows/list', 500, duration)
    return handleApiError(error, 'Workflows List API')
  }
}

