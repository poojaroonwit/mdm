import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db, query } from '@/lib/db'
import { DEFAULT_STORAGE_CONFIG } from '@/lib/storage-config'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params

    // Check if user has access to this space
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id
      }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    // Check if user has admin/owner role
    if (!['ADMIN', 'OWNER'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get attachment storage configuration
    const storageConfig = await db.spaceAttachmentStorage.findFirst({
      where: { spaceId }
    })

    // Return default MinIO config if no config exists
    const defaultConfig = {
      provider: 'minio',
      config: DEFAULT_STORAGE_CONFIG
    }

    return NextResponse.json({
      storage: storageConfig || defaultConfig
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const body = await request.json()

    // Check if user has access to this space
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id
      }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    // Check if user has admin/owner role
    if (!['ADMIN', 'OWNER'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate required fields based on provider
    const { provider, config } = body

    if (!provider || !config) {
      return NextResponse.json({ error: 'Provider and config are required' }, { status: 400 })
    }

    // Validate provider-specific required fields
    const requiredFields = {
      minio: ['endpoint', 'access_key', 'secret_key', 'bucket'],
      s3: ['access_key_id', 'secret_access_key', 'bucket'],
      sftp: ['host', 'username', 'password'],
      ftp: ['host', 'username', 'password']
    }

    const providerConfig = config[provider]
    if (!providerConfig) {
      return NextResponse.json({ error: `Invalid provider: ${provider}` }, { status: 400 })
    }

    const missingFields = requiredFields[provider as keyof typeof requiredFields]?.filter(
      field => !providerConfig[field]
    )

    if (missingFields && missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields for ${provider}: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Upsert the configuration using raw SQL
    // Note: SpaceAttachmentStorage model doesn't have provider/config fields in schema
    // Using raw SQL to work with the actual table structure
    await query(
      `INSERT INTO space_attachment_storage (space_id, provider, config, created_by, is_active, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (space_id) 
       DO UPDATE SET provider = $2, config = $3, updated_at = NOW()`,
      [spaceId, provider, JSON.stringify(config), session.user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating attachment storage:', error)
    return NextResponse.json(
      { error: 'Failed to update storage config', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/attachment-storage')
export const PUT = withErrorHandling(putHandler, 'PUT /api/spaces/[id]/attachment-storage')
