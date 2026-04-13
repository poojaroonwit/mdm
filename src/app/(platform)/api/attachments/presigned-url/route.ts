import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { generatePresignedDownloadUrl, validateS3Config } from '@/lib/s3'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Validate S3 configuration
    if (!(await validateS3Config())) {
      return NextResponse.json(
        { error: 'S3 configuration is missing' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { bucket, key, expiresIn, expires_in } = body
    const finalExpiresIn = expiresIn || expires_in

    if (!bucket || !key) {
      return NextResponse.json(
        { error: 'Bucket and key are required' },
        { status: 400 }
      )
    }

    // Validate that the key is a valid attachment path
    if (!key.startsWith('attachments/')) {
      return NextResponse.json(
        { error: 'Invalid attachment key' },
        { status: 400 }
      )
    }

    // Generate presigned URL with short expiry (5-10 minutes)
    const presignedUrl = await generatePresignedDownloadUrl(
      bucket,
      key,
      finalExpiresIn || 300 // 5 minutes default
    )

    return NextResponse.json({
      success: true,
      presignedUrl,
      expiresIn: finalExpiresIn || 300,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/attachments/presigned-url')
