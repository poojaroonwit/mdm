import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

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

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const { id } = await params
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
    WHERE id::text = $1
  `, [id])
  const template = rows[0]

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json(template)
}

async function putHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const { id } = await params

  const bodySchema = z.object({
    subject: z.string().optional(),
    content: z.string().min(1),
    isActive: z.boolean().optional(),
    variables: z.array(z.string()).optional(),
  })

  const validation = await validateBody(request, bodySchema)
  if (!validation.success) return validation.response

  try {
    await ensureTable()
    const { rows } = await query(`
      UPDATE public.notification_templates
      SET
        subject = COALESCE($2, subject),
        content = $3,
        is_active = COALESCE($4, is_active),
        variables = COALESCE($5::jsonb, variables),
        updated_at = NOW()
      WHERE id::text = $1
      RETURNING
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
    `, [
      id,
      validation.data.subject ?? null,
      validation.data.content,
      validation.data.isActive ?? null,
      validation.data.variables ? JSON.stringify(validation.data.variables) : null,
    ])
    const template = rows[0]

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/notification-templates/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/notification-templates/[id]')
