import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { executeWorkflow } from '@/lib/workflow-executor'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

export const runtime = 'nodejs' // Required for workflow-executor (uses fs, path, os, url modules)

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: workflowId } = paramValidation.data
    logger.apiRequest('POST', `/api/workflows/${workflowId}/execute`, { userId: session.user.id })

    // Execute workflow using the executor
    const result = await executeWorkflow(workflowId)

    if (!result.success) {
      logger.error('Workflow execution failed', new Error(result.error || 'Workflow execution failed'), {
        workflowId,
        error: result.error,
      })
      return NextResponse.json({ 
        error: result.error || 'Workflow execution failed' 
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/workflows/${workflowId}/execute`, 200, duration, {
      executionId: (result as any).execution_id,
      recordsProcessed: result.records_processed,
      recordsUpdated: result.records_updated,
    })
    return NextResponse.json({
      message: 'Workflow executed successfully',
      execution_id: (result as any).execution_id,
      records_processed: result.records_processed,
      records_updated: result.records_updated
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/workflows/[id]/execute')
