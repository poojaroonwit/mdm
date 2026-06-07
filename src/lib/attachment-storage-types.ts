import type { Readable } from 'stream'

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
