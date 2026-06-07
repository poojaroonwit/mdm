import { query, prisma } from './db'

// Dynamic import for Elasticsearch (server-side only)
const getElasticsearchLogger = async () => {
  if (typeof window === 'undefined') {
    try {
      const { sendLogToElasticsearch } = await import('./elasticsearch-client')
      return sendLogToElasticsearch
    } catch (error) {
      return () => Promise.resolve()
    }
  }
  return () => Promise.resolve()
}

// Dynamic import for SigNoz (server-side only)
const getSigNozLogger = async () => {
  if (typeof window === 'undefined') {
    try {
      const { sendLogToSigNoz, isSigNozEnabled } = await import('./signoz-client')
      const enabled = await isSigNozEnabled()
      if (enabled) {
        return sendLogToSigNoz
      }
      return null
    } catch (error) {
      return null
    }
  }
  return null
}

export interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  userId?: string | null
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    // Check system settings for audit trail
    const settingsRecord = await prisma.systemSetting.findUnique({
      where: { key: 'global' }
    })

    if (settingsRecord) {
      try {
        const settings = JSON.parse(settingsRecord.value)
        if (settings.enableAuditTrail === false) {
          return null // Audit trail disabled
        }
      } catch (e) {
        // Fallback to enabled if settings parse fails
      }
    }

    // Helper function to check if a string is a valid UUID
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }

    // Generate a deterministic UUID from a string (for non-UUID entityIds)
    const generateDeterministicUUID = (str: string): string => {
      // Use a simple hash to generate a deterministic UUID v4-like string
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }

      // Generate a 32-character hex string from the hash
      // Use multiple hash iterations to get enough entropy
      const hash1 = Math.abs(hash).toString(16).padStart(8, '0')
      const hash2 = Math.abs((hash * 31 + str.length)).toString(16).padStart(8, '0')
      const hash3 = Math.abs((hash * 17 + (str.charCodeAt(0) || 0))).toString(16).padStart(8, '0')
      const hash4 = Math.abs((hash * 7 + (str.charCodeAt(str.length - 1) || 0))).toString(16).padStart(8, '0')

      const hex = (hash1 + hash2 + hash3 + hash4).slice(0, 32).padStart(32, '0')

      // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // y must be one of 8, 9, a, or b (first hex digit of 4th segment)
      // Ensure we have enough hex characters - hex should be 32 chars after padding
      const y = (parseInt(hex[19] || '0', 16) & 0x3 | 0x8).toString(16)
      // 4th segment needs exactly 4 hex digits: y + next 3 digits from hex[17:20]
      // Extract exactly 3 characters from position 17-19, pad if needed
      const next3 = (hex.substring(17, 20) || '000').padEnd(3, '0').substring(0, 3)
      // Combine y (1 char) + next3 (3 chars) = 4 chars total
      const segment4 = (y + next3).substring(0, 4).padEnd(4, '0')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${segment4}-${hex.slice(20, 32)}`
    }

    // Cast entityId to UUID if it's a valid UUID, otherwise generate a deterministic UUID
    // For non-UUID entityIds like 'system', we generate a deterministic UUID based on the value
    const entityIdValue = data.entityId && isValidUUID(data.entityId)
      ? data.entityId
      : data.entityId
        ? generateDeterministicUUID(data.entityId)
        : generateDeterministicUUID('unknown')

    // Validate userId is a UUID
    const userIdValue = data.userId && isValidUUID(data.userId)
      ? data.userId
      : null

    // Removed strict check for userId to allow null users (system actions)
    // and fallback logic below

    // Always use entityIdValue (now guaranteed to be a UUID)
    // Generate UUID for id using gen_random_uuid() if available, otherwise let Prisma handle it
    const insertQuery = `
      INSERT INTO audit_logs (id, action, entity_type, entity_id, old_value, new_value, user_id, ip_address, user_agent, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3::uuid, $4, $5, $6::uuid, $7, $8, NOW())
      RETURNING id, created_at
    `

    let result
    try {
      result = await query(insertQuery, [
        data.action,
        data.entityType,
        entityIdValue,
        data.oldValue ? JSON.stringify(data.oldValue) : null,
        data.newValue ? JSON.stringify(data.newValue) : null,
        userIdValue,
        data.ipAddress || null,
        data.userAgent || null
      ], 30000, { suppressErrorLog: true })
    } catch (error: any) {
      // Handle Foreign Key Violation
      // Prisma P2010: Raw query failed. Code: `23503`. Message: ... violates foreign key constraint ...
      const isFKViolation =
        error.code === '23503' ||
        (error.code === 'P2010' && (error.message?.includes('23503') || error.meta?.code === '23503'))

      if (isFKViolation && userIdValue) {
        console.warn(`Foreign key violation for userId ${userIdValue}. Retrying with null userId.`)
        result = await query(insertQuery, [
          data.action,
          data.entityType,
          entityIdValue,
          data.oldValue ? JSON.stringify(data.oldValue) : null,
          data.newValue ? JSON.stringify(data.newValue) : null,
          null, // Fallback to null user
          data.ipAddress || null,
          data.userAgent || null
        ])
      } else {
        throw error
      }
    }

    const auditLog = result.rows[0]

    // Send to Elasticsearch (fire and forget)
    getElasticsearchLogger().then(sendLog => {
      sendLog('audit', {
        id: auditLog.id,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: auditLog.created_at
      }).catch(() => { }) // Silently fail
    })

    // Send to SigNoz (fire and forget)
    getSigNozLogger().then(sendLog => {
      if (sendLog) {
        sendLog({
          severity: 'INFO',
          message: `Audit: ${data.action} on ${data.entityType}`,
          attributes: {
            id: auditLog.id,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            userId: data.userId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
          },
          timestamp: new Date(auditLog.created_at).getTime()
        }).catch(() => { }) // Silently fail
      }
    })

    return auditLog
  } catch (error: any) {
    // Handle missing table error gracefully
    const isTableMissing =
      error?.code === '42P01' ||
      error?.message?.includes('does not exist') ||
      error?.message?.includes('relation') ||
      error?.message?.includes('undefined_table')

    if (isTableMissing) {
      console.warn('Audit logs table does not exist. Skipping audit log creation.')
      return null
    }

    console.error('Error creating audit log:', error)
    // Don't rethrow, just return null to prevent breaking the main operation
    // The calling function should ideally also handle this, but being defensive here helps
    return null
  }
}

export async function getAuditLogs(filters: {
  entityType?: string
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  try {
    const {
      entityType,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters

    const offset = (page - 1) * limit

    const whereConditions = ['1=1']
    const queryParams: any[] = []
    let paramIndex = 1

    if (entityType) {
      whereConditions.push(`entity_type = $${paramIndex}`)
      queryParams.push(entityType)
      paramIndex++
    }

    if (action) {
      whereConditions.push(`action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`)
      queryParams.push(userId)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      queryParams.push(endDate)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Get audit logs with user information
    const auditLogsQuery = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const { rows } = await query(auditLogsQuery, queryParams)

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    throw error
  }
}
