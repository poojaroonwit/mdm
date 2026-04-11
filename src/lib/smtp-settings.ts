import { query } from '@/lib/db'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

interface RawSettings {
  smtpHost?: string
  smtpPort?: string | number
  smtpUser?: string
  smtpPassword?: string
  smtpSecure?: boolean | string
  orgEmail?: string
  supportEmail?: string
  siteName?: string
}

function parseMaybeJson(value: string) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value && (value.startsWith('{') || value.startsWith('['))) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export async function getSmtpSettings(): Promise<SmtpConfig | null> {
  try {
    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key IN ('global', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpSecure', 'orgEmail', 'supportEmail', 'siteName')"
    )

    if (!rows?.length) {
      return null
    }

    const settings = rows.reduce((acc: RawSettings, row: { key: string; value: string }) => {
      if (row.key === 'global') {
        const globalSettings = parseMaybeJson(row.value)
        if (globalSettings && typeof globalSettings === 'object') {
          Object.assign(acc, globalSettings)
        }
        return acc
      }

      ;(acc as Record<string, unknown>)[row.key] = parseMaybeJson(row.value)
      return acc
    }, {})

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      return null
    }

    const fallbackDomain = (settings.siteName || 'system')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')

    return {
      host: settings.smtpHost,
      port: Number(settings.smtpPort) || 587,
      secure: settings.smtpSecure === true || settings.smtpSecure === 'true',
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
      from: settings.orgEmail || settings.supportEmail || `noreply@${fallbackDomain}.local`,
    }
  } catch (error) {
    console.error('Failed to load SMTP settings from system settings:', error)
    return null
  }
}
