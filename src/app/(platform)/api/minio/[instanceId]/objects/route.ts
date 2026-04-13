import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { Client as MinioClient } from 'minio'
import { getResolvedMinIOManagementConfig } from '@/lib/minio-management-config'

async function getMinIOClient(instanceId: string) {
  return new MinioClient(await getResolvedMinIOManagementConfig(instanceId))
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string

    if (!file || !bucket) {
      return NextResponse.json(
        { error: 'File and bucket are required' },
        { status: 400 }
      )
    }

    const client = await getMinIOClient(instanceId)

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Bucket does not exist' },
        { status: 404 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload object
    const objectName = file.name
    await client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': file.type || 'application/octet-stream',
    })

    return NextResponse.json({
      success: true,
      message: 'Object uploaded successfully',
      bucket,
      objectName,
      size: buffer.length,
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/minio/[instanceId]/objects')

