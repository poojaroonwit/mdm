import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { executeNotebookSchedule } from '@/lib/notebook-scheduler'

/**
 * This endpoint should be called by a cron job or scheduled task
 * It will find and execute all notebook schedules that are due to run
 */
export async function POST(request: NextRequest) {
  try {
    // Get all active schedules that are due to run
    const { rows: dueSchedules } = await query(
      `SELECT 
        id,
        notebook_id,
        name,
        schedule_type,
        schedule_config,
        parameters,
        execute_all_cells,
        cell_ids,
        enabled,
        status,
        space_id
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

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: 'No notebook schedules due to run',
        executed_count: 0,
        results: []
      })
    }

    const results = []

    for (const schedule of dueSchedules) {
      try {
        // Execute the notebook schedule
        const executionResult = await executeNotebookSchedule(schedule.id)

        // Update schedule
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
            executionResult.success ? 'completed' : 'failed',
            executionResult.error || null,
            schedule.id
          ]
        )

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          success: executionResult.success,
          execution_id: executionResult.execution_id,
          error: executionResult.error
        })
      } catch (error: any) {
        console.error(`Error executing schedule ${schedule.id}:`, error)
        
        // Update schedule with error
        await query(
          `UPDATE public.notebook_schedules
           SET last_run_at = NOW(),
               last_run_status = 'failed',
               last_run_error = $1
           WHERE id = $2`,
          [error.message, schedule.id]
        )

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: `Executed ${results.length} notebook schedule(s)`,
      executed_count: results.length,
      results
    })
  } catch (error: any) {
    console.error('Error in notebook scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to execute notebook schedules', details: error.message },
      { status: 500 }
    )
  }
}

