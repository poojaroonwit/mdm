import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.security_policies (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  await ensureTable()

  const { rows } = await query(
    'SELECT * FROM public.security_policies ORDER BY created_at DESC'
  )

  const policies = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    isActive: r.is_active,
    settings: r.settings,
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  return NextResponse.json({ policies })
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const bodySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['password', 'session', 'ip', 'rate_limit', '2fa']),
    settings: z.record(z.any()).optional().default({}),
    description: z.string().optional(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) return bodyValidation.response

  const { name, type, settings, description } = bodyValidation.data

  await ensureTable()

  const { rows } = await query(
    `INSERT INTO public.security_policies (name, type, settings, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, type, JSON.stringify(settings), description || null]
  )

  const r = rows[0]
  return NextResponse.json({
    policy: {
      id: r.id,
      name: r.name,
      type: r.type,
      isActive: r.is_active,
      settings: r.settings,
      description: r.description,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }, { status: 201 })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/security-policies')
export const POST = withErrorHandling(postHandler, 'POST /api/admin/security-policies')
