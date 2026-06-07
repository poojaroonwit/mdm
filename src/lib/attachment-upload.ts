import { AttachmentStorageService } from './attachment-storage'
import type { AttachmentStorageConfig } from './attachment-storage-types'

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
