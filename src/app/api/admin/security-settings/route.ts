import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'

const DEFAULTS = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    expirationDays: 90,
  },
  sessionPolicy: {
    timeoutMinutes: 60,
    maxConcurrentSessions: 5,
    requireReauth: false,
  },
  twoFactorAuth: {
    enabled: false,
    requiredForAdmins: false,
    backupCodesEnabled: true,
  },
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const { rows } = await query(
    "SELECT value FROM public.system_settings WHERE key = 'securitySettings' LIMIT 1"
  )

  let settings = DEFAULTS
  if (rows.length && rows[0].value) {
    try {
      const parsed = JSON.parse(rows[0].value)
      settings = {
        passwordPolicy: { ...DEFAULTS.passwordPolicy, ...parsed.passwordPolicy },
        sessionPolicy: { ...DEFAULTS.sessionPolicy, ...parsed.sessionPolicy },
        twoFactorAuth: { ...DEFAULTS.twoFactorAuth, ...parsed.twoFactorAuth },
      }
    } catch {
      // return defaults if parse fails
    }
  }

  return NextResponse.json({ settings })
}

async function putHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const body = await request.json()

  await query(
    `INSERT INTO public.system_settings (key, value)
     VALUES ('securitySettings', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(body)]
  )

  return NextResponse.json({ settings: body })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/security-settings')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/security-settings')
