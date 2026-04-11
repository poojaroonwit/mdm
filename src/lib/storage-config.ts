export interface StorageConfig {
  minio: {
    endpoint: string
    access_key: string
    secret_key: string
    bucket: string
    region: string
    use_ssl: boolean
  }
  s3: {
    access_key_id: string
    secret_access_key: string
    bucket: string
    region: string
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
  onedrive: {
    client_id: string
    client_secret: string
    tenant_id?: string
    redirect_uri: string
    access_token?: string
    refresh_token?: string
    folder_path?: string
  }
  google_drive: {
    client_id: string
    client_secret: string
    redirect_uri: string
    access_token?: string
    refresh_token?: string
    folder_id?: string
  }
}

export type StorageProviderType = 'minio' | 's3' | 'sftp' | 'ftp' | 'onedrive' | 'google_drive'

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  minio: {
    endpoint: 'http://localhost:9000',
    access_key: 'minioadmin',
    secret_key: 'minioadmin',
    bucket: 'attachments',
    region: 'us-east-1',
    use_ssl: false
  },
  s3: {
    access_key_id: '',
    secret_access_key: '',
    bucket: '',
    region: 'us-east-1'
  },
  sftp: {
    host: '',
    port: 22,
    username: '',
    password: '',
    path: '/uploads'
  },
  ftp: {
    host: '',
    port: 21,
    username: '',
    password: '',
    path: '/uploads',
    passive: true
  },
  onedrive: {
    client_id: '',
    client_secret: '',
    tenant_id: 'common',
    redirect_uri: '',
    access_token: '',
    refresh_token: '',
    folder_path: ''
  },
  google_drive: {
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    access_token: '',
    refresh_token: '',
    folder_id: ''
  }
}

export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_PER_ATTRIBUTE: 10,
  ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mp3', 'zip']
}

export const SUPPORTED_FILE_TYPES = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
  videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz'],
  spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
  presentations: ['ppt', 'pptx', 'odp']
}

export function getFileTypeCategory(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  for (const [category, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (extensions.includes(extension || '')) {
      return category
    }
  }
  
  return 'other'
}

export function isFileTypeAllowed(fileName: string, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) {
    return true
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

export function validateFileSize(fileSize: number, maxSizeMB?: number): boolean {
  const maxSize = (maxSizeMB || FILE_UPLOAD_LIMITS.MAX_FILE_SIZE_MB) * 1024 * 1024
  return fileSize <= maxSize
}
