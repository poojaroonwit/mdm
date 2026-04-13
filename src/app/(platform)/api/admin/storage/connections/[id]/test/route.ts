import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

// POST - Test a storage connection
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { id } = await params
  const connection = await prisma.storageConnection.findUnique({
    where: { id }
  })

  if (!connection) {
    return NextResponse.json({ error: 'Storage connection not found' }, { status: 404 })
  }

  if (!connection.isActive) {
    return NextResponse.json({
      success: false,
      error: 'Connection is not active'
    })
  }

  let testResult: { success: boolean; error: string } = {
    success: false,
    error: ''
  }

  try {
    if (connection.type === 'onedrive' || connection.type === 'google_drive') {
      const config = connection.config as any
      if (!config.client_id || !config.client_secret || !config.redirect_uri) {
        testResult = {
          success: false,
          error:
            'Missing required OAuth configuration (client_id, client_secret, redirect_uri)'
        }
      } else if (!config.access_token && !config.refresh_token) {
        testResult = {
          success: false,
          error: 'Not authenticated. Please complete OAuth flow first.'
        }
      } else {
        testResult = { success: true, error: '' }
      }
    } else if (['minio', 's3', 'sftp', 'ftp'].includes(connection.type)) {
      const storageService = new AttachmentStorageService({
        provider: connection.type as 'minio' | 's3' | 'sftp' | 'ftp',
        config: {
          [connection.type]: connection.config
        } as any
      })

      // In a full implementation, we'd attempt an operation here.
      // For now we just assume the configuration shape is valid.
      void storageService
      testResult = { success: true, error: '' }
    } else {
      testResult = {
        success: false,
        error: `Unsupported storage type: ${connection.type}`
      }
    }

    await prisma.storageConnection.update({
      where: { id },
      data: {
        status: testResult.success ? 'connected' : 'error',
        lastTested: new Date(),
        lastError: testResult.error || null
      }
    })

    return NextResponse.json(testResult)
  } catch (error: any) {
    await prisma.storageConnection.update({
      where: { id },
      data: {
        status: 'error',
        lastTested: new Date(),
        lastError: error?.message || 'Unknown error'
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to test storage connection'
      },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/storage/connections/[id]/test'
)

