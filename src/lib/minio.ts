/**
 * Shared MinIO client — mirrors the studio-2 pattern.
 *
 * Two clients are created:
 *  - `minioClient`       : uses MINIO_ENDPOINT (internal Docker hostname for uploads)
 *  - `minioPublicClient` : built from MINIO_PUBLIC_URL (external hostname for proxy/stream reads)
 *
 * The public client is what the /api/assets proxy uses, because MINIO_ENDPOINT
 * may be an internal Docker service name unreachable from the app at read time.
 */

import { Client } from 'minio'

export const MINIO_BUCKET = process.env.MINIO_UPLOADS_BUCKET || process.env.MINIO_BUCKET || 'udp'

// ── Internal client (used for uploads from within the container) ──────────────
const internalEndpoint = process.env.MINIO_ENDPOINT || 'localhost'
const internalPort = parseInt(process.env.MINIO_PORT || '9000', 10)
const internalUseSSL = internalPort === 443 || process.env.MINIO_USE_SSL === 'true'

export const minioClient = new Client({
  endPoint: (() => {
    try {
      const u = new URL(internalEndpoint.includes('://') ? internalEndpoint : `http://${internalEndpoint}`)
      return u.hostname
    } catch {
      return internalEndpoint.replace(/^https?:\/\//, '').split(':')[0].split('/')[0]
    }
  })(),
  port: internalUseSSL ? 443 : internalPort,
  useSSL: internalUseSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
})

// ── Public client (built from MINIO_PUBLIC_URL — used for proxy/stream reads) ─
// Mirrors studio-2's pattern: parse the public URL to get the correct
// hostname, port, and SSL flag for external access.
function buildPublicClient(): Client | null {
  const publicBase = process.env.MINIO_PUBLIC_URL
  if (!publicBase) return null
  try {
    const u = new URL(publicBase)
    return new Client({
      endPoint: u.hostname,
      port: u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80),
      useSSL: u.protocol === 'https:',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
    })
  } catch {
    return null
  }
}

export const minioPublicClient: Client | null = buildPublicClient()
