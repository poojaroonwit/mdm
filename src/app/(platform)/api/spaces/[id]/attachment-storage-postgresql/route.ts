import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { DEFAULT_STORAGE_CONFIG } from '@/lib/storage-config'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params

    // Check if user has access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    const userRole = (memberResult.rows[0] as any).role

    // Get storage configuration for this space
    const storageResult = await query(
      'SELECT * FROM space_attachment_storage WHERE space_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [spaceId]
    )

    if (storageResult.rows.length === 0) {
      // Return default MinIO configuration
      return NextResponse.json({
        provider: 'minio',
        config: DEFAULT_STORAGE_CONFIG.minio
      })
    }

    const storage = storageResult.rows[0] as any
    return NextResponse.json({
      provider: storage.provider,
      config: storage.config
    })
  } catch (error: any) {
    console.error('Error fetching attachment storage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch storage config', details: error.message },
      { status: 500 }
    )
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const { provider, config } = await request.json()

    // Check if user has admin/owner role
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    const userRole = (memberResult.rows[0] as any).role
    if (!['owner', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate provider
    if (!['minio', 's3', 'sftp', 'ftp'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid storage provider' }, { status: 400 })
    }

    // Deactivate existing configurations
    await query(
      'UPDATE space_attachment_storage SET is_active = false WHERE space_id = $1',
      [spaceId]
    )

    // Insert new configuration
    const result = await query(
      'INSERT INTO space_attachment_storage (space_id, provider, config, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [spaceId, provider, JSON.stringify(config), userId]
    )

    const row = result.rows[0] as any
    return NextResponse.json({
      id: row.id,
      provider: row.provider,
      config: row.config,
      is_active: row.is_active
    })
  } catch (error: any) {
    console.error('Error updating attachment storage:', error)
    return NextResponse.json(
      { error: 'Failed to update storage config', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/attachment-storage-postgresql')
export const PUT = withErrorHandling(putHandler, 'PUT /api/spaces/[id]/attachment-storage-postgresql')
