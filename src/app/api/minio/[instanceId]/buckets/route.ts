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
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    const client = await getMinIOClient(instanceId)
    const buckets = await client.listBuckets()

    const bucketsWithDetails = await Promise.all(
      buckets.map(async (bucket) => {
        try {
          const objects = client.listObjects(bucket.name, '', true)
          let objectCount = 0
          let totalSize = 0

          for await (const obj of objects) {
            objectCount++
            totalSize += obj.size || 0
          }

          return {
            name: bucket.name,
            creationDate: bucket.creationDate,
            objectCount,
            size: totalSize,
          }
        } catch {
          return {
            name: bucket.name,
            creationDate: bucket.creationDate,
            objectCount: 0,
            size: 0,
          }
        }
      })
    )

    return NextResponse.json({ buckets: bucketsWithDetails })
}



export const GET = withErrorHandling(getHandler, 'GET /api/minio/[instanceId]/buckets')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    const body = await request.json()
    const { name, region } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Bucket name is required' },
        { status: 400 }
      )
    }

    const client = await getMinIOClient(instanceId)
    await client.makeBucket(name, region || 'us-east-1')

    return NextResponse.json({
      success: true,
      message: `Bucket ${name} created successfully`,
      bucket: { name, creationDate: new Date() },
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/minio/[instanceId]/buckets')

