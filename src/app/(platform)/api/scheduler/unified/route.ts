import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { executeWorkflow } from '@/lib/workflow-executor'
import { DataSyncExecutor } from '@/lib/data-sync-executor'
import { executeNotebookSchedule } from '@/lib/notebook-scheduler'
import { getConfiguredSiteUrl, getSchedulerApiKey } from '@/lib/system-runtime-settings'

/**
 * Unified Scheduler Endpoint
 * 
 * This endpoint executes all scheduled tasks:
 * - Workflows
 * - Notebooks
 * - Data Syncs
 * 
 * Should be called by a cron job (e.g., every 5 minutes)
 * 
 * Authentication: Requires API key via X-API-Key header or valid session
 */
export const runtime = 'nodejs' // Required for workflow-executor (uses fs, path, os, url modules)

export async function POST(request: NextRequest) {
  try {
    // Authentication: Check for API key (for cron jobs) or session (for manual triggers)
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key')
    const expectedApiKey = await getSchedulerApiKey()

    // If API key is required and provided, validate it
    if (expectedApiKey && apiKey) {
      if (apiKey !== expectedApiKey) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
    } else if (expectedApiKey && !apiKey) {
      // If API key is configured but not provided, require it
      return NextResponse.json(
        { error: 'API key required. Provide X-API-Key header.' },
        { status: 401 }
      )
    }
    // If no API key is configured, allow unauthenticated access (for development)
    // In production, configure a scheduler API key in System Settings

    console.log('[Unified Scheduler] Starting scheduled task execution...')
    const results = {
      workflows: [] as any[],
      notebooks: [] as any[],
      dataSyncs: [] as any[]
    }

    // 0. Execute ServiceDesk sync schedules
    try {
      const siteUrl = await getConfiguredSiteUrl(request)
      const servicedeskSyncResponse = await fetch(`${siteUrl}/api/integrations/manageengine-servicedesk/sync-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(expectedApiKey && { 'X-API-Key': expectedApiKey })
        }
      })
      if (servicedeskSyncResponse.ok) {
        const servicedeskData = await servicedeskSyncResponse.json()
        console.log('[Unified Scheduler] ServiceDesk syncs:', servicedeskData.results?.length || 0)
      }
    } catch (error) {
      console.error('[Unified Scheduler] Error executing ServiceDesk syncs:', error)
    }

    // 1. Execute scheduled workflows
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
          ws.timezone,
          ws.next_run_at
         FROM public.workflows w
         JOIN public.workflow_schedules ws ON w.id = ws.workflow_id
         WHERE w.is_active = true 
           AND w.status = 'ACTIVE' 
           AND w.trigger_type = 'SCHEDULED'
           AND ws.is_active = true
           AND (ws.next_run_at IS NULL OR ws.next_run_at <= NOW())
           AND (ws.start_date IS NULL OR ws.start_date <= NOW())
           AND (ws.end_date IS NULL OR ws.end_date >= NOW())
         ORDER BY ws.next_run_at ASC NULLS LAST
         LIMIT 50`
      )

      for (const workflow of scheduledWorkflows) {
        try {
          const result = await executeWorkflow(workflow.id)
          results.workflows.push({
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            success: result.success,
            records_processed: result.records_processed,
            records_updated: result.records_updated,
            error: result.error
          })

          // Update next run time
          const nextRun = calculateNextRunTime(
            workflow.schedule_type,
            workflow.schedule_config,
            workflow.timezone
          )
          if (nextRun) {
            await query(
              `UPDATE public.workflow_schedules 
               SET last_run_at = NOW(), next_run_at = $1
               WHERE workflow_id = $2`,
              [nextRun, workflow.id]
            )
          }
        } catch (error: any) {
          results.workflows.push({
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            success: false,
            error: error.message
          })
        }
      }
    } catch (error: any) {
      console.error('Error executing workflows:', error)
    }

    // 2. Execute scheduled notebooks
    try {
      const { rows: scheduledNotebooks } = await query(
        `SELECT id, notebook_id, name
         FROM public.notebook_schedules
         WHERE enabled = true
           AND status = 'active'
           AND (next_run_at IS NULL OR next_run_at <= NOW())
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
           AND (max_executions IS NULL OR execution_count < max_executions)
         ORDER BY next_run_at ASC NULLS LAST
         LIMIT 50`
      )

      for (const schedule of scheduledNotebooks) {
        try {
          const result = await executeNotebookSchedule(schedule.id)
          results.notebooks.push({
            schedule_id: schedule.id,
            schedule_name: schedule.name,
            notebook_id: schedule.notebook_id,
            success: result.success,
            execution_id: result.execution_id,
            cells_executed: result.cells_executed,
            cells_succeeded: result.cells_succeeded,
            cells_failed: result.cells_failed,
            error: result.error
          })

          // Next run time is calculated by the database function
          await query(
            `UPDATE public.notebook_schedules
             SET last_run_at = NOW(),
                 last_run_status = $1,
                 last_run_error = $2,
                 execution_count = execution_count + 1,
                 next_run_at = calculate_notebook_next_run(
                   schedule_type,
                   schedule_config,
                   timezone
                 )
             WHERE id = $3`,
            [
              result.success ? 'completed' : 'failed',
              result.error || null,
              schedule.id
            ]
          )
        } catch (error: any) {
          results.notebooks.push({
            schedule_id: schedule.id,
            schedule_name: schedule.name,
            success: false,
            error: error.message
          })
        }
      }
    } catch (error: any) {
      console.error('Error executing notebooks:', error)
    }

    // 3. Execute scheduled data syncs
    try {
      const { rows: dueSyncSchedules } = await query(
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

      if (dueSyncSchedules.length > 0) {
        const executor = new DataSyncExecutor()
        
        for (const schedule of dueSyncSchedules) {
          try {
            const result = await executor.executeSync(schedule.id)
            results.dataSyncs.push({
              schedule_id: schedule.id,
              schedule_name: schedule.name,
              success: result.success,
              records_fetched: result.records_fetched,
              records_processed: result.records_processed,
              error: result.error
            })
          } catch (error: any) {
            results.dataSyncs.push({
              schedule_id: schedule.id,
              schedule_name: schedule.name,
              success: false,
              error: error.message
            })
          }
        }
      }
    } catch (error: any) {
      console.error('Error executing data syncs:', error)
    }

    const totalExecuted = 
      results.workflows.length + 
      results.notebooks.length + 
      results.dataSyncs.length

    return NextResponse.json({
      success: true,
      message: `Executed ${totalExecuted} scheduled task(s)`,
      executed_count: totalExecuted,
      results
    })
  } catch (error: any) {
    console.error('Error in unified scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to execute scheduled tasks', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Calculate next run time (shared utility)
 */
function calculateNextRunTime(
  scheduleType: string,
  scheduleConfig: any,
  timezone: string = 'UTC'
): Date | null {
  const now = new Date()
  let nextRun: Date

  switch (scheduleType) {
    case 'ONCE':
      return null // Only run once

    case 'HOURLY':
      nextRun = new Date(now)
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0)
      return nextRun

    case 'DAILY':
    case 'daily':
      const hour = scheduleConfig?.hour || 9
      const minute = scheduleConfig?.minute || 0
      nextRun = new Date(now)
      nextRun.setHours(hour, minute, 0, 0)
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      return nextRun

    case 'WEEKLY':
    case 'weekly':
      const dayOfWeek = scheduleConfig?.dayOfWeek || 1
      const weekHour = scheduleConfig?.hour || 9
      const weekMinute = scheduleConfig?.minute || 0
      nextRun = new Date(now)
      const currentDay = nextRun.getDay()
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7
      nextRun.setDate(nextRun.getDate() + daysUntilTarget)
      nextRun.setHours(weekHour, weekMinute, 0, 0)
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7)
      }
      return nextRun

    case 'MONTHLY':
    case 'monthly':
      const dayOfMonth = scheduleConfig?.dayOfMonth || 1
      const monthHour = scheduleConfig?.hour || 9
      const monthMinute = scheduleConfig?.minute || 0
      nextRun = new Date(now)
      nextRun.setDate(dayOfMonth)
      nextRun.setHours(monthHour, monthMinute, 0, 0)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(dayOfMonth)
      }
      return nextRun

    case 'CUSTOM_CRON':
    case 'cron':
      // Cron parsing would require a library
      // For now, return null (needs implementation)
      return null

    case 'interval':
      const value = scheduleConfig?.value || 60
      const unit = scheduleConfig?.unit || 'minutes'
      nextRun = new Date(now)
      if (unit === 'hours') {
        nextRun.setHours(nextRun.getHours() + value)
      } else {
        nextRun.setMinutes(nextRun.getMinutes() + value)
      }
      return nextRun

    default:
      return null
  }
}

