import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { executeWorkflow } from '@/lib/workflow-executor'

export const runtime = 'nodejs' // Required for workflow-executor (uses fs, path, os, url modules)

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or scheduled task
    // It will find and execute all scheduled workflows that are due to run

    // Get all active scheduled workflows
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

    const results = []

    for (const workflow of scheduledWorkflows) {
      try {
        // Check if workflow should run based on schedule
        const shouldRun = await checkSchedule(workflow)
        
        if (shouldRun) {
          console.log(`Executing scheduled workflow: ${workflow.name}`)
          const result = await executeWorkflow(workflow.id)
          results.push({
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            success: result.success,
            records_processed: result.records_processed,
            records_updated: result.records_updated,
            error: result.error
          })
        }
      } catch (error) {
        console.error(`Error executing scheduled workflow ${workflow.name}:`, error)
        results.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Scheduled workflows processed',
      executed_count: results.length,
      results
    })
  } catch (error) {
    console.error('Error in workflow scheduler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkSchedule(workflow: any): Promise<boolean> {
  const { schedule_type, schedule_config } = workflow
  
  switch (schedule_type) {
    case 'ONCE':
      // Check if this workflow has already been executed
      const { rows: executions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1 AND execution_type = 'SCHEDULED'`,
        [workflow.id]
      )
      return parseInt(executions[0].count) === 0
    
    case 'DAILY':
      // Check if workflow was executed today
      const today = new Date().toISOString().split('T')[0]
      const { rows: dailyExecutions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1 
           AND execution_type = 'SCHEDULED'
           AND DATE(started_at) = $2`,
        [workflow.id, today]
      )
      return parseInt(dailyExecutions[0].count) === 0
    
    case 'WEEKLY':
      // Check if workflow was executed this week
      const { rows: weeklyExecutions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1 
           AND execution_type = 'SCHEDULED'
           AND started_at >= date_trunc('week', NOW())`,
        [workflow.id]
      )
      return parseInt(weeklyExecutions[0].count) === 0
    
    case 'MONTHLY':
      // Check if workflow was executed this month
      const { rows: monthlyExecutions } = await query(
        `SELECT COUNT(*) as count FROM public.workflow_executions 
         WHERE workflow_id = $1 
           AND execution_type = 'SCHEDULED'
           AND started_at >= date_trunc('month', NOW())`,
        [workflow.id]
      )
      return parseInt(monthlyExecutions[0].count) === 0
    
    case 'CUSTOM_CRON':
      // For custom cron expressions, you'd need a cron parser library
      // This is a simplified implementation
      if (schedule_config && schedule_config.cron) {
        // In production, you'd use a library like 'node-cron' or 'cron-parser'
        // to evaluate the cron expression
        console.log('Custom cron evaluation not implemented yet')
        return false
      }
      return false
    
    default:
      console.warn(`Unknown schedule type: ${schedule_type}`)
      return false
  }
}
