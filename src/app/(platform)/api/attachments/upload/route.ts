import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { v4 as uuidv4 } from 'uuid'

async function postHandler(request: NextRequest) {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const formData = await request.formData()
    const file = formData.get('file') as File
    const spaceId = formData.get('spaceId') as string
    const attributeId = formData.get('attributeId') as string

    if (!file || !spaceId || !attributeId) {
      return NextResponse.json({ 
        error: 'File, spaceId, and attributeId are required' 
      }, { status: 400 })
    }

    // Check if user has access to this space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
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

    // Basic file size validation (default 10MB limit)
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: `File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Initialize storage service
    const storageService = new AttachmentStorageService({
      provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
      config: {
        [storageConnection.type]: storageConnection.config
      } as any
    })

    // Upload file
    const uploadResult = await storageService.uploadFile(
      uniqueFileName, 
      fileBuffer, 
      file.type
    )

    if (!uploadResult.success || !uploadResult.path) {
      return NextResponse.json({ 
        error: uploadResult.error || 'Upload failed' 
      }, { status: 500 })
    }

    // Store file metadata in database using Prisma
    const attachment = await db.attachmentFile.create({
      data: {
        id: uuidv4(),
        fileName: file.name,
        filePath: uploadResult.path,
        fileSize: file.size,
        mimeType: file.type
      }
    })

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: uploadResult.url,
        path: uploadResult.path
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/attachments/upload')
