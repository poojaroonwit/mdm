import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import crypto from 'crypto'

// POST /api/auth/invite - create an invite token for an email (ADMIN+)
export async function POST(request: NextRequest) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { email, role = 'USER' } = await request.json()
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

    await query(
      `CREATE TABLE IF NOT EXISTS public.invites (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ
      )`
    )

    await query(
      'INSERT INTO public.invites (token, email, role, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (token) DO NOTHING',
      [token, email, role, expiresAt]
    )

    return NextResponse.json({ token, expires_at: expiresAt.toISOString() })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
