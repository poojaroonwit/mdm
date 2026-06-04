import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.notification_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'email',
      subject TEXT,
      content TEXT NOT NULL,
      variables JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  await ensureTable()
  
  const { rows } = await query(`
    SELECT
      id,
      key,
      name,
      type,
      subject,
      content,
      variables,
      is_active AS "isActive",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM public.notification_templates
    ORDER BY name ASC
  `)
  
  return NextResponse.json(rows)
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/notification-templates')
