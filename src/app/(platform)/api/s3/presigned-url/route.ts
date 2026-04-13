import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from '@/lib/s3'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { key, bucket, expiresIn = 300 } = await request.json()

    if (!key || !bucket) {
      return NextResponse.json(
        { error: 'Key and bucket are required' },
        { status: 400 }
      )
    }

    const s3Client = await getS3Client()


    // Create the command to get the object
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: Math.min(expiresIn, 3600), // Max 1 hour
    })

    return NextResponse.json({
      success: true,
      url: presignedUrl,
      expiresIn,
    })
  } catch (error: any) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/s3/presigned-url')
