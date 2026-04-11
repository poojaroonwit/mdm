import nodemailer from 'nodemailer'
import { query } from '@/lib/db'
import { getSmtpSettings } from '@/lib/smtp-settings'

/**
 * Email notification service for data sync and workflow events
 */
export class NotificationService {
  private static transporter: nodemailer.Transporter | null = null
  private static cachedConfigTime: number = 0
  private static readonly CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get SMTP configuration from system settings or legacy integration config
   */
  private static async getSmtpConfig() {
    const settingsConfig = await getSmtpSettings()
    if (settingsConfig) {
      return settingsConfig
    }

    // Fallback to legacy integration config if present
    try {
      const sql = `
        SELECT config, is_enabled
        FROM platform_integrations
        WHERE type = 'smtp'
          AND deleted_at IS NULL
          AND is_enabled = true
        LIMIT 1
      `
      
      const result = await query(sql, [], 5000)
      
      if (result.rows.length > 0) {
        const row = result.rows[0]
        const config = row.config as any
        
        if (config.host && config.user && config.pass) {
          return {
            host: config.host,
            port: parseInt(config.port || '587'),
            secure: config.secure === true || config.secure === 'true',
            auth: {
              user: config.user,
              pass: config.pass
            },
            from: config.from || config.user
          }
        }
      }
    } catch (error) {
      // Ignore DB errors and return an unconfigured state below
    }

    return {
      host: '',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      },
      from: ''
    }
  }

  /**
   * Initialize email transporter
   */
  private static async getTransporter(): Promise<nodemailer.Transporter | null> {
    const now = Date.now()
    
    // Refresh transporter if cache expired or not initialized
    if (!this.transporter || (now - this.cachedConfigTime > this.CONFIG_CACHE_TTL)) {
      const smtpConfig = await this.getSmtpConfig()

      // Only create transporter if SMTP is configured
      if (smtpConfig.auth.user && smtpConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(smtpConfig)
        this.cachedConfigTime = now
      } else {
        this.transporter = null
      }
    }

    return this.transporter
  }

  /**
   * Check if email notifications are configured
   */
  static async isConfigured(): Promise<boolean> {
    const config = await this.getSmtpConfig()
    return !!(config.auth.user && config.auth.pass)
  }

  /**
   * Send email notification
   */
  static async sendEmail(options: {
    to: string | string[]
    subject: string
    html: string
    text?: string
  }): Promise<boolean> {
    try {
      if (!(await this.isConfigured())) {
        console.warn('[Notifications] SMTP not configured, skipping email')
        return false
      }

      const transporter = await this.getTransporter()
      if (!transporter) return false

      const config = await this.getSmtpConfig()
      const from = config.from || config.auth.user

      await transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      })

      return true
    } catch (error) {
      console.error('[Notifications] Error sending email:', error)
      return false
    }
  }

  /**
   * Send data sync success notification
   */
  static async sendSyncSuccessNotification(
    scheduleName: string,
    emails: string[],
    details: {
      records_fetched: number
      records_inserted: number
      records_updated: number
      duration_ms: number
      execution_id?: string
    }
  ): Promise<boolean> {
    if (emails.length === 0) return false

    const durationSeconds = Math.round(details.duration_ms / 1000)
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a; margin-bottom: 20px;">✅ Data Sync Completed Successfully</h2>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; font-weight: 600;">${scheduleName}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #374151;">Execution Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Records Fetched:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${details.records_fetched.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Records Inserted:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #16a34a;">${details.records_inserted.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Records Updated:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1e40af;">${details.records_updated.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Duration:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${durationSeconds}s</td>
            </tr>
          </table>
        </div>

        ${details.execution_id ? `
        <p style="color: #6b7280; font-size: 14px;">
          Execution ID: <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${details.execution_id}</code>
        </p>
        ` : ''}

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This is an automated notification from your Data Management System.
        </p>
      </div>
    `

    return await this.sendEmail({
      to: emails,
      subject: `✅ Data Sync Success: ${scheduleName}`,
      html
    })
  }

  /**
   * Send data sync failure notification
   */
  static async sendSyncFailureNotification(
    scheduleName: string,
    emails: string[],
    details: {
      error: string
      error_details?: any
      records_fetched?: number
      execution_id?: string
    }
  ): Promise<boolean> {
    if (emails.length === 0) return false

    const errorMessage = details.error || 'Unknown error'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 20px;">❌ Data Sync Failed</h2>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; font-weight: 600;">${scheduleName}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #374151;">Error Details</h3>
          <div style="background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
            <code style="color: #dc2626; font-size: 14px; word-break: break-word;">${errorMessage}</code>
          </div>
        </div>

        ${details.records_fetched !== undefined ? `
        <p style="color: #6b7280; margin-bottom: 10px;">
          Records fetched before failure: <strong>${details.records_fetched.toLocaleString()}</strong>
        </p>
        ` : ''}

        ${details.execution_id ? `
        <p style="color: #6b7280; font-size: 14px;">
          Execution ID: <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${details.execution_id}</code>
        </p>
        ` : ''}

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⚠️ <strong>Action Required:</strong> Please review the error and fix the sync schedule configuration.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This is an automated notification from your Data Management System.
        </p>
      </div>
    `

    return await this.sendEmail({
      to: emails,
      subject: `❌ Data Sync Failed: ${scheduleName}`,
      html
    })
  }

  /**
   * Send workflow execution notification
   */
  static async sendWorkflowNotification(
    workflowName: string,
    emails: string[],
    success: boolean,
    details: {
      records_processed: number
      records_updated: number
      error?: string
      execution_id?: string
    }
  ): Promise<boolean> {
    if (emails.length === 0) return false

    if (success) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a; margin-bottom: 20px;">✅ Workflow Executed Successfully</h2>
          <p style="font-size: 16px; font-weight: 600;">${workflowName}</p>
          <p>Records Processed: <strong>${details.records_processed}</strong></p>
          <p>Records Updated: <strong>${details.records_updated}</strong></p>
        </div>
      `
      return await this.sendEmail({
        to: emails,
        subject: `✅ Workflow Success: ${workflowName}`,
        html
      })
    } else {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626; margin-bottom: 20px;">❌ Workflow Execution Failed</h2>
          <p style="font-size: 16px; font-weight: 600;">${workflowName}</p>
          <p style="color: #dc2626;">Error: ${details.error || 'Unknown error'}</p>
        </div>
      `
      return await this.sendEmail({
        to: emails,
        subject: `❌ Workflow Failed: ${workflowName}`,
        html
      })
    }
  }

  /**
   * Create in-app notification
   */
  static async createInAppNotification(
    userId: string,
    type: 'sync_success' | 'sync_failure' | 'workflow_success' | 'workflow_failure' | 'alert',
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO public.notifications (user_id, type, title, message, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
      )
    } catch (error) {
      console.error('[Notifications] Error creating in-app notification:', error)
    }
  }
}

