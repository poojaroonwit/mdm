import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId') || 'all'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    // const provider = searchParams.get('provider') || 'all' // storage_provider not supported in SpaceAttachmentStorage

    // Build the query with filters
    // Use space_attachment_storage table
    let whereConditions = [] // DeletedAt not in schema
    let queryParams: any[] = []
    let paramIndex = 1

    if (spaceId !== 'all') {
      whereConditions.push(`a.space_id = $${paramIndex}`)
      queryParams.push(spaceId)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`a.file_name ILIKE $${paramIndex}`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (type !== 'all') {
      if (type === 'image') {
        whereConditions.push(`a.mime_type LIKE 'image/%'`)
      } else if (type === 'video') {
        whereConditions.push(`a.mime_type LIKE 'video/%'`)
      } else if (type === 'audio') {
        whereConditions.push(`a.mime_type LIKE 'audio/%'`)
      } else if (type === 'document') {
        whereConditions.push(`(a.mime_type LIKE 'text/%' OR a.mime_type LIKE 'application/pdf' OR a.mime_type LIKE 'application/msword' OR a.mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`)
      } else if (type === 'archive') {
        whereConditions.push(`(a.mime_type LIKE 'application/zip' OR a.mime_type LIKE 'application/x-rar' OR a.mime_type LIKE 'application/x-7z')`)
      }
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // Get attachments with space information
    const attachments = await query(`
      SELECT 
        a.id, 
        a.file_name as name, 
        a.file_name as original_name, 
        a.file_size as size, 
        a.mime_type, 
        a.file_path as url, 
        null as thumbnail_url,
        false as is_public, 
        a.space_id, 
        null as entity_id, 
        null as entity_type, 
        a.created_at, 
        a.created_at as updated_at,
        null as uploaded_by, 
        'local' as storage_provider, 
        '{}'::jsonb as metadata,
        s.name as space_name,
        null as uploaded_by_name
      FROM space_attachment_storage a
      LEFT JOIN spaces s ON a.space_id = s.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 100
    `, queryParams)

    return NextResponse.json({
      attachments: attachments.rows.map(row => ({
        ...row,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }))
    })
  }

export const GET = withErrorHandling(getHandler, 'GET /api/admin/attachments')
