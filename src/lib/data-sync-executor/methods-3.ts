import { query, db as prisma } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { NotificationService } from '@/lib/notifications'
import type { SyncExecutionResult, SyncSchedule } from '../data-sync-executor'

export const dataSyncExecutorMethods3: Record<string, Function> & ThisType<any> = {
  /**
   * Validate data record against validation rules
   */
  async validateRecord(
    scheduleId: string,
    record: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const { rows: rules } = await query(
      `SELECT field_name, rule_type, rule_config, error_message
       FROM public.data_sync_validation_rules
       WHERE sync_schedule_id = $1 AND is_active = true`,
      [scheduleId]
    )

    const errors: string[] = []

    for (const rule of rules) {
      const fieldValue = record[rule.field_name]
      const config = rule.rule_config || {}

      switch (rule.rule_type) {
        case 'required':
          if (!fieldValue && fieldValue !== 0 && fieldValue !== false) {
            errors.push(rule.error_message || `Field ${rule.field_name} is required`)
          }
          break

        case 'type':
          const expectedType = config.type
          const actualType = typeof fieldValue
          if (expectedType && actualType !== expectedType) {
            errors.push(rule.error_message || `Field ${rule.field_name} must be of type ${expectedType}`)
          }
          break

        case 'format':
          if (fieldValue && config.regex) {
            const regex = new RegExp(config.regex)
            if (!regex.test(String(fieldValue))) {
              errors.push(rule.error_message || `Field ${rule.field_name} format is invalid`)
            }
          }
          break

        case 'range':
          if (fieldValue !== null && fieldValue !== undefined) {
            const numValue = Number(fieldValue)
            if (config.min !== undefined && numValue < config.min) {
              errors.push(rule.error_message || `Field ${rule.field_name} must be at least ${config.min}`)
            }
            if (config.max !== undefined && numValue > config.max) {
              errors.push(rule.error_message || `Field ${rule.field_name} must be at most ${config.max}`)
            }
          }
          break

        case 'custom':
          // Custom validation logic would go here
          break
      }
    }

    return { valid: errors.length === 0, errors }
  },

  /**
   * Attempt error recovery based on recovery actions
   */
  async attemptErrorRecovery(
    scheduleId: string,
    error: string,
    schedule: SyncSchedule
  ): Promise<{ recovered: boolean; recoveryAction?: string }> {
    const { rows: recoveryActions } = await query(
      `SELECT error_pattern, recovery_action, recovery_config
       FROM public.data_sync_recovery_actions
       WHERE sync_schedule_id = $1 AND is_active = true
       ORDER BY created_at`,
      [scheduleId]
    )

    for (const action of recoveryActions) {
      // Check if error matches pattern
      const pattern = action.error_pattern
      if (!pattern || error.includes(pattern) || new RegExp(pattern, 'i').test(error)) {
        switch (action.recovery_action) {
          case 'skip':
            console.log(`[Data Sync] Recovery: Skipping record due to error pattern match`)
            return { recovered: true, recoveryAction: 'skip' }

          case 'retry':
            // Already handled by retry logic
            return { recovered: false }

          case 'fallback_query':
            if (action.recovery_config?.fallback_query) {
              schedule.source_query = action.recovery_config.fallback_query
              console.log(`[Data Sync] Recovery: Using fallback query`)
              return { recovered: true, recoveryAction: 'fallback_query' }
            }
            break

          case 'notify_only':
            // Just notify, don't recover
            return { recovered: false }
        }
      }
    }

    return { recovered: false }
  },

  /**
   * Check and trigger alerts based on alert configurations
   */
  async checkAndTriggerAlerts(
    scheduleId: string,
    result: SyncExecutionResult
  ): Promise<void> {
    try {
      const { rows: alerts } = await query(
        `SELECT id, alert_type, alert_config
         FROM public.data_sync_alerts
         WHERE sync_schedule_id = $1 AND is_active = true`,
        [scheduleId]
      )

      for (const alert of alerts) {
        const config = alert.alert_config || {}
        let shouldTrigger = false
        let severity = 'warning'
        let message = ''

        switch (alert.alert_type) {
          case 'failure_threshold':
            // Check if failure count exceeds threshold
            const { rows: recentFailures } = await query(
              `SELECT COUNT(*) as count
               FROM public.data_sync_executions
               WHERE sync_schedule_id = $1 
                 AND status = 'FAILED'
                 AND started_at > NOW() - INTERVAL '${config.time_window_hours || 24} hours'`,
              [scheduleId]
            )
            const failureCount = parseInt(recentFailures[0]?.count || '0')
            if (failureCount >= (config.threshold || 3)) {
              shouldTrigger = true
              severity = failureCount >= (config.critical_threshold || 5) ? 'critical' : 'error'
              message = `Sync has failed ${failureCount} times in the last ${config.time_window_hours || 24} hours`
            }
            break

          case 'record_count_anomaly':
            // Check if record count deviates significantly from average
            const { rows: avgData } = await query(
              `SELECT 
                 AVG(records_fetched) as avg_fetched,
                 STDDEV(records_fetched) as stddev_fetched
               FROM public.data_sync_executions
               WHERE sync_schedule_id = $1 
                 AND status = 'COMPLETED'
                 AND started_at > NOW() - INTERVAL '7 days'`,
              [scheduleId]
            )
            const avgFetched = parseFloat(avgData[0]?.avg_fetched || '0')
            const stddev = parseFloat(avgData[0]?.stddev_fetched || '0')
            const threshold = config.deviation_threshold || 2.0

            if (avgFetched > 0 && stddev > 0) {
              const deviation = Math.abs(result.records_fetched - avgFetched) / stddev
              if (deviation > threshold) {
                shouldTrigger = true
                severity = deviation > (threshold * 2) ? 'critical' : 'warning'
                message = `Record count anomaly: ${result.records_fetched} fetched (average: ${Math.round(avgFetched)}, deviation: ${deviation.toFixed(2)}σ)`
              }
            }
            break

          case 'duration_anomaly':
            // Check if execution duration is abnormally long
            const maxDuration = config.max_duration_ms || 300000 // 5 minutes default
            if (result.duration_ms > maxDuration) {
              shouldTrigger = true
              severity = result.duration_ms > (maxDuration * 2) ? 'error' : 'warning'
              message = `Sync duration anomaly: ${Math.round(result.duration_ms / 1000)}s (threshold: ${Math.round(maxDuration / 1000)}s)`
            }
            break

          case 'error_rate':
            // Check error/failure rate
            const errorRate = result.records_failed / Math.max(result.records_processed, 1)
            const maxErrorRate = config.max_error_rate || 0.1 // 10% default
            if (errorRate > maxErrorRate) {
              shouldTrigger = true
              severity = errorRate > (maxErrorRate * 2) ? 'error' : 'warning'
              message = `High error rate: ${(errorRate * 100).toFixed(1)}% (${result.records_failed}/${result.records_processed} records failed)`
            }
            break
        }

        if (shouldTrigger) {
          // Create alert history entry
          await query(
            `INSERT INTO public.data_sync_alert_history
             (alert_id, sync_schedule_id, alert_type, severity, message, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              alert.id,
              scheduleId,
              alert.alert_type,
              severity,
              message,
              JSON.stringify({ result: { ...result, execution_log: undefined } })
            ]
          )

          // Send notification if configured
          const { rows: scheduleRows } = await query(
            `SELECT notification_emails, notify_on_failure
             FROM public.data_sync_schedules
             WHERE id = $1`,
            [scheduleId]
          )
          
          if (scheduleRows[0]?.notify_on_failure && scheduleRows[0]?.notification_emails?.length > 0) {
            await NotificationService.sendEmail({
              to: scheduleRows[0].notification_emails,
              subject: `🚨 Alert: ${severity.toUpperCase()} - ${message}`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: ${severity === 'critical' ? '#dc2626' : severity === 'error' ? '#f59e0b' : '#f97316'};">${message}</h2>
                  <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
                  <p><strong>Details:</strong></p>
                  <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${JSON.stringify(result, null, 2)}</pre>
                </div>
              `
            })
          }
        }
      }
    } catch (error) {
      console.error('[Data Sync] Error checking alerts:', error)
    }
  },
}
