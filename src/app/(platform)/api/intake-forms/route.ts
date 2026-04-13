import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const intakeFormSchema = z.object({
  spaceId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  formFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'number', 'date', 'checkbox', 'user', 'email', 'url', 'file']),
    required: z.boolean().optional().default(false),
    options: z.array(z.string()).optional(),
    placeholder: z.string().optional(),
    validation: z.record(z.string(), z.any()).optional(),
  })),
  workflow: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (spaceId) {
      where.spaceId = spaceId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const forms = await db.intakeForm.findMany({
      where,
      include: {
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ forms })
  } catch (error: any) {
    console.error('Error fetching intake forms:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch intake forms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const bodyValidation = await validateBody(request, intakeFormSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { spaceId, name, description, formFields, workflow, isActive } = bodyValidation.data

    // Check if space exists
    const space = await db.space.findUnique({
      where: { id: spaceId },
      select: { id: true },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Check access
    const accessResult = await requireSpaceAccess(spaceId, session.user.id, 'Access denied to space')
    if (!accessResult.success) return accessResult.response

    const form = await db.intakeForm.create({
      data: {
        spaceId,
        name,
        description,
        formFields: formFields as any,
        workflow: workflow as any,
        isActive: isActive ?? true,
      },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    return NextResponse.json({ success: true, form })
  } catch (error: any) {
    console.error('Error creating intake form:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create intake form' },
      { status: 500 }
    )
  }
}
