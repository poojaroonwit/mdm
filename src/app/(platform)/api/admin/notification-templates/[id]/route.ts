import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const { id } = await params
  const template = await prisma.notificationTemplate.findUnique({
    where: { id }
  })

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
    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: validation.data
    })
    
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/notification-templates/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/notification-templates/[id]')
