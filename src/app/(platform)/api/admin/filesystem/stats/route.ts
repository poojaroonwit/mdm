import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get space attachment statistics
    const spaceAttachments = await prisma.spaceAttachmentStorage.findMany({
      select: {
        fileSize: true
      }
    })

    // Get general attachment statistics
    const attachmentFiles = await prisma.attachmentFile.findMany({
      select: {
        fileSize: true
      }
    })

    // Calculate total storage usage
    const totalUsedSpace = spaceAttachments.reduce((sum, att) => sum + att.fileSize, 0) +
                          attachmentFiles.reduce((sum, file) => sum + file.fileSize, 0)

    // Mock system stats (in a real implementation, these would come from system monitoring)
    const stats = {
      totalSpace: 1000 * 1024 * 1024 * 1024, // 1TB
      usedSpace: totalUsedSpace,
      freeSpace: 1000 * 1024 * 1024 * 1024 - totalUsedSpace,
      inodes: {
        total: 1000000,
        used: spaceAttachments.length + attachmentFiles.length,
        free: 1000000 - (spaceAttachments.length + attachmentFiles.length),
      },
      mountPoint: '/storage',
      storageType: 'ext4',
      readOnly: false,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching storage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    )
  }
}
