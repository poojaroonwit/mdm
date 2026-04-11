import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { Client as MinioClient } from 'minio'
import { getResolvedMinIOManagementConfig } from '@/lib/minio-management-config'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { instanceId } = await params
    const config = await getResolvedMinIOManagementConfig(instanceId)

    // Test connection
    const client = new MinioClient(config)
    await client.listBuckets()

    return NextResponse.json({
      success: true,
      message: 'MinIO connection successful',
      endpoint: `${config.useSSL ? 'https' : 'http'}://${config.endPoint}:${config.port}`,
    })
  } catch (error) {
    console.error('MinIO connection test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/minio/[instanceId]/connection')
