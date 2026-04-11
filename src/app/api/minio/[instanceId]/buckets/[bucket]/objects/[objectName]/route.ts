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
  { params }: { params: Promise<{ instanceId: string; bucket: string; objectName: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, bucket, objectName } = await params
    const client = await getMinIOClient(instanceId)

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Bucket does not exist' },
        { status: 404 }
      )
    }

    // Get object
    const dataStream = await client.getObject(bucket, decodeURIComponent(objectName))
    
    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of dataStream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Get object metadata
    const stat = await client.statObject(bucket, decodeURIComponent(objectName))

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': stat.metaData?.['content-type'] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${objectName.split('/').pop()}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
}



export const GET = withErrorHandling(getHandler, 'GET /api/minio/[instanceId]/buckets/[bucket]/objects/[objectName]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string; objectName: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, bucket, objectName } = await params
    const client = await getMinIOClient(instanceId)

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Bucket does not exist' },
        { status: 404 }
      )
    }

    // Delete object
    await client.removeObject(bucket, decodeURIComponent(objectName))

    return NextResponse.json({
      success: true,
      message: 'Object deleted successfully',
    })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/minio/[instanceId]/buckets/[bucket]/objects/[objectName]')

