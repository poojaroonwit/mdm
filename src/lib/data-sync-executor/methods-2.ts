import { query, db as prisma } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { NotificationService } from '@/lib/notifications'
import type { SyncExecutionResult, SyncSchedule } from '../data-sync-executor'

export const dataSyncExecutorMethods2: Record<string, Function> & ThisType<any> = {
  /**
   * Update an existing data record with new values
   */
  async updateDataRecord(
    recordId: string,
    record: any,
    attributeMap: Map<string, string>
  ): Promise<void> {
    // Update the record timestamp
    await query(
      `UPDATE public.data_records SET updated_at = NOW() WHERE id = $1`,
      [recordId]
    )

    // Update or insert attribute values
    for (const [fieldName, fieldValue] of Object.entries(record)) {
      if (fieldValue === null || fieldValue === undefined) continue
      
      const attributeId = attributeMap.get(fieldName)
      if (attributeId) {
        await query(
          `INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
           VALUES ($1, $2, $3)
           ON CONFLICT (data_record_id, attribute_id)
           DO UPDATE SET value = $3`,
          [recordId, attributeId, String(fieldValue)]
        )
      }
    }
  },

  /**
   * Apply data mapping transformations
   */
  applyDataMapping(record: any, mapping?: any): any {
    if (!mapping) return record

    const mapped: any = {}
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      mapped[targetField] = this.getNestedValue(record, sourceField as string)
    }
    return mapped
  },

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  },

  /**
   * Load sync schedule with related data
   */
  async loadSyncSchedule(scheduleId: string): Promise<SyncSchedule | null> {
    const { rows } = await query(
      `SELECT 
        ds.id, ds.space_id, ds.data_model_id, ds.external_connection_id,
        ds.name, ds.schedule_type, ds.schedule_config, ds.sync_strategy,
        ds.incremental_key, ds.incremental_timestamp_column,
        ds.clear_existing_data, ds.source_query, ds.data_mapping,
        ds.max_records_per_sync, ds.rate_limit_per_minute,
        ds.retry_enabled, ds.max_retries, ds.retry_delay_seconds,
        ds.retry_backoff_multiplier, ds.current_retry_count,
        ds.notify_on_success, ds.notify_on_failure, ds.notification_emails,
        ec.connection_type, ec.db_type, ec.host, ec.port, ec.database,
        ec.username, ec.password, ec.api_url, ec.api_method, ec.api_headers,
        ec.api_auth_type, ec.api_auth_token, ec.api_auth_username,
        ec.api_auth_password, ec.api_auth_apikey_name, ec.api_auth_apikey_value,
        ec.api_body, ec.api_response_path,
        dm.external_schema, dm.external_table, dm.external_primary_key
       FROM public.data_sync_schedules ds
       JOIN public.external_connections ec ON ec.id = ds.external_connection_id
       JOIN public.data_models dm ON dm.id = ds.data_model_id
       WHERE ds.id = $1 AND ds.deleted_at IS NULL`,
      [scheduleId]
    )

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id,
      space_id: row.space_id,
      data_model_id: row.data_model_id,
      external_connection_id: row.external_connection_id,
      name: row.name,
      schedule_type: row.schedule_type,
      sync_strategy: row.sync_strategy,
      incremental_key: row.incremental_key,
      incremental_timestamp_column: row.incremental_timestamp_column,
      clear_existing_data: row.clear_existing_data,
      source_query: row.source_query,
      data_mapping: row.data_mapping,
      max_records_per_sync: row.max_records_per_sync,
      rate_limit_per_minute: row.rate_limit_per_minute,
      retry_enabled: row.retry_enabled ?? true,
      max_retries: row.max_retries ?? 3,
      retry_delay_seconds: row.retry_delay_seconds ?? 300,
      retry_backoff_multiplier: row.retry_backoff_multiplier ?? 2.0,
      current_retry_count: row.current_retry_count ?? 0,
      notify_on_success: row.notify_on_success ?? false,
      notify_on_failure: row.notify_on_failure ?? true,
      notification_emails: row.notification_emails || [],
      ...(row.schedule_config ? { schedule_config: row.schedule_config } : {}),
      external_connection: {
        connection_type: row.connection_type,
        db_type: row.db_type,
        host: row.host,
        port: row.port,
        database: row.database,
        username: row.username,
        password: row.password,
        api_url: row.api_url,
        api_method: row.api_method,
        api_headers: row.api_headers,
        api_auth_type: row.api_auth_type,
        api_auth_token: row.api_auth_token,
        api_auth_username: row.api_auth_username,
        api_auth_password: row.api_auth_password,
        api_auth_apikey_name: row.api_auth_apikey_name,
        api_auth_apikey_value: row.api_auth_apikey_value,
        api_body: row.api_body,
        api_response_path: row.api_response_path
      },
      data_model: {
        external_schema: row.external_schema,
        external_table: row.external_table,
        external_primary_key: row.external_primary_key
      }
    }
  },

  /**
   * Get last sync timestamp for incremental syncs
   */
  async getLastSyncTimestamp(scheduleId: string): Promise<Date | null> {
    const { rows } = await query(
      `SELECT started_at FROM public.data_sync_executions
       WHERE sync_schedule_id = $1 AND status = 'COMPLETED'
       ORDER BY started_at DESC LIMIT 1`,
      [scheduleId]
    )

    return rows.length > 0 ? rows[0].started_at : null
  },

  /**
   * Calculate next run time based on schedule type
   */
  calculateNextRunTime(scheduleType: string, scheduleConfig: any): Date {
    const now = new Date()
    const next = new Date(now)

    switch (scheduleType) {
      case 'HOURLY':
        next.setHours(next.getHours() + 1, 0, 0, 0)
        break
      case 'DAILY':
        next.setDate(next.getDate() + 1)
        next.setHours(scheduleConfig?.hour || 0, scheduleConfig?.minute || 0, 0, 0)
        break
      case 'WEEKLY':
        next.setDate(next.getDate() + 7)
        next.setHours(scheduleConfig?.hour || 0, scheduleConfig?.minute || 0, 0, 0)
        break
      default:
        return next
    }

    return next
  },

  /**
   * Trigger workflows that depend on this sync
   */
  async triggerDependentWorkflows(scheduleId: string, onSuccess: boolean): Promise<void> {
    try {
      // Find workflows configured to trigger after this sync
      const { rows: workflows } = await query(
        `SELECT w.id, w.name, dst.trigger_on_success, dst.trigger_on_failure
         FROM public.workflows w
         JOIN public.data_sync_workflow_triggers dst ON dst.workflow_id = w.id
         WHERE dst.sync_schedule_id = $1
           AND w.is_active = true
           AND w.status = 'ACTIVE'
           AND (
             (onSuccess = true AND dst.trigger_on_success = true)
             OR
             (onSuccess = false AND dst.trigger_on_failure = true)
           )`,
        [scheduleId]
      )

      // Also check workflow schedules with trigger_on_sync flag
      const { rows: scheduleWorkflows } = await query(
        `SELECT w.id, w.name
         FROM public.workflows w
         JOIN public.workflow_schedules ws ON ws.workflow_id = w.id
         WHERE ws.trigger_on_sync = true
           AND (ws.trigger_on_sync_schedule_id = $1 OR ws.trigger_on_sync_schedule_id IS NULL)
           AND w.data_model_id = (SELECT data_model_id FROM public.data_sync_schedules WHERE id = $1)
           AND w.is_active = true
           AND w.status = 'ACTIVE'`,
        [scheduleId]
      )

      const allWorkflows = [...workflows, ...scheduleWorkflows.map(w => ({ id: w.id, name: w.name }))]

      for (const workflow of allWorkflows) {
        try {
          console.log(`[Data Sync] Triggering workflow ${workflow.name} after sync ${onSuccess ? 'success' : 'failure'}`)
          
          // Import executeWorkflow dynamically to avoid circular dependency
          const { executeWorkflow } = await import('@/lib/workflow-executor')
          await executeWorkflow(workflow.id)
        } catch (error) {
          console.error(`[Data Sync] Error triggering workflow ${workflow.name}:`, error)
        }
      }
    } catch (error) {
      console.error('[Data Sync] Error finding dependent workflows:', error)
    }
  },

  /**
   * Save execution log and return execution ID
   */
  async saveExecutionLog(scheduleId: string, result: SyncExecutionResult): Promise<string> {
    const { rows } = await query(
      `INSERT INTO public.data_sync_executions
       (sync_schedule_id, status, started_at, completed_at,
        records_fetched, records_processed, records_inserted,
        records_updated, records_deleted, records_failed,
        error_message, error_details, execution_log, duration_ms)
       VALUES ($1, $2, NOW() - (($3::text || ' milliseconds')::interval), NOW(),
               $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        scheduleId,
        result.success ? 'COMPLETED' : 'FAILED',
        result.duration_ms,
        result.records_fetched,
        result.records_processed,
        result.records_inserted,
        result.records_updated,
        result.records_deleted,
        result.records_failed,
        result.error || null,
        result.error_details ? JSON.stringify(result.error_details) : null,
        result.execution_log ? JSON.stringify(result.execution_log) : null,
        result.duration_ms
      ]
    )
    return rows[0]?.id || ''
  },

  /**
   * Handle retry logic for failed syncs
   */
  async handleRetryLogic(
    scheduleId: string,
    schedule: SyncSchedule,
    result: SyncExecutionResult
  ): Promise<boolean> {
    // Check if retry is enabled
    if (!schedule.retry_enabled) {
      return false
    }

    const maxRetries = schedule.max_retries || 3
    const currentRetries = schedule.current_retry_count || 0

    if (currentRetries >= maxRetries) {
      // Max retries reached, don't retry
      return false
    }

    // Increment retry count
    const newRetryCount = currentRetries + 1
    const retryDelaySeconds = schedule.retry_delay_seconds || 300
    const backoffMultiplier = schedule.retry_backoff_multiplier || 2.0
    
    // Calculate delay with exponential backoff
    const delaySeconds = retryDelaySeconds * Math.pow(backoffMultiplier, currentRetries)
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000)

    // Update schedule with retry info
    await query(
      `UPDATE public.data_sync_schedules 
       SET current_retry_count = $1, next_run_at = $2
       WHERE id = $3`,
      [newRetryCount, nextRetryAt, scheduleId]
    )

    console.log(`[Data Sync] Scheduling retry ${newRetryCount}/${maxRetries} for ${schedule.name} in ${delaySeconds}s`)
    return true
  },
}
