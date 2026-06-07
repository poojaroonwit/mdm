'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { StorageProviderType } from '@/lib/storage-config'
import { getDefaultConfig, STORAGE_TYPES, type StorageConnectionFormData } from './storageConnectionFormModel'

export { STORAGE_TYPES }
export type { StorageConnectionFormData } from './storageConnectionFormModel'

interface StorageConnectionFormProps {
    initialData?: Partial<StorageConnectionFormData>
    onSubmit: (data: StorageConnectionFormData) => void
    onCancel: () => void
    isLoading?: boolean
}

export function StorageConnectionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: StorageConnectionFormProps) {
    const [formData, setFormData] = useState<StorageConnectionFormData>({
        name: '',
        type: 's3',
        description: '',
        isActive: true,
        config: getDefaultConfig('s3'),
        ...initialData,
    })

    // Update default config when type changes if not editing an existing connection with that type
    // effectively we just want to reset config if type changes manually
    const handleTypeChange = (type: string) => {
        const storageType = type as StorageProviderType
        setFormData({
            ...formData,
            type: storageType,
            config: getDefaultConfig(storageType),
        })
    }

    const renderConfigFields = () => {
        const config = formData.config || {}
        const type = formData.type

        switch (type) {
            case 'minio':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Endpoint</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.endpoint || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, endpoint: e.target.value },
                                        })
                                    }
                                    placeholder="http://localhost:9000"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Bucket</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.bucket || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, bucket: e.target.value },
                                        })
                                    }
                                    placeholder="attachments"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Access Key</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.access_key || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, access_key: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Secret Key</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.secret_key || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, secret_key: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Region</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.region || 'us-east-1'}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, region: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    checked={config.use_ssl || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, use_ssl: checked },
                                        })
                                    }
                                />
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Use SSL</Label>
                            </div>
                        </div>
                    </div>
                )
            case 's3':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">S3 Endpoint</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.endpoint || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, endpoint: e.target.value },
                                    })
                                }
                                placeholder="https://your-railway-bucket-endpoint"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Access Key ID</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.access_key_id || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, access_key_id: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Secret Access Key</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.secret_access_key || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, secret_access_key: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Bucket</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.bucket || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, bucket: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Region</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.region || 'us-east-1'}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, region: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={config.force_path_style !== false}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, force_path_style: checked },
                                    })
                                }
                            />
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Use path-style requests</Label>
                        </div>
                    </div>
                )
            case 'sftp':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Host</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.host || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, host: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Port</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="number"
                                    value={config.port || 22}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, port: parseInt(e.target.value) || 22 },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Username</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.username || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, username: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Password</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.password || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, password: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Path</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.path || '/uploads'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, path: e.target.value },
                                    })
                                }
                            />
                        </div>
                    </div>
                )
            case 'onedrive':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Client ID</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.client_id || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, client_id: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Client Secret</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.client_secret || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, client_secret: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tenant ID</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.tenant_id || 'common'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, tenant_id: e.target.value },
                                    })
                                }
                                placeholder="common"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Redirect URI</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.redirect_uri || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, redirect_uri: e.target.value },
                                    })
                                }
                                placeholder="https://yourapp.com/auth/onedrive/callback"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Folder Path (optional)</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.folder_path || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, folder_path: e.target.value },
                                    })
                                }
                                placeholder="/Documents"
                            />
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> After saving, you'll need to authenticate with OneDrive to
                                get access and refresh tokens. Use the "Test Connection" button to initiate OAuth
                                flow.
                            </p>
                        </div>
                    </div>
                )
            case 'google_drive':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Client ID</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    value={config.client_id || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, client_id: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Client Secret</Label>
                                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                    type="password"
                                    value={config.client_secret || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            config: { ...config, client_secret: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Redirect URI</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.redirect_uri || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, redirect_uri: e.target.value },
                                    })
                                }
                                placeholder="https://yourapp.com/auth/google/callback"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Folder ID (optional)</Label>
                            <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                value={config.folder_id || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        config: { ...config, folder_id: e.target.value },
                                    })
                                }
                                placeholder="1abc123def456..."
                            />
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> After saving, you'll need to authenticate with Google Drive
                                to get access and refresh tokens. Use the "Test Connection" button to initiate OAuth
                                flow.
                            </p>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Name *</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Storage Connection"
                    />
                </div>
                <div>
                    <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Type *</Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STORAGE_TYPES.map((type) => {
                                const Icon = type.icon
                                return (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            {type.label}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Description</Label>
                <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                />
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Active</Label>
            </div>

            <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">Configuration</h3>
                {renderConfigFields()}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button className="rounded-xl font-bold" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button className="rounded-xl font-bold" onClick={() => onSubmit(formData)} disabled={isLoading || !formData.name}>
                    {isLoading ? 'Saving...' : 'Save Connection'}
                </Button>
            </div>
        </div>
    )
}
