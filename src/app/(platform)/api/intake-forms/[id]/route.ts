import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const updateIntakeFormSchema = z.object({
  name: z.string().min(1).optional(),
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
  })).optional(),
  workflow: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
})

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    const form = await db.intakeForm.findUnique({
      where: { id },
      include: {
        space: {
          select: { id: true, name: true }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

    // Check access
    const accessResult = await requireSpaceAccess(form.spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    return NextResponse.json({ form })
}

export const GET = withErrorHandling(getHandler, 'GET /api/intake-forms/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const bodyValidation = await validateBody(request, updateIntakeFormSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { name, description, formFields, workflow, isActive } = bodyValidation.data

    const existingForm = await db.intakeForm.findUnique({
      where: { id },
      include: { space: { select: { id: true } } }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

    // Check access
    const accessResult = await requireSpaceAccess(existingForm.spaceId, session.user.id)
    if (!accessResult.success) return accessResult.response

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (formFields !== undefined) updateData.formFields = formFields as any
    if (workflow !== undefined) updateData.workflow = workflow as any
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedForm = await db.intakeForm.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    return NextResponse.json({ success: true, form: updatedForm })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/intake-forms/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    const existingForm = await db.intakeForm.findUnique({
      where: { id },
      include: { space: { select: { id: true } } }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

    // Check access
    const accessResult = await requireSpaceAccess(existingForm.spaceId, session.user.id)
    if (!accessResult.success) return accessResult.response

    await db.intakeForm.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Intake form deleted successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/intake-forms/[id]')

