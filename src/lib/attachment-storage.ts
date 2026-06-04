import { Client as MinioClient } from 'minio'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Client as SftpClient } from 'ssh2-sftp-client'
import { Client as FtpClient } from 'ftp'
import { Readable } from 'stream'
import { normalizeS3Endpoint } from './s3'

export interface AttachmentStorageConfig {
  provider: 'minio' | 's3' | 'sftp' | 'ftp'
  config: {
    minio: {
      endpoint: string
      access_key: string
      secret_key: string
      bucket: string
      region: string
      use_ssl: boolean
    }
    s3: {
      endpoint?: string
      access_key_id: string
      secret_access_key: string
      bucket: string
      region: string
      force_path_style?: boolean
      forcePathStyle?: boolean
    }
    sftp: {
      host: string
      port: number
      username: string
      password: string
      path: string
    }
    ftp: {
      host: string
      port: number
      username: string
      password: string
      path: string
      passive: boolean
    }
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  stream?: Readable
  error?: string
}

/**
 * Wrapper function for uploading files - creates service instance and uploads
 */
export async function uploadFile(
  file: File | Buffer,
  options: {
    provider: AttachmentStorageConfig['provider']
    config: AttachmentStorageConfig['config']
    spaceId?: string
    dataModelId?: string
    attributeId?: string
    recordId?: string
  }
): Promise<{
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
}> {
  const service = new AttachmentStorageService({
    provider: options.provider,
    config: options.config
  })

  // Convert File to Buffer if needed
  let fileBuffer: Buffer
  let fileName: string
  let contentType: string | undefined

  if (file instanceof File) {
    fileName = file.name
    contentType = file.type
    const arrayBuffer = await file.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)
  } else {
    fileBuffer = file
    fileName = `file-${Date.now()}`
  }

  const result = await service.uploadFile(fileName, fileBuffer, contentType)

  if (!result.success || !result.path) {
    throw new Error(result.error || 'Upload failed')
  }

  return {
    fileName,
    filePath: result.path,
    fileSize: fileBuffer.length,
    mimeType: contentType || 'application/octet-stream'
  }
}

export class AttachmentStorageService {
  private config: AttachmentStorageConfig

  constructor(config: AttachmentStorageConfig) {
    this.config = config
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType?: string): Promise<UploadResult> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.uploadToMinIO(fileName, fileBuffer, contentType)
        case 's3':
          return await this.uploadToS3(fileName, fileBuffer, contentType)
        case 'sftp':
          return await this.uploadToSFTP(fileName, fileBuffer)
        case 'ftp':
          return await this.uploadToFTP(fileName, fileBuffer)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async downloadFile(fileName: string): Promise<DownloadResult> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.downloadFromMinIO(fileName)
        case 's3':
          return await this.downloadFromS3(fileName)
        case 'sftp':
          return await this.downloadFromSFTP(fileName)
        case 'ftp':
          return await this.downloadFromFTP(fileName)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  async deleteFile(fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.deleteFromMinIO(fileName)
        case 's3':
          return await this.deleteFromS3(fileName)
        case 'sftp':
          return await this.deleteFromSFTP(fileName)
        case 'ftp':
          return await this.deleteFromFTP(fileName)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  async renameFile(oldFileName: string, newFileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.renameInMinIO(oldFileName, newFileName)
        case 's3':
          return await this.renameInS3(oldFileName, newFileName)
        case 'sftp':
          return await this.renameInSFTP(oldFileName, newFileName)
        case 'ftp':
          return await this.renameInFTP(oldFileName, newFileName)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rename failed'
      }
    }
  }

  async generatePublicUrl(fileName: string, expiresIn?: number): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.generateMinIOPublicUrl(fileName, expiresIn)
        case 's3':
          return await this.generateS3PublicUrl(fileName, expiresIn)
        default:
          return { success: false, error: `Public URLs not supported for provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate public URL'
      }
    }
  }

  private async uploadToMinIO(fileName: string, fileBuffer: Buffer, contentType?: string): Promise<UploadResult> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    await minioClient.putObject(config.bucket, objectName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType || 'application/octet-stream'
    })

    const url = `${config.endpoint}/${config.bucket}/${objectName}`
    return { success: true, url, path: objectName }
  }

  private createS3Client(config: AttachmentStorageConfig['config']['s3']) {
    const endpoint = normalizeS3Endpoint(config.endpoint)

    return new S3Client({
      region: config.region || 'us-east-1',
      endpoint,
      forcePathStyle: config.force_path_style ?? config.forcePathStyle ?? Boolean(endpoint),
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key
      }
    })
  }

  private async uploadToS3(fileName: string, fileBuffer: Buffer, contentType?: string): Promise<UploadResult> {
    const config = this.config.config.s3
    const s3Client = this.createS3Client(config)

    const objectName = `attachments/${fileName}`
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectName,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream'
    })

    await s3Client.send(command)

    const endpoint = normalizeS3Endpoint(config.endpoint)
    const url = endpoint
      ? `${endpoint.replace(/\/$/, '')}/${config.bucket}/${objectName}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${objectName}`
    return { success: true, url, path: objectName }
  }

  private async uploadToSFTP(fileName: string, fileBuffer: Buffer): Promise<UploadResult> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const remotePath = `${config.path}/attachments/${fileName}`
      await sftp.put(fileBuffer, remotePath)

      return { success: true, path: remotePath }
    } finally {
      await sftp.end()
    }
  }

  private async uploadToFTP(fileName: string, fileBuffer: Buffer): Promise<UploadResult> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const remotePath = `${config.path}/attachments/${fileName}`
        ftp.put(fileBuffer, remotePath, (err) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true, path: remotePath })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }

  private async downloadFromMinIO(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    const stream = await minioClient.getObject(config.bucket, objectName)
    return { success: true, stream }
  }

  private async downloadFromS3(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.s3
    const s3Client = this.createS3Client(config)

    const objectName = `attachments/${fileName}`
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: objectName
    })

    const response = await s3Client.send(command)
    return { success: true, stream: response.Body as Readable }
  }

  private async downloadFromSFTP(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const remotePath = `${config.path}/attachments/${fileName}`
      const stream = await sftp.createReadStream(remotePath)
      return { success: true, stream }
    } finally {
      await sftp.end()
    }
  }

  private async downloadFromFTP(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const remotePath = `${config.path}/attachments/${fileName}`
        ftp.get(remotePath, (err, stream) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true, stream })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }

  private async deleteFromMinIO(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    await minioClient.removeObject(config.bucket, objectName)
    return { success: true }
  }

  private async deleteFromS3(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.s3
    const s3Client = this.createS3Client(config)

    const objectName = `attachments/${fileName}`
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectName
    })

    await s3Client.send(command)
    return { success: true }
  }

  private async deleteFromSFTP(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const remotePath = `${config.path}/attachments/${fileName}`
      await sftp.delete(remotePath)
      return { success: true }
    } finally {
      await sftp.end()
    }
  }

  private async deleteFromFTP(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const remotePath = `${config.path}/attachments/${fileName}`
        ftp.delete(remotePath, (err) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }

  private async renameInMinIO(oldFileName: string, newFileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const oldObjectName = `attachments/${oldFileName}`
    const newObjectName = `attachments/${newFileName}`

    // MinIO/S3 doesn't have a direct rename - we copy then delete
    await minioClient.copyObject(config.bucket, newObjectName, `${config.bucket}/${oldObjectName}`)
    await minioClient.removeObject(config.bucket, oldObjectName)
    return { success: true }
  }

  private async renameInS3(oldFileName: string, newFileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.s3
    const s3Client = this.createS3Client(config)

    const oldObjectName = `attachments/${oldFileName}`
    const newObjectName = `attachments/${newFileName}`

    // S3 doesn't have a direct rename - we copy then delete
    const copyCommand = new CopyObjectCommand({
      Bucket: config.bucket,
      CopySource: `${config.bucket}/${oldObjectName}`,
      Key: newObjectName
    })
    await s3Client.send(copyCommand)

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: oldObjectName
    })
    await s3Client.send(deleteCommand)
    return { success: true }
  }

  private async renameInSFTP(oldFileName: string, newFileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const oldPath = `${config.path}/attachments/${oldFileName}`
      const newPath = `${config.path}/attachments/${newFileName}`
      await sftp.rename(oldPath, newPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Rename failed' }
    } finally {
      await sftp.end()
    }
  }

  private async renameInFTP(oldFileName: string, newFileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const oldPath = `${config.path}/attachments/${oldFileName}`
        const newPath = `${config.path}/attachments/${newFileName}`
        ftp.rename(oldPath, newPath, (err) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }

  private async generateMinIOPublicUrl(fileName: string, expiresIn: number = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    const url = await minioClient.presignedGetObject(config.bucket, objectName, expiresIn)
    return { success: true, url }
  }

  private async generateS3PublicUrl(fileName: string, expiresIn: number = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
    const config = this.config.config.s3
    const s3Client = this.createS3Client(config)

    const objectName = `attachments/${fileName}`
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: objectName
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return { success: true, url }
  }
}
