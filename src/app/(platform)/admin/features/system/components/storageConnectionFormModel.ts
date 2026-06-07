import { Cloud, Server } from 'lucide-react'

import type { StorageProviderType } from '@/lib/storage-config'

export const STORAGE_TYPES: { value: StorageProviderType; label: string; icon: any }[] = [
  { value: 'minio', label: 'MinIO', icon: Server },
  { value: 's3', label: 'AWS S3', icon: Cloud },
  { value: 'sftp', label: 'SFTP', icon: Server },
  { value: 'onedrive', label: 'OneDrive', icon: Cloud },
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
]

export interface StorageConnectionFormData {
  name: string
  type: StorageProviderType
  description: string
  isActive: boolean
  config: any
}

export function getDefaultConfig(type: StorageProviderType) {
  switch (type) {
    case 'minio':
      return {
        endpoint: '',
        access_key: '',
        secret_key: '',
        bucket: '',
        region: 'us-east-1',
        use_ssl: false,
      }
    case 's3':
      return {
        endpoint: '',
        access_key_id: '',
        secret_access_key: '',
        bucket: '',
        region: 'us-east-1',
        force_path_style: true,
      }
    case 'sftp':
      return {
        host: '',
        port: 22,
        username: '',
        password: '',
        path: '/uploads',
      }
    case 'onedrive':
      return {
        client_id: '',
        client_secret: '',
        tenant_id: 'common',
        redirect_uri: '',
        access_token: '',
        refresh_token: '',
        folder_path: '',
      }
    case 'google_drive':
      return {
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        access_token: '',
        refresh_token: '',
        folder_id: '',
      }
    default:
      return {}
  }
}
