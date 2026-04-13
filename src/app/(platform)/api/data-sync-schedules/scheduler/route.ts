import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { DataSyncExecutor } from '@/lib/data-sync-executor'

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or scheduled task
    // It will find and execute all sync schedules that are due to run

    // Get all active sync schedules that are due to run
    const { rows: dueSchedules } = await query(
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

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: 'No sync schedules due to run',
        executed_count: 0,
        results: []
      })
    }

    const executor = new DataSyncExecutor()
    const results = []

    for (const schedule of dueSchedules) {
      try {
        console.log(`Executing sync schedule: ${schedule.name} (${schedule.id})`)
        
        const result = await executor.executeSync(schedule.id)
        
        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          success: result.success,
          records_processed: result.records_processed,
          records_inserted: result.records_inserted,
          records_updated: result.records_updated,
          records_failed: result.records_failed,
          duration_ms: result.duration_ms,
          error: result.error
        })
      } catch (error: any) {
        console.error(`Error executing sync schedule ${schedule.name}:`, error)
        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          success: false,
          error: error.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Sync schedules processed',
      executed_count: results.length,
      results
    })
  } catch (error) {
    console.error('Error in data sync scheduler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET() {
  try {
    // Get count of schedules due to run
    const { rows } = await query(
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
      schedules_due: parseInt(rows[0].count)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

