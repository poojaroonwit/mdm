import { prisma } from '@/lib/db'

const CACHE_TTL_MS = 60 * 1000

let settingsCache: { values: Record<string, string>; timestamp: number } | null = null

function normalizeSettingValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function extractOrigin(input?: Request | URL | string | null): string | null {
  if (!input) return null

  try {
    if (typeof input === 'string') return new URL(input).origin
    if (input instanceof URL) return input.origin
    return new URL(input.url).origin
  } catch {
    return null
  }
}

async function readSettings(keys: string[]): Promise<Record<string, string>> {
  const now = Date.now()
  const cache = settingsCache
  if (
    cache &&
    now - cache.timestamp < CACHE_TTL_MS &&
    keys.every((key) => key in cache.values)
  ) {
    return cache.values
  }

  try {
    const missingKeys = cache
      ? keys.filter((key) => !(key in cache.values))
      : keys

    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: missingKeys } },
      select: { key: true, value: true },
    })

    const nextValues = rows.reduce<Record<string, string>>((acc, row) => {
      if (typeof row.value === 'string') {
        acc[row.key] = row.value
      }
      return acc
    }, cache?.values ?? {})

    settingsCache = { values: nextValues, timestamp: now }
    return nextValues
  } catch (error) {
    console.warn('[system-runtime-settings] Failed to load settings:', error)
    return settingsCache?.values ?? {}
  }
}

export function clearSystemRuntimeSettingsCache() {
  settingsCache = null
}

export async function getSystemSettingValue(key: string): Promise<string | null> {
  const values = await readSettings([key])
  return normalizeSettingValue(values[key])
}

export async function getConfiguredSiteUrl(request?: Request | URL | string | null): Promise<string> {
  const configuredSiteUrl = await getSystemSettingValue('siteUrl')
  const fallbackOrigin = extractOrigin(request)
  return (configuredSiteUrl || fallbackOrigin || 'http://localhost:3000').replace(/\/$/, '')
}

export async function getCronApiKey(): Promise<string | null> {
  return getSystemSettingValue('cronApiKey')
}

export async function getSchedulerApiKey(): Promise<string | null> {
  return getSystemSettingValue('schedulerApiKey')
}

export async function getServiceDeskWebhookSecret(): Promise<string | null> {
  return getSystemSettingValue('serviceDeskWebhookSecret')
}

export async function getGitWebhookSecret(): Promise<string | null> {
  return getSystemSettingValue('gitWebhookSecret')
}

export async function getMinioPublicUrl(): Promise<string | null> {
  return getSystemSettingValue('minioPublicUrl')
}
