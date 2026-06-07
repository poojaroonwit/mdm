import { query, db as prisma } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { NotificationService } from '@/lib/notifications'
import type { SyncExecutionResult, SyncSchedule } from '../data-sync-executor'

export const dataSyncExecutorMethods1: Record<string, Function> & ThisType<any> = {
  /**
   * Sync data from API endpoint
   */
  async syncFromAPI(schedule: SyncSchedule, executionLog: any[]): Promise<SyncExecutionResult> {
    const conn = schedule.external_connection!
    executionLog.push({ step: 'api_sync_started', url: conn.api_url })

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(conn.api_headers || {})
    }

    // Add authentication - retrieve from Vault if needed
    let apiAuthToken = conn.api_auth_token
    let apiAuthPassword = conn.api_auth_password
    let apiAuthApiKey = conn.api_auth_apikey_value
    
    // Check if credentials are stored in Vault
    if (apiAuthToken?.startsWith('vault://') || apiAuthPassword?.startsWith('vault://') || apiAuthApiKey?.startsWith('vault://')) {
      const { getSecretsManager } = await import('@/lib/secrets-manager')
      const secretsManager = getSecretsManager()
      const connectionId = (conn as any).id
      
      if (connectionId) {
        const vaultCreds = await secretsManager.getExternalApiCredentials(connectionId)
        if (vaultCreds) {
          if (apiAuthToken?.startsWith('vault://')) {
            apiAuthToken = vaultCreds.authToken || apiAuthToken
          }
          if (apiAuthPassword?.startsWith('vault://')) {
            apiAuthPassword = vaultCreds.password || apiAuthPassword
          }
          if (apiAuthApiKey?.startsWith('vault://')) {
            apiAuthApiKey = vaultCreds.apiKey || apiAuthApiKey
          }
        }
      }
    } else {
      // Decrypt if stored in database
      const { decryptApiKey } = await import('@/lib/encryption')
      if (apiAuthToken) apiAuthToken = decryptApiKey(apiAuthToken) || apiAuthToken
      if (apiAuthPassword) apiAuthPassword = decryptApiKey(apiAuthPassword) || apiAuthPassword
      if (apiAuthApiKey) apiAuthApiKey = decryptApiKey(apiAuthApiKey) || apiAuthApiKey
    }
    
    if (conn.api_auth_type === 'bearer' && apiAuthToken) {
      headers['Authorization'] = `Bearer ${apiAuthToken}`
    } else if (conn.api_auth_type === 'basic' && conn.api_auth_username && apiAuthPassword) {
      const credentials = Buffer.from(`${conn.api_auth_username}:${apiAuthPassword}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    } else if (conn.api_auth_type === 'apikey' && conn.api_auth_apikey_name && apiAuthApiKey) {
      headers[conn.api_auth_apikey_name] = apiAuthApiKey
    }

    // Make API request
    const fetchOptions: RequestInit = {
      method: conn.api_method || 'GET',
      headers
    }

    if ((conn.api_method === 'POST' || conn.api_method === 'PUT' || conn.api_method === 'PATCH') && conn.api_body) {
      fetchOptions.body = typeof conn.api_body === 'string' ? conn.api_body : JSON.stringify(conn.api_body)
    }

    const response = await fetch(conn.api_url!, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    let data: any
    const responseText = await response.text()
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error('API response is not valid JSON')
    }

    // Extract data using response path if specified
    if (conn.api_response_path) {
      const pathParts = conn.api_response_path.split('.')
      for (const part of pathParts) {
        data = data?.[part]
      }
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = data ? [data] : []
    }

    executionLog.push({ step: 'api_data_fetched', record_count: data.length })

    // Process and insert data
    return await this.processAndInsertData(schedule, data, executionLog)
  },

  /**
   * Sync data from database
   */
  async syncFromDatabase(schedule: SyncSchedule, executionLog: any[]): Promise<SyncExecutionResult> {
    const conn = schedule.external_connection!
    executionLog.push({ step: 'database_sync_started', host: conn.host, database: conn.database })

    // Create external database client with Vault credential retrieval
    const { createExternalClientWithCredentials } = await import('@/lib/external-connection-helper')
    const client = await createExternalClientWithCredentials({
      id: schedule.external_connection_id,
      db_type: conn.db_type as 'postgres' | 'mysql',
      host: conn.host!,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      password: conn.password,
      options: null
    })

    try {
      // Build query
      let sqlQuery: string
      if (schedule.source_query) {
        sqlQuery = schedule.source_query
      } else {
        const schema = schedule.data_model?.external_schema || conn.database
        const table = schedule.data_model?.external_table
        
        if (!table) {
          throw new Error('External table not specified for database sync')
        }

        // For incremental sync, add WHERE clause
        if (schedule.sync_strategy === 'INCREMENTAL' && schedule.incremental_timestamp_column) {
          const lastSync = await this.getLastSyncTimestamp(schedule.id)
          if (lastSync) {
            sqlQuery = `SELECT * FROM ${schema ? `"${schema}".` : ''}"${table}" WHERE "${schedule.incremental_timestamp_column}" > $1 ORDER BY "${schedule.incremental_timestamp_column}"`
          } else {
            sqlQuery = `SELECT * FROM ${schema ? `"${schema}".` : ''}"${table}" ORDER BY "${schedule.incremental_timestamp_column}"`
          }
        } else {
          sqlQuery = `SELECT * FROM ${schema ? `"${schema}".` : ''}"${table}"`
        }
      }

      // Apply limit
      if (schedule.max_records_per_sync) {
        sqlQuery += ` LIMIT ${schedule.max_records_per_sync}`
      }

      executionLog.push({ step: 'database_query_executed', query: sqlQuery })

      // Execute query
      let data: any[]
      if (schedule.sync_strategy === 'INCREMENTAL' && schedule.incremental_timestamp_column) {
        const lastSync = await this.getLastSyncTimestamp(schedule.id)
        const { rows } = lastSync 
          ? await client.query(sqlQuery, [lastSync])
          : await client.query(sqlQuery)
        data = rows
      } else {
        const { rows } = await client.query(sqlQuery)
        data = rows
      }

      executionLog.push({ step: 'database_data_fetched', record_count: data.length })

      // Process and insert data
      return await this.processAndInsertData(schedule, data, executionLog)
    } finally {
      await client.close()
    }
  },

  /**
   * Process fetched data and insert into target data model
   */
  async processAndInsertData(
    schedule: SyncSchedule,
    data: any[],
    executionLog: any[]
  ): Promise<SyncExecutionResult> {
    const result: SyncExecutionResult = {
      success: true,
      records_fetched: data.length,
      records_processed: 0,
      records_inserted: 0,
      records_updated: 0,
      records_deleted: 0,
      records_failed: 0,
      duration_ms: 0
    }

    if (data.length === 0) {
      executionLog.push({ step: 'no_data_to_process' })
      return result
    }

    // Clear existing data if full refresh
    if (schedule.sync_strategy === 'FULL_REFRESH' && schedule.clear_existing_data) {
      executionLog.push({ step: 'clearing_existing_data' })
      const deleteResult = await query(
        `DELETE FROM public.data_records 
         WHERE data_model_id = $1`,
        [schedule.data_model_id]
      )
      result.records_deleted = (deleteResult as any).rowCount || deleteResult.rows?.length || 0
    }

    // Fetch attributes for the data model to enable proper mapping
    const { rows: attributes } = await query(
      `SELECT id, name, type FROM public.data_model_attributes 
       WHERE data_model_id = $1 AND is_active = true`,
      [schedule.data_model_id]
    )
    
    // Create a map from attribute name to attribute ID for quick lookup
    const attributeMap = new Map<string, string>()
    for (const attr of attributes) {
      attributeMap.set(attr.name, attr.id)
    }

    // Process each record
    for (const record of data) {
      try {
        // Apply data mapping if specified
        const mappedRecord = this.applyDataMapping(record, schedule.data_mapping)

        // Validate record
        const validation = await this.validateRecord(schedule.id, mappedRecord)
        if (!validation.valid) {
          result.records_failed++
          executionLog.push({
            step: 'validation_failed',
            record: mappedRecord,
            errors: validation.errors
          })
          continue
        }

        if (schedule.sync_strategy === 'INCREMENTAL' && schedule.incremental_key) {
          // Find the attribute ID for the incremental key
          const incrementalAttrId = attributeMap.get(schedule.incremental_key) || 
            attributes.find(a => a.name === schedule.incremental_key)?.id
          
          if (incrementalAttrId && mappedRecord[schedule.incremental_key] !== undefined) {
            // Check if record exists by looking for the incremental key value
            const { rows: existingRows } = await query(
              `SELECT dr.id FROM public.data_records dr
               JOIN public.data_record_values drv ON dr.id = drv.data_record_id
               WHERE dr.data_model_id = $1 
               AND drv.attribute_id = $2 
               AND drv.value = $3
               LIMIT 1`,
              [schedule.data_model_id, incrementalAttrId, String(mappedRecord[schedule.incremental_key])]
            )

            if (existingRows.length > 0) {
              // Update existing record
              await this.updateDataRecord(existingRows[0].id, mappedRecord, attributeMap)
              result.records_updated++
            } else {
              // Insert new record
              await this.insertDataRecord(schedule.data_model_id, mappedRecord, attributeMap)
              result.records_inserted++
            }
          } else {
            // No incremental key match found, just insert
            await this.insertDataRecord(schedule.data_model_id, mappedRecord, attributeMap)
            result.records_inserted++
          }
        } else {
          // Insert new record (for FULL_REFRESH or APPEND strategies)
          await this.insertDataRecord(schedule.data_model_id, mappedRecord, attributeMap)
          result.records_inserted++
        }

        result.records_processed++
      } catch (error: any) {
        result.records_failed++
        executionLog.push({ 
          step: 'record_processing_failed', 
          record, 
          error: error.message 
        })
      }
    }

    executionLog.push({ 
      step: 'sync_completed',
      summary: {
        inserted: result.records_inserted,
        updated: result.records_updated,
        failed: result.records_failed
      }
    })

    return result
  },

  /**
   * Insert a data record into the target data model using proper EAV structure
   */
  async insertDataRecord(
    dataModelId: string, 
    record: any, 
    attributeMap: Map<string, string>
  ): Promise<string> {
    // Insert the main record
    const { rows: recordRows } = await query(
      `INSERT INTO public.data_records (data_model_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING id`,
      [dataModelId]
    )
    const recordId = recordRows[0].id

    // Insert attribute values
    const values: Array<{ attribute_id: string; value: any }> = []
    for (const [fieldName, fieldValue] of Object.entries(record)) {
      if (fieldValue === null || fieldValue === undefined) continue
      
      const attributeId = attributeMap.get(fieldName)
      if (attributeId) {
        values.push({ attribute_id: attributeId, value: String(fieldValue) })
      }
    }

    if (values.length > 0) {
      const insertValuesSql = `
        INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
        VALUES ${values.map((_, idx) => `($1, $${idx * 2 + 2}, $${idx * 2 + 3})`).join(', ')}
      `
      const flatParams: any[] = [recordId]
      for (const v of values) {
        flatParams.push(v.attribute_id, v.value)
      }
      await query(insertValuesSql, flatParams)
    }

    return recordId
  },
}
