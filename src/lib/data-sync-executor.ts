import { query, db as prisma } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { NotificationService } from '@/lib/notifications'
import { dataSyncExecutorMethods1 } from './data-sync-executor/methods-1'
import { dataSyncExecutorMethods2 } from './data-sync-executor/methods-2'
import { dataSyncExecutorMethods3 } from './data-sync-executor/methods-3'


export interface SyncExecutionResult {
  success: boolean
  records_fetched: number
  records_processed: number
  records_inserted: number
  records_updated: number
  records_deleted: number
  records_failed: number
  error?: string
  error_details?: any
  execution_log?: any[]
  duration_ms: number
}

export interface SyncSchedule {
  id: string
  space_id: string
  data_model_id: string
  external_connection_id: string
  name: string
  schedule_type: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM_CRON' | 'MANUAL'
  sync_strategy: 'FULL_REFRESH' | 'INCREMENTAL' | 'APPEND'
  incremental_key?: string
  incremental_timestamp_column?: string
  clear_existing_data: boolean
  source_query?: string
  data_mapping?: any
  max_records_per_sync?: number
  rate_limit_per_minute?: number
  retry_enabled?: boolean
  max_retries?: number
  retry_delay_seconds?: number
  retry_backoff_multiplier?: number
  current_retry_count?: number
  notify_on_success?: boolean
  notify_on_failure?: boolean
  notification_emails?: string[]
  external_connection?: {
    connection_type: 'database' | 'api'
    db_type?: string
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string
    api_url?: string
    api_method?: string
    api_headers?: any
    api_auth_type?: string
    api_auth_token?: string
    api_auth_username?: string
    api_auth_password?: string
    api_auth_apikey_name?: string
    api_auth_apikey_value?: string
    api_body?: string
    api_response_path?: string
  }
  data_model?: {
    external_schema?: string
    external_table?: string
    external_primary_key?: string
  }
}

export class DataSyncExecutor {
  /**
   * Execute a data synchronization for a given schedule
   */
  async executeSync(scheduleId: string): Promise<SyncExecutionResult> {
    const startTime = Date.now()
    const executionLog: any[] = []
    
    try {
      // Load sync schedule with related data
      const schedule = await this.loadSyncSchedule(scheduleId)
      if (!schedule) {
        throw new Error('Sync schedule not found')
      }

      executionLog.push({ step: 'schedule_loaded', timestamp: new Date().toISOString() })

      // Update schedule status to RUNNING
      await query(
        `UPDATE public.data_sync_schedules 
         SET last_run_status = 'RUNNING', last_run_at = NOW()
         WHERE id = $1`,
        [scheduleId]
      )

      let result: SyncExecutionResult

      // Attempt error recovery if needed (before sync)
      // Get last run error from database if previous run failed
      const { rows: lastRunRows } = await query(
        `SELECT last_run_status, last_run_error FROM public.data_sync_schedules WHERE id = $1`,
        [scheduleId]
      )
      const lastRunStatus = lastRunRows[0]?.last_run_status
      const lastRunError = lastRunRows[0]?.last_run_error
      
      let recoveryAttempted = false
      if (lastRunStatus === 'FAILED' && lastRunError) {
        const recovery = await this.attemptErrorRecovery(scheduleId, lastRunError, schedule)
        if (recovery.recovered && recovery.recoveryAction === 'fallback_query') {
          recoveryAttempted = true
        }
      }

      // Execute sync based on connection type
      if (schedule.external_connection?.connection_type === 'api') {
        result = await this.syncFromAPI(schedule, executionLog)
      } else {
        result = await this.syncFromDatabase(schedule, executionLog)
      }

      // If sync failed, attempt recovery
      if (!result.success && !recoveryAttempted) {
        const recovery = await this.attemptErrorRecovery(scheduleId, result.error || '', schedule)
        if (recovery.recovered && recovery.recoveryAction === 'fallback_query') {
          // Retry with fallback query
          if (schedule.external_connection?.connection_type === 'api') {
            result = await this.syncFromAPI(schedule, executionLog)
          } else {
            result = await this.syncFromDatabase(schedule, executionLog)
          }
        }
      }

      const duration = Date.now() - startTime
      result.duration_ms = duration
      result.execution_log = executionLog

      // Update schedule status
      await query(
        `UPDATE public.data_sync_schedules 
         SET last_run_status = $1, 
             last_run_error = $2,
             next_run_at = $3
         WHERE id = $4`,
        [
          result.success ? 'COMPLETED' : 'FAILED',
          result.error || null,
          this.calculateNextRunTime(schedule.schedule_type, (schedule as any).schedule_config),
          scheduleId
        ]
      )

      // Update data model sync status
      if (result.success) {
        await query(
          `UPDATE public.data_models 
           SET last_synced_at = NOW(), sync_status = 'COMPLETED'
           WHERE id = $1`,
          [schedule.data_model_id]
        )

        // Reset retry count on success
        await query(
          `UPDATE public.data_sync_schedules 
           SET current_retry_count = 0 
           WHERE id = $1`,
          [scheduleId]
        )

        // Trigger dependent workflows if configured
        await this.triggerDependentWorkflows(scheduleId, true)

        // Send success notifications
        if (schedule.notify_on_success && schedule.notification_emails && schedule.notification_emails.length > 0) {
          const executionId = await this.saveExecutionLog(scheduleId, result)
          await NotificationService.sendSyncSuccessNotification(
            schedule.name,
            schedule.notification_emails,
            {
              records_fetched: result.records_fetched,
              records_inserted: result.records_inserted,
              records_updated: result.records_updated,
              duration_ms: result.duration_ms,
              execution_id: executionId
            }
          )
        }
      } else {
        // Handle retry logic for failures
        const shouldRetry = await this.handleRetryLogic(scheduleId, schedule, result)
        
        if (!shouldRetry) {
          // Trigger workflows on failure if configured
          await this.triggerDependentWorkflows(scheduleId, false)

          // Send failure notifications
          if (schedule.notify_on_failure && schedule.notification_emails && schedule.notification_emails.length > 0) {
            const executionId = await this.saveExecutionLog(scheduleId, result)
            await NotificationService.sendSyncFailureNotification(
              schedule.name,
              schedule.notification_emails,
              {
                error: result.error || 'Unknown error',
                error_details: result.error_details,
                records_fetched: result.records_fetched,
                execution_id: executionId
              }
            )
          }

          // Check and trigger alerts
          await this.checkAndTriggerAlerts(scheduleId, result)
        }
      }

      // Save execution log (if not already saved)
      if (!result.success || !schedule.notify_on_success) {
        await this.saveExecutionLog(scheduleId, result)
      }

      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result: SyncExecutionResult = {
        success: false,
        records_fetched: 0,
        records_processed: 0,
        records_inserted: 0,
        records_updated: 0,
        records_deleted: 0,
        records_failed: 0,
        error: error.message,
        error_details: error,
        execution_log: executionLog,
        duration_ms: duration
      }

      await query(
        `UPDATE public.data_sync_schedules 
         SET last_run_status = 'FAILED', last_run_error = $1
         WHERE id = $2`,
        [error.message, scheduleId]
      )

      await this.saveExecutionLog(scheduleId, result)

      return result
    }
  }

  private declare syncFromAPI: (schedule: SyncSchedule, executionLog: any[]) => Promise<SyncExecutionResult>
  private declare syncFromDatabase: (schedule: SyncSchedule, executionLog: any[]) => Promise<SyncExecutionResult>
  private declare processAndInsertData: ( schedule: SyncSchedule, data: any[], executionLog: any[] ) => Promise<SyncExecutionResult>
  private declare insertDataRecord: ( dataModelId: string, record: any, attributeMap: Map<string, string> ) => Promise<string>
  private declare updateDataRecord: ( recordId: string, record: any, attributeMap: Map<string, string> ) => Promise<void>
  private declare applyDataMapping: (record: any, mapping?: any) => any
  private declare getNestedValue: (obj: any, path: string) => any
  private declare loadSyncSchedule: (scheduleId: string) => Promise<SyncSchedule | null>
  private declare getLastSyncTimestamp: (scheduleId: string) => Promise<Date | null>
  private declare calculateNextRunTime: (scheduleType: string, scheduleConfig: any) => Date
  private declare triggerDependentWorkflows: (scheduleId: string, onSuccess: boolean) => Promise<void>
  private declare saveExecutionLog: (scheduleId: string, result: SyncExecutionResult) => Promise<string>
  private declare handleRetryLogic: ( scheduleId: string, schedule: SyncSchedule, result: SyncExecutionResult ) => Promise<boolean>
  private declare validateRecord: (scheduleId: string, record: any) => Promise<{ valid: boolean; errors: string[] }>
  private declare attemptErrorRecovery: (
    scheduleId: string,
    error: string,
    schedule: SyncSchedule
  ) => Promise<{ recovered: boolean; recoveryAction?: string }>
  private declare checkAndTriggerAlerts: ( scheduleId: string, result: SyncExecutionResult ) => Promise<void>
}

Object.assign(DataSyncExecutor.prototype, dataSyncExecutorMethods1, dataSyncExecutorMethods2, dataSyncExecutorMethods3)
