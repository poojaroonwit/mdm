import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { getConfiguredSiteUrl } from '@/lib/system-runtime-settings'

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

  const { id: fileId } = await params
  const {
    isPublic,
    permissionLevel = 'view',
    expiresIn = 3600
  }: {
    isPublic?: boolean
    permissionLevel?: string
    expiresIn?: number
  } = await request.json()

  const file = await db.spaceAttachmentStorage.findUnique({
    where: { id: fileId },
    select: {
      filePath: true,
      fileName: true,
      spaceId: true
    }
  })

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  let publicUrl: string | null = null
  const siteUrl = await getConfiguredSiteUrl(request)

  if (isPublic) {
    const storageConnection = await db.storageConnection.findFirst({
      where: {
        isActive: true,
        type: { in: ['minio', 's3', 'sftp', 'ftp'] }
      }
    })

    if (storageConnection) {
      const storageService = new AttachmentStorageService({
        provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
        config: {
          [storageConnection.type]: storageConnection.config
        } as any
      })

      const fileName = file.filePath?.split('/').pop() || file.fileName
      const urlResult = await storageService.generatePublicUrl(fileName, expiresIn)

      if (urlResult.success && urlResult.url) {
        publicUrl = urlResult.url
      } else {
        publicUrl = `${siteUrl}/api/admin/storage/files/${fileId}/content`
      }
    } else {
      publicUrl = `${siteUrl}/api/admin/storage/files/${fileId}/content`
    }
  }

  return NextResponse.json({
    file: {
      id: fileId,
      isPublic,
      permissionLevel,
      publicUrl
    }
  })
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/storage/files/[id]/share'
)

