import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Client as MinioClient } from 'minio'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
// Dynamic imports for optional dependencies
let SftpClient: any
let FtpClient: any

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const body = await request.json()

    // Check if user has access to this space
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id
      }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    // Check if user has admin/owner role
    if (!['ADMIN', 'OWNER'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { provider, config } = body

    if (!provider || !config) {
      return NextResponse.json({ error: 'Provider and config are required' }, { status: 400 })
    }

    const providerConfig = config[provider]
    if (!providerConfig) {
      return NextResponse.json({ error: `Invalid provider: ${provider}` }, { status: 400 })
    }

    // Test connection based on provider
    let testResult

    switch (provider) {
      case 'minio':
        testResult = await testMinIOConnection(providerConfig)
        break
      case 's3':
        testResult = await testS3Connection(providerConfig)
        break
      case 'sftp':
        testResult = await testSFTPConnection(providerConfig)
        break
      case 'ftp':
        testResult = await testFTPConnection(providerConfig)
        break
      default:
        return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
    }

    return NextResponse.json(testResult)
  } catch (error: any) {
    console.error('Error testing storage connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/attachment-storage/test')

async function testMinIOConnection(config: any) {
  try {
    const requiredFields = ['endpoint', 'access_key', 'secret_key', 'bucket']
    const missingFields = requiredFields.filter(field => !config[field])

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }
    }

    // Parse endpoint URL
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    // Create MinIO client
    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region || 'us-east-1'
    })

    // Test connection by listing buckets
    await minioClient.listBuckets()

    // Check if bucket exists, create if it doesn't
    const bucketExists = await minioClient.bucketExists(config.bucket)
    if (!bucketExists) {
      await minioClient.makeBucket(config.bucket, config.region || 'us-east-1')
    }

    return {
      success: true,
      message: `MinIO connection successful. Bucket '${config.bucket}' is ready.`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'MinIO connection failed'
    }
  }
}

async function testS3Connection(config: any) {
  try {
    const requiredFields = ['access_key_id', 'secret_access_key', 'bucket']
    const missingFields = requiredFields.filter(field => !config[field])

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }
    }

    // Create S3 client
    const s3Client = new S3Client({
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key
      }
    })

    // Test connection by listing buckets
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)

    // Check if the specified bucket exists
    const bucketExists = response.Buckets?.some(bucket => bucket.Name === config.bucket)

    if (!bucketExists) {
      return {
        success: false,
        error: `Bucket '${config.bucket}' does not exist or is not accessible`
      }
    }

    return {
      success: true,
      message: `AWS S3 connection successful. Bucket '${config.bucket}' is accessible.`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'S3 connection failed'
    }
  }
}

async function testSFTPConnection(config: any) {
  try {
    const requiredFields = ['host', 'username', 'password']
    const missingFields = requiredFields.filter(field => !config[field])

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }
    }

    // Dynamic import for optional dependency
    if (!SftpClient) {
      try {
        const sftpModule = await import('ssh2-sftp-client')
        SftpClient = sftpModule.default
      } catch {
        return {
          success: false,
          error: 'SFTP client not available. Please install ssh2-sftp-client package.'
        }
      }
    }

    const sftp = new SftpClient()

    try {
      // Connect to SFTP server
      await sftp.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        readyTimeout: 10000
      })

      // Test by listing the upload directory
      const uploadPath = config.path || '/uploads'
      try {
        await sftp.list(uploadPath)
      } catch {
        // If directory doesn't exist, try to create it
        try {
          await sftp.mkdir(uploadPath, true)
        } catch {
          return {
            success: false,
            error: `Cannot access or create upload directory: ${uploadPath}`
          }
        }
      }

      return {
        success: true,
        message: `SFTP connection successful. Upload path '${uploadPath}' is ready.`
      }
    } finally {
      // Always disconnect
      await sftp.end()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SFTP connection failed'
    }
  }
}

async function testFTPConnection(config: any) {
  try {
    const requiredFields = ['host', 'username', 'password']
    const missingFields = requiredFields.filter(field => !config[field])

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }
    }

    // Dynamic import for optional dependency
    if (!FtpClient) {
      try {
        const ftpModule = await import('ftp')
        FtpClient = ftpModule.default
      } catch {
        return {
          success: false,
          error: 'FTP client not available. Please install ftp package.'
        }
      }
    }

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', async () => {
        try {
          // Test by listing the upload directory
          const uploadPath = config.path || '/uploads'

          ftp.list(uploadPath, (err: any, list: any) => {
            if (err) {
              // If directory doesn't exist, try to create it
              ftp.mkdir(uploadPath, true, (mkdirErr: any) => {
                ftp.end()
                if (mkdirErr) {
                  resolve({
                    success: false,
                    error: `Cannot access or create upload directory: ${uploadPath}`
                  })
                } else {
                  resolve({
                    success: true,
                    message: `FTP connection successful. Upload path '${uploadPath}' is ready.`
                  })
                }
              })
            } else {
              ftp.end()
              resolve({
                success: true,
                message: `FTP connection successful. Upload path '${uploadPath}' is accessible.`
              })
            }
          })
        } catch (error) {
          ftp.end()
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'FTP connection failed'
          })
        }
      })

      ftp.on('error', (err: any) => {
        resolve({
          success: false,
          error: err.message || 'FTP connection failed'
        })
      })

      // Connect to FTP server
      ftp.connect({
        host: config.host,
        port: config.port || 21,
        user: config.username,
        password: config.password,
        secure: false,
        secureOptions: {},
        passive: config.passive !== false
      })
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'FTP connection failed'
    }
  }
}
