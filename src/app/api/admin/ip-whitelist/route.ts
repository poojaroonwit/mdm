import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.ip_whitelist (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ip_address TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
    )
  `)
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  await ensureTable()

  const { rows } = await query(
    'SELECT * FROM public.ip_whitelist ORDER BY created_at DESC'
  )

  const whitelist = rows.map((r: any) => ({
    id: r.id,
    ipAddress: r.ip_address,
    description: r.description,
    isActive: r.is_active,
    createdAt: r.created_at,
    createdBy: r.created_by,
  }))

  return NextResponse.json({ whitelist })
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const bodySchema = z.object({
    ipAddress: z.string().min(1),
    description: z.string().optional(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) return bodyValidation.response

  const { ipAddress, description } = bodyValidation.data

  await ensureTable()

  const { rows } = await query(
    `INSERT INTO public.ip_whitelist (ip_address, description, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ipAddress, description || null, authResult.session.user.id]
  )

  const r = rows[0]
  return NextResponse.json({
    entry: {
      id: r.id,
      ipAddress: r.ip_address,
      description: r.description,
      isActive: r.is_active,
      createdAt: r.created_at,
    }
  }, { status: 201 })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/ip-whitelist')
export const POST = withErrorHandling(postHandler, 'POST /api/admin/ip-whitelist')
