import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { Client as MinioClient } from 'minio'
import { getResolvedMinIOManagementConfig } from '@/lib/minio-management-config'

async function getMinIOClient(instanceId: string) {
  return new MinioClient(await getResolvedMinIOManagementConfig(instanceId))
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, bucket } = await params
    const client = await getMinIOClient(instanceId)

    const exists = await client.bucketExists(bucket)
    if (!exists) {
      return NextResponse.json(
        { error: 'Bucket not found' },
        { status: 404 }
      )
    }

    // Get bucket details
    const objects = client.listObjects(bucket, '', true)
    let objectCount = 0
    let totalSize = 0
    const objectList: any[] = []

    for await (const obj of objects) {
      objectCount++
      totalSize += obj.size || 0
      objectList.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag,
      })
    }

    return NextResponse.json({
      name: bucket,
      exists: true,
      objectCount,
      totalSize,
      objects: objectList.slice(0, 100), // Limit to first 100 objects
    })
}



export const GET = withErrorHandling(getHandler, 'GET /api/minio/[instanceId]/buckets/[bucket]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, bucket } = await params
    const client = await getMinIOClient(instanceId)

    // List and delete all objects first
    const objects = client.listObjects(bucket, '', true)
    const objectsToDelete: string[] = []
    for await (const obj of objects) {
      objectsToDelete.push(obj.name || '')
    }

    // Delete all objects
    await Promise.all(
      objectsToDelete.map((objectName) => client.removeObject(bucket, objectName))
    )

    // Delete bucket
    await client.removeBucket(bucket)

    return NextResponse.json({
      success: true,
      message: `Bucket ${bucket} deleted successfully`,
    })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/minio/[instanceId]/buckets/[bucket]')

