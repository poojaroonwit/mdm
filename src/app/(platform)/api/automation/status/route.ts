import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * Automation Status Endpoint
 * Provides unified status for both workflows and data syncs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')

    const stats = {
      workflows: {
        total: 0,
        active: 0,
        scheduled: 0,
        manual: 0,
        last_24h_executions: 0,
        success_rate: 0
      },
      dataSyncs: {
        total: 0,
        active: 0,
        scheduled: 0,
        last_24h_executions: 0,
        success_rate: 0
      },
      combined: {
        total_automations: 0,
        total_executions_24h: 0,
        overall_success_rate: 0
      }
    }

    // Workflow stats
    let workflowQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE w.is_active = true AND w.status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE w.trigger_type = 'SCHEDULED') as scheduled,
        COUNT(*) FILTER (WHERE w.trigger_type = 'MANUAL') as manual
      FROM public.workflows w
      WHERE w.deleted_at IS NULL
    `
    const workflowParams: any[] = []

    if (spaceId) {
      workflowQuery += ` AND w.data_model_id IN (
        SELECT id FROM public.data_models WHERE id IN (
          SELECT data_model_id FROM public.data_model_spaces WHERE space_id = $1::uuid
        )
      )`
      workflowParams.push(spaceId)
    }

    const { rows: workflowStats } = await query(workflowQuery, workflowParams)
    if (workflowStats.length > 0) {
      stats.workflows.total = parseInt(workflowStats[0].total)
      stats.workflows.active = parseInt(workflowStats[0].active)
      stats.workflows.scheduled = parseInt(workflowStats[0].scheduled)
      stats.workflows.manual = parseInt(workflowStats[0].manual)
    }

    // Workflow execution stats (last 24h)
    let executionQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as successful
      FROM public.workflow_executions
      WHERE started_at >= NOW() - INTERVAL '24 hours'
    `
    const executionParams: any[] = []

    if (spaceId) {
      executionQuery += ` AND workflow_id IN (
        SELECT id FROM public.workflows WHERE data_model_id IN (
          SELECT id FROM public.data_models WHERE id IN (
            SELECT data_model_id FROM public.data_model_spaces WHERE space_id = $1::uuid
          )
        )
      )`
      executionParams.push(spaceId)
    }

    const { rows: executionStats } = await query(executionQuery, executionParams)
    if (executionStats.length > 0) {
      const total = parseInt(executionStats[0].total)
      const successful = parseInt(executionStats[0].successful)
      stats.workflows.last_24h_executions = total
      stats.workflows.success_rate = total > 0 ? (successful / total) * 100 : 0
    }

    // Data sync stats
    let syncQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true AND deleted_at IS NULL) as active,
        COUNT(*) FILTER (WHERE schedule_type != 'MANUAL') as scheduled
      FROM public.data_sync_schedules
      WHERE deleted_at IS NULL
    `
    const syncParams: any[] = []

    if (spaceId) {
      syncQuery += ` AND space_id = $1`
      syncParams.push(spaceId)
    }

    const { rows: syncStats } = await query(syncQuery, syncParams)
    if (syncStats.length > 0) {
      stats.dataSyncs.total = parseInt(syncStats[0].total)
      stats.dataSyncs.active = parseInt(syncStats[0].active)
      stats.dataSyncs.scheduled = parseInt(syncStats[0].scheduled)
    }

    // Data sync execution stats (last 24h)
    let syncExecQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as successful
      FROM public.data_sync_executions
      WHERE started_at >= NOW() - INTERVAL '24 hours'
    `
    const syncExecParams: any[] = []

    if (spaceId) {
      syncExecQuery += ` AND sync_schedule_id IN (
        SELECT id FROM public.data_sync_schedules WHERE space_id = $1::uuid
      )`
      syncExecParams.push(spaceId)
    }

    const { rows: syncExecStats } = await query(syncExecQuery, syncExecParams)
    if (syncExecStats.length > 0) {
      const total = parseInt(syncExecStats[0].total)
      const successful = parseInt(syncExecStats[0].successful)
      stats.dataSyncs.last_24h_executions = total
      stats.dataSyncs.success_rate = total > 0 ? (successful / total) * 100 : 0
    }

    // Combined stats
    stats.combined.total_automations = stats.workflows.total + stats.dataSyncs.total
    stats.combined.total_executions_24h = stats.workflows.last_24h_executions + stats.dataSyncs.last_24h_executions
    
    const totalExecutions = stats.combined.total_executions_24h
    const totalSuccessful = 
      (stats.workflows.last_24h_executions * stats.workflows.success_rate / 100) +
      (stats.dataSyncs.last_24h_executions * stats.dataSyncs.success_rate / 100)
    stats.combined.overall_success_rate = totalExecutions > 0 ? (totalSuccessful / totalExecutions) * 100 : 0

    return NextResponse.json({
      status: 'ok',
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Automation Status] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

