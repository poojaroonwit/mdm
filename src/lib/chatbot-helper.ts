/**
 * Helper functions for chatbot operations
 */
import { getConfiguredSiteUrl, getMinioPublicUrl } from '@/lib/system-runtime-settings'

/**
 * Merge version config into chatbot object.
 * Filters out undefined/null values from version config to prevent overwriting
 * valid chatbot base values with undefined.
 * 
 * @param chatbot - The chatbot object with versions array
 * @returns The merged chatbot object with version config applied
 */
export function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot

  // Get the latest version config (first in the array since it's ordered by createdAt desc)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const rawVersionConfig = latestVersion?.config || {}

  // Filter out undefined/null values from version config
  // This ensures we don't overwrite valid chatbot base values with undefined
  const versionConfig: Record<string, any> = {}
  for (const [key, value] of Object.entries(rawVersionConfig)) {
    if (value !== undefined && value !== null) {
      versionConfig[key] = value
    }
  }

  // Merge version config into chatbot object (version config takes precedence for config fields)
  return {
    ...chatbot,
    ...versionConfig,
    // Preserve essential chatbot fields
    id: chatbot.id,
    createdAt: chatbot.createdAt,
    updatedAt: chatbot.updatedAt,
    createdBy: chatbot.createdBy,
    spaceId: chatbot.spaceId,
    versions: chatbot.versions,
    creator: chatbot.creator,
    space: chatbot.space,
  }
}

// Image URL fields that may contain MinIO direct URLs and need to be rewritten to the proxy path
const MINIO_IMAGE_FIELDS = [
  'widgetAvatarImageUrl',
  'avatarImageUrl',
  'headerAvatarImageUrl',
  'widgetCloseImageUrl',
  'headerLogo',
  'pageBackgroundImage',
  'widgetOpenBackgroundImage',
  'userAvatarImageUrl',
]

/**
 * Rewrite any direct MinIO public URLs in the chatbot config to go through the
 * /uploads/... proxy route. This ensures images are served via authenticated MinIO
 * SDK requests even when the bucket has no public-read policy.
 */
async function rewriteMinioUrls(config: any): Promise<any> {
  const publicBase = await getMinioPublicUrl()
  const bucket = process.env.MINIO_UPLOADS_BUCKET || 'udp'
  const appBase = await getConfiguredSiteUrl(null)

  // Build the proxy URL in the same absolute form as storeUploadedImage (studio-2 pattern)
  const toProxyUrl = (filePath: string): string =>
    appBase
      ? `${appBase}/api/assets?filePath=${encodeURIComponent(filePath)}`
      : `/api/assets?filePath=${encodeURIComponent(filePath)}`

  const rewrite = (url: any): any => {
    if (typeof url !== 'string' || !url) return url

    // Already our proxy URL — leave it alone
    if (url.includes('/api/assets?filePath=')) return url

    // Old direct MinIO public URL: https://minio-host/bucket/path
    if (publicBase) {
      const minioPrefix = `${publicBase.replace(/\/$/, '')}/${bucket}/`
      if (url.startsWith(minioPrefix)) {
        return toProxyUrl(url.slice(minioPrefix.length))
      }
    }

    // Old relative proxy path from previous fix: /uploads/path
    if (url.startsWith('/uploads/')) {
      return toProxyUrl(url.slice('/uploads/'.length))
    }

    return url
  }

  const result = { ...config }
  for (const field of MINIO_IMAGE_FIELDS) {
    if (result[field]) result[field] = rewrite(result[field])
  }

  // Also rewrite inside versions[x].config so the admin editor postMessage flow gets clean URLs
  if (Array.isArray(result.versions)) {
    result.versions = result.versions.map((v: any) => {
      if (!v?.config) return v
      const newConfig = { ...v.config }
      for (const field of MINIO_IMAGE_FIELDS) {
        if (newConfig[field]) newConfig[field] = rewrite(newConfig[field])
      }
      return { ...v, config: newConfig }
    })
  }

  return result
}

/**
 * Sanitize chatbot config by removing sensitive API keys.
 * This should be used before returning the chatbot object to the frontend.
 *
 * @param chatbot - The merged chatbot object
 * @returns The sanitized chatbot object
 */
export async function sanitizeChatbotConfig(chatbot: any): Promise<any> {
  if (!chatbot) return chatbot

  // Create a shallow copy and rewrite MinIO URLs to proxy paths
  const sanitized = await rewriteMinioUrls({ ...chatbot })

  // Remove sensitive keys from root (merged config)
  delete sanitized.openaiAgentSdkApiKey
  delete sanitized.difyApiKey
  delete sanitized.apiAuthValue
  delete sanitized.chatkitApiKey

  // Remove sensitive keys from versions if present
  if (sanitized.versions && Array.isArray(sanitized.versions)) {
    sanitized.versions = sanitized.versions.map((v: any) => {
      const newV = { ...v }
      if (newV.config) {
        const newConfig = { ...newV.config }
        delete newConfig.openaiAgentSdkApiKey
        delete newConfig.difyApiKey
        delete newConfig.apiAuthValue
        delete newConfig.chatkitApiKey
        newV.config = newConfig
      }
      return newV
    })
  }

  return sanitized
}

/**
 * Validate that the request origin/referer matches the chatbot's customEmbedDomain
 * 
 * @param chatbot - The chatbot object with customEmbedDomain
 * @param request - The NextRequest object
 * @returns { allowed: boolean, error?: string, domain?: string }
 */
export function validateDomain(chatbot: any, request: Request): { allowed: boolean; error?: string; domain?: string } {
  if (!chatbot?.customEmbedDomain) {
    return { allowed: true }
  }

  const referer = request.headers.get('referer') || request.headers.get('origin')

  // Allow localhost for testing/development
  const isLocalhost = referer && (referer.includes('localhost') || referer.includes('127.0.0.1'))
  if (isLocalhost) {
    return { allowed: true }
  }

  if (!referer) {
    // If no referer/origin, we can't validate. Usually this means a direct API call.
    return { allowed: true }
  }

  try {
    const refererUrl = new URL(referer)
    const requestDomain = refererUrl.hostname

    // Support multiple domains separated by comma
    // Prefer domainAllowlist if set, otherwise fallback to customEmbedDomain for backward compatibility
    const rawAllowedDomains = chatbot.domainAllowlist || chatbot.customEmbedDomain || ''
    const allowedDomains = rawAllowedDomains
      .split(',')
      .map((d: string) => d.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''))
      .filter(Boolean);

    const isAllowed = allowedDomains.some((allowedDomain: string) =>
      requestDomain.endsWith(allowedDomain) || requestDomain === allowedDomain
    )

    if (isAllowed) {
      return { allowed: true, domain: requestDomain }
    }

    const allowedList = allowedDomains.join(', ')
    return {
      allowed: false,
      error: `Domain not allowed: ${requestDomain}. This chatbot is restricted to: ${allowedList}`,
      domain: requestDomain
    }
  } catch (e) {
    return { allowed: true } // Fallback to allow if parsing fails
  }
}

