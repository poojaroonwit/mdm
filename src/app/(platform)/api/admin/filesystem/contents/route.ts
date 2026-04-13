import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'

    // Get space attachments
    const spaceAttachments = await prisma.spaceAttachmentStorage.findMany({
      include: {
        space: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get general attachment files
    const attachmentFiles = await prisma.attachmentFile.findMany()

    // Combine and format the data
    const items = [
      ...spaceAttachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.fileName,
        type: 'file' as const,
        path: attachment.filePath,
        size: attachment.fileSize,
        permissions: '644',
        owner: 'system',
        group: 'system',
        modified: attachment.createdAt,
        accessed: attachment.createdAt,
        created: attachment.createdAt,
        isHidden: false,
        isSymlink: false,
        mimeType: attachment.mimeType,
        extension: attachment.fileName.split('.').pop(),
        spaceId: attachment.spaceId,
        spaceName: attachment.space.name,
        isAttachment: true,
        attachmentId: attachment.id,
      })),
      ...attachmentFiles.map((file) => ({
        id: file.id,
        name: file.fileName,
        type: 'file' as const,
        path: file.filePath,
        size: file.fileSize,
        permissions: '644',
        owner: 'system',
        group: 'system',
        modified: file.createdAt,
        accessed: file.createdAt,
        created: file.createdAt,
        isHidden: false,
        isSymlink: false,
        mimeType: file.mimeType,
        extension: file.fileName.split('.').pop(),
        spaceId: undefined,
        spaceName: undefined,
        isAttachment: true,
        attachmentId: file.id,
      })),
    ]

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching storage contents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contents' },
      { status: 500 },
    )
  }
}
