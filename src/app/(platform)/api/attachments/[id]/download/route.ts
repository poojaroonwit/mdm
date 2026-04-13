import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }



    const { id: attachmentId } = await params

    // Get attachment metadata using Prisma
    const attachment = await db.attachmentFile.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Get active storage connection
    const storageConnection = await db.storageConnection.findFirst({
      where: { 
        isActive: true,
        type: { in: ['minio', 's3', 'sftp', 'ftp'] }
      }
    })

    if (!storageConnection) {
      return NextResponse.json({ error: 'No active storage connection found' }, { status: 500 })
    }

    // Initialize storage service
    const storageService = new AttachmentStorageService({
      provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
      config: {
        [storageConnection.type]: storageConnection.config
      } as any
    })

    // Download file
    const downloadResult = await storageService.downloadFile(attachment.filePath)

    if (!downloadResult.success) {
      return NextResponse.json({ 
        error: downloadResult.error || 'Download failed' 
      })
    }

    // Convert stream to buffer
    const chunks: Buffer[] = []
    const stream = downloadResult.stream!
    
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    
    const fileBuffer = Buffer.concat(chunks)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/attachments/[id]/download')
