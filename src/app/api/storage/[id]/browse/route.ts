import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Client as MinioClient } from 'minio'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { Client as SftpClient } from 'ssh2-sftp-client'

interface FileItem {
    name: string
    path: string
    size: number
    lastModified: string
    type: 'file' | 'folder'
}

async function getHandler(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    const { id: connectionId } = await params
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'

    // Get connection details
    const connection = await prisma.storageConnection.findUnique({
        where: { id: connectionId }
    })

    if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!connection.isActive) {
        return NextResponse.json({ error: 'Connection is not active' }, { status: 400 })
    }

    const config = connection.config as any

    try {
        let items: FileItem[] = []

        switch (connection.type) {
            case 'minio':
                items = await listMinioObjects(config, path)
                break
            case 's3':
                items = await listS3Objects(config, path)
                break
            case 'sftp':
                items = await listSftpFiles(config, path)
                break
            default:
                return NextResponse.json({ error: `Browse not supported for ${connection.type}` }, { status: 400 })
        }

        return NextResponse.json({ items, path })
    } catch (error: any) {
        console.error('Browse error:', error)
        return NextResponse.json({ error: error.message || 'Failed to browse storage' }, { status: 500 })
    }
}

async function listMinioObjects(config: any, path: string): Promise<FileItem[]> {
    let endpointUrl = config.endpoint
    if (!endpointUrl.includes('://')) {
        const isSSL = config.use_ssl || config.useSSL || false
        endpointUrl = (isSSL ? 'https://' : 'http://') + endpointUrl
    }

    const endpoint = new URL(endpointUrl)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl || config.useSSL

    const minioClient = new MinioClient({
        endPoint: endpoint.hostname,
        port: port,
        useSSL: useSSL,
        accessKey: config.access_key || config.accessKey,
        secretKey: config.secret_key || config.secretKey,
        region: config.region || 'us-east-1'
    })

    const prefix = path === '/' ? '' : path.replace(/^\//, '') + '/'
    const items: FileItem[] = []
    const seenFolders = new Set<string>()

    return new Promise((resolve, reject) => {
        const stream = minioClient.listObjectsV2(config.bucket, prefix, false)

        stream.on('data', (obj) => {
            if (obj.prefix) {
                // This is a "folder" (common prefix)
                const folderName = obj.prefix.replace(prefix, '').replace(/\/$/, '')
                if (folderName && !seenFolders.has(folderName)) {
                    seenFolders.add(folderName)
                    items.push({
                        name: folderName,
                        path: '/' + obj.prefix.replace(/\/$/, ''),
                        size: 0,
                        lastModified: new Date().toISOString(),
                        type: 'folder'
                    })
                }
            } else if (obj.name) {
                // This is a file
                const fileName = obj.name.replace(prefix, '')
                if (fileName && !fileName.includes('/')) {
                    items.push({
                        name: fileName,
                        path: '/' + obj.name,
                        size: obj.size || 0,
                        lastModified: obj.lastModified?.toISOString() || new Date().toISOString(),
                        type: 'file'
                    })
                }
            }
        })

        stream.on('error', reject)
        stream.on('end', () => {
            // Sort: folders first, then files
            items.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
                return a.name.localeCompare(b.name)
            })
            resolve(items)
        })
    })
}

async function listS3Objects(config: any, path: string): Promise<FileItem[]> {
    const s3Client = new S3Client({
        region: config.region || 'us-east-1',
        credentials: {
            accessKeyId: config.access_key_id,
            secretAccessKey: config.secret_access_key
        }
    })

    const prefix = path === '/' ? '' : path.replace(/^\//, '') + '/'
    const items: FileItem[] = []

    const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        Delimiter: '/'
    })

    const response = await s3Client.send(command)

    // Add folders (common prefixes)
    if (response.CommonPrefixes) {
        for (const cp of response.CommonPrefixes) {
            if (cp.Prefix) {
                const folderName = cp.Prefix.replace(prefix, '').replace(/\/$/, '')
                if (folderName) {
                    items.push({
                        name: folderName,
                        path: '/' + cp.Prefix.replace(/\/$/, ''),
                        size: 0,
                        lastModified: new Date().toISOString(),
                        type: 'folder'
                    })
                }
            }
        }
    }

    // Add files
    if (response.Contents) {
        for (const obj of response.Contents) {
            if (obj.Key) {
                const fileName = obj.Key.replace(prefix, '')
                if (fileName && !fileName.includes('/')) {
                    items.push({
                        name: fileName,
                        path: '/' + obj.Key,
                        size: obj.Size || 0,
                        lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
                        type: 'file'
                    })
                }
            }
        }
    }

    return items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
    })
}

async function listSftpFiles(config: any, path: string): Promise<FileItem[]> {
    const sftp = new SftpClient()

    try {
        await sftp.connect({
            host: config.host,
            port: config.port || 22,
            username: config.username,
            password: config.password
        })

        const basePath = config.path || '/'
        const fullPath = path === '/' ? basePath : basePath + path

        const listing = await sftp.list(fullPath)
        const items: FileItem[] = listing.map((item: any) => ({
            name: item.name,
            path: path === '/' ? '/' + item.name : path + '/' + item.name,
            size: item.size || 0,
            lastModified: new Date(item.modifyTime || Date.now()).toISOString(),
            type: item.type === 'd' ? 'folder' : 'file'
        }))

        return items.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
            return a.name.localeCompare(b.name)
        })
    } finally {
        await sftp.end()
    }
}

export const GET = withErrorHandling(getHandler, 'GET /api/storage/[id]/browse')
