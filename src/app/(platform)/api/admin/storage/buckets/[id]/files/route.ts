import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { id: bucketId } = await params
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''
  const search = searchParams.get('search') || ''

  const space = await db.space.findUnique({
    where: { id: bucketId }
  })

  if (!space) {
    return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
  }

  const pathParts = path ? path.split('/').filter(p => p) : []
  const currentPathDepth = pathParts.length

  const whereClause: any = {
    spaceId: bucketId
  }

  if (search) {
    whereClause.OR = [
      { fileName: { contains: search, mode: 'insensitive' } }
    ]
  }

  const allFiles = await db.spaceAttachmentStorage.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc'
    }
  })

  const filteredFiles = allFiles.filter(file => {
    if (!file.filePath) return path === ''

    const filePathParts = file.filePath.split('/').filter(p => p)

    if (path === '') {
      return filePathParts.length <= 1
    }

    const matchesPath =
      filePathParts.length === currentPathDepth + 1 &&
      filePathParts.slice(0, currentPathDepth).join('/') === pathParts.join('/')

    return matchesPath
  })

  const folderSet = new Set<string>()
  const folderMap = new Map<
    string,
    { id: string; name: string; path: string; createdAt: Date }
  >()

  filteredFiles.forEach(file => {
    if (file.mimeType === 'folder') {
      const folderName = file.fileName
      const folderPath = file.filePath || ''
      if (!folderSet.has(folderPath)) {
        folderSet.add(folderPath)
        folderMap.set(folderPath, {
          id: file.id,
          name: folderName,
          path: folderPath,
          createdAt: file.createdAt
        })
      }
    } else if (file.filePath) {
      const filePathParts = file.filePath.split('/').filter(p => p)
      if (filePathParts.length > currentPathDepth + 1) {
        const folderName = filePathParts[currentPathDepth]
        const folderPath = filePathParts
          .slice(0, currentPathDepth + 1)
          .join('/')
        if (!folderSet.has(folderPath)) {
          folderSet.add(folderPath)
          folderMap.set(folderPath, {
            id: `folder-${folderPath}`,
            name: folderName,
            path: folderPath,
            createdAt: file.createdAt
          })
        }
      }
    }
  })

  const formattedFiles = filteredFiles
    .filter(f => f.mimeType !== 'folder')
    .map(file => ({
      id: file.id,
      name: file.fileName,
      size: file.fileSize || 0,
      mimeType: file.mimeType || 'application/octet-stream',
      updatedAt: file.createdAt,
      createdAt: file.createdAt,
      publicUrl: undefined,
      bucketId,
      bucketName: space.name,
      path: file.filePath || '',
      uploadedBy: undefined,
      uploadedByName: 'Unknown',
      type: 'file' as const
    }))

  const formattedFolders = Array.from(folderMap.values()).map(folder => ({
    id: folder.id,
    name: folder.name,
    size: 0,
    mimeType: 'folder',
    updatedAt: folder.createdAt,
    createdAt: folder.createdAt,
    publicUrl: undefined,
    bucketId,
    bucketName: space.name,
    path: folder.path,
    uploadedBy: undefined,
    uploadedByName: 'Unknown',
    type: 'folder' as const
  }))

  const allItems = [...formattedFolders, ...formattedFiles].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })

  return NextResponse.json({ files: allItems })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/storage/buckets/[id]/files'
)

