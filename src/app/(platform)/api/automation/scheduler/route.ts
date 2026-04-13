import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { DataSyncExecutor } from '@/lib/data-sync-executor'

/**
 * Unified Automation Scheduler
 * 
 * This endpoint handles both workflow executions and data sync schedules.
 * Should be called periodically (every 5-15 minutes) via cron job.
 * 
 * Usage:
 * - Cron: 0,5,10,15,20,25,30,35,40,45,50,55 * * * * curl -X POST http://localhost:3000/api/automation/scheduler
 */

// Stub function - executeWorkflow doesn't exist in workflow-executor
async function executeWorkflow(workflowId: string): Promise<{ success: boolean; records_processed?: number; records_updated?: number; error?: string }> {
  return { success: false, error: 'Workflow execution not implemented' }
}

export async function POST(request: NextRequest) {
  try {
    const results = {
      workflows: [] as any[],
      dataSyncs: [] as any[],
      summary: {
        total_processed: 0,
        workflows_executed: 0,
        syncs_executed: 0,
        errors: 0
      }
    }

    // ===== WORKFLOWS =====
    try {
      const { rows: scheduledWorkflows } = await query(
        `SELECT 
          w.id,
          w.name,
          w.data_model_id,
          ws.schedule_type,
          ws.schedule_config,
          ws.start_date,
          ws.end_date,
          ws.timezone
         FROM public.workflows w
         JOIN public.workflow_schedules ws ON w.id = ws.workflow_id
         WHERE w.is_active = true 
           AND w.status = 'ACTIVE' 
           AND w.trigger_type = 'SCHEDULED'
           AND ws.is_active = true
           AND (ws.start_date IS NULL OR ws.start_date <= NOW())
           AND (ws.end_date IS NULL OR ws.end_date >= NOW())`
      )


      for (const workflow of scheduledWorkflows) {
        try {
          const shouldRun = await checkWorkflowSchedule(workflow)

          if (shouldRun) {
            console.log(`[Automation Scheduler] Executing workflow: ${workflow.name}`)
            const result = await executeWorkflow(workflow.id)

            results.workflows.push({
              type: 'workflow',
              id: workflow.id,
              name: workflow.name,
              success: result.success,
              records_processed: result.records_processed,
              records_updated: result.records_updated,
              error: result.error
            })

            results.summary.workflows_executed++
            if (!result.success) results.summary.errors++
          }
        } catch (error) {
          console.error(`[Automation Scheduler] Error executing workflow ${workflow.name}:`, error)
          results.workflows.push({
            type: 'workflow',
            id: workflow.id,
            name: workflow.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          results.summary.errors++
        }
      }
    } catch (error) {
      console.error('[Automation Scheduler] Error processing workflows:', error)
      results.workflows.push({
        type: 'workflow',
        error: 'Failed to process workflows',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // ===== DATA SYNC SCHEDULES =====
    try {
      const { rows: dueSyncs } = await query(
        `SELECT id, name, data_model_id, external_connection_id
         FROM public.data_sync_schedules
         WHERE is_active = true
           AND deleted_at IS NULL
           AND schedule_type != 'MANUAL'
           AND (next_run_at IS NULL OR next_run_at <= NOW())
           AND (last_run_status IS NULL OR last_run_status != 'RUNNING')
         ORDER BY next_run_at ASC NULLS LAST
         LIMIT 50`
      )

      const syncExecutor = new DataSyncExecutor()

      for (const sync of dueSyncs) {
        try {
          console.log(`[Automation Scheduler] Executing data sync: ${sync.name}`)

          const result = await syncExecutor.executeSync(sync.id)

          results.dataSyncs.push({
            type: 'data_sync',
            id: sync.id,
            name: sync.name,
            success: result.success,
            records_fetched: result.records_fetched,
            records_inserted: result.records_inserted,
            records_updated: result.records_updated,
            records_failed: result.records_failed,
            duration_ms: result.duration_ms,
            error: result.error
          })

          results.summary.syncs_executed++
          if (!result.success) results.summary.errors++

          // Trigger workflows that depend on this data model if sync succeeded
          if (result.success && sync.data_model_id) {
            await triggerWorkflowsForDataModel(sync.data_model_id)
          }
        } catch (error) {
          console.error(`[Automation Scheduler] Error executing sync ${sync.name}:`, error)
          results.dataSyncs.push({
            type: 'data_sync',
            id: sync.id,
            name: sync.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          results.summary.errors++
        }
      }
    } catch (error) {
      console.error('[Automation Scheduler] Error processing data syncs:', error)
      results.dataSyncs.push({
        type: 'data_sync',
        error: 'Failed to process data syncs',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    results.summary.total_processed = results.workflows.length + results.dataSyncs.length

    return NextResponse.json({
      message: 'Automation scheduler executed',
      timestamp: new Date().toISOString(),
      ...results
    })
  } catch (error) {
    console.error('[Automation Scheduler] Fatal error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Check if workflow should run based on schedule
 */
async function checkWorkflowSchedule(workflow: any): Promise<boolean> {
  const { schedule_type, schedule_config } = workflow

  switch (schedule_type) {
    case 'ONCE':
      const { rows: executions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1::uuid::uuid AND execution_type = 'SCHEDULED'`,
        [workflow.id]
      )
      return parseInt(executions[0].count) === 0

    case 'DAILY':
      const today = new Date().toISOString().split('T')[0]
      const { rows: dailyExecutions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1::uuid 
           AND execution_type = 'SCHEDULED'
           AND DATE(started_at) = $2`,
        [workflow.id, today]
      )
      return parseInt(dailyExecutions[0].count) === 0

    case 'WEEKLY':
      const { rows: weeklyExecutions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1::uuid 
           AND execution_type = 'SCHEDULED'
           AND started_at >= date_trunc('week', NOW())`,
        [workflow.id]
      )
      return parseInt(weeklyExecutions[0].count) === 0

    case 'MONTHLY':
      const { rows: monthlyExecutions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1::uuid 
           AND execution_type = 'SCHEDULED'
           AND started_at >= date_trunc('month', NOW())`,
        [workflow.id]
      )
      return parseInt(monthlyExecutions[0].count) === 0

    case 'CUSTOM_CRON':
      // For custom cron, you'd use a cron parser library
      console.log('Custom cron evaluation not implemented yet')
      return false

    default:
      return false
  }
}

/**
 * Trigger workflows that depend on a data model after sync completes
 * This is now handled by DataSyncExecutor.triggerDependentWorkflows()
 * Kept for backward compatibility if called directly
 */
async function triggerWorkflowsForDataModel(dataModelId: string): Promise<void> {
  try {
    // Find workflows that are triggered by data syncs or data changes
    const { rows: workflows } = await query(
      `SELECT w.id, w.name
       FROM public.workflows w
       JOIN public.workflow_schedules ws ON w.id = ws.workflow_id
       WHERE w.data_model_id = $1::uuid
         AND w.is_active = true
         AND w.status = 'ACTIVE'
         AND w.trigger_type = 'EVENT_BASED'
         AND ws.is_active = true
         AND ws.schedule_config->>'trigger_on_sync' = 'true'`,
      [dataModelId]
    )

    for (const workflow of workflows) {
      try {
        console.log(`[Automation Scheduler] Triggering workflow ${workflow.name} after data sync`)
        await executeWorkflow(workflow.id)
      } catch (error) {
        console.error(`[Automation Scheduler] Error triggering workflow ${workflow.name}:`, error)
      }
    }
  } catch (error) {
    console.error('[Automation Scheduler] Error finding dependent workflows:', error)
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  try {
    // Count workflows due to run
    const { rows: workflowCount } = await query(
      `SELECT COUNT(*) as count
       FROM public.workflows w
       JOIN public.workflow_schedules ws ON w.id = ws.workflow_id
       WHERE w.is_active = true 
         AND w.status = 'ACTIVE' 
         AND w.trigger_type = 'SCHEDULED'
         AND ws.is_active = true`
    )

    // Count syncs due to run
    const { rows: syncCount } = await query(
      `SELECT COUNT(*) as count
       FROM public.data_sync_schedules
       WHERE is_active = true
         AND deleted_at IS NULL
         AND schedule_type != 'MANUAL'
         AND (next_run_at IS NULL OR next_run_at <= NOW())
         AND (last_run_status IS NULL OR last_run_status != 'RUNNING')`
    )

    return NextResponse.json({
      status: 'ok',
      workflows_due: parseInt(workflowCount[0].count),
      syncs_due: parseInt(syncCount[0].count),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
