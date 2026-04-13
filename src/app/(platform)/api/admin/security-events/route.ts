import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.security_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      type TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
      user_name TEXT,
      description TEXT,
      severity TEXT NOT NULL DEFAULT 'low',
      resolved BOOLEAN NOT NULL DEFAULT false,
      ip_address TEXT,
      user_agent TEXT,
      details JSONB
    )
  `)
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  await ensureTable()

  const { rows } = await query(
    'SELECT * FROM public.security_events ORDER BY timestamp DESC LIMIT 200'
  )

  const events = rows.map((r: any) => ({
    id: r.id,
    type: r.type,
    timestamp: r.timestamp,
    userId: r.user_id,
    userName: r.user_name,
    description: r.description,
    severity: r.severity,
    resolved: r.resolved,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    details: r.details,
  }))

  return NextResponse.json({ events })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/security-events')
