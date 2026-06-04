export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  console.log('[Startup Check] Starting connectivity checks...')

  try {
    const { prisma } = await import('@/lib/db')
    console.log('[Startup Check] Testing Database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('[Startup Check] Database connection successful')
  } catch (error: any) {
    console.error('[Startup Check] Database connection failed:', error.message)
    if (error?.stack) console.error(error.stack)
  }

  try {
    const { getS3Client, validateS3Config } = await import('@/lib/s3')
    const { ListBucketsCommand } = await import('@aws-sdk/client-s3')

    const isS3Configured = await validateS3Config()
    if (!isS3Configured) {
      console.warn('[Startup Check] MinIO/S3 is not configured; skipping connectivity check.')
      console.log('[Startup Check] Connectivity checks completed.')
      return
    }

    console.log('[Startup Check] Testing MinIO/S3 connection...')
    const s3Client = await getS3Client()
    const result = await s3Client.send(new ListBucketsCommand({}))

    console.log(`[Startup Check] MinIO/S3 connection successful. Found ${result.Buckets?.length || 0} buckets.`)
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('not configured')) {
      console.warn('[Startup Check] MinIO/S3 is not configured; skipping connectivity check.')
    } else {
      console.error('[Startup Check] MinIO/S3 connection failed:', message)
      console.error('[Startup Check] Full Error Details:', JSON.stringify(error, null, 2))
      if (error?.stack) console.error(error.stack)
    }
  }

  console.log('[Startup Check] Connectivity checks completed.')
}
