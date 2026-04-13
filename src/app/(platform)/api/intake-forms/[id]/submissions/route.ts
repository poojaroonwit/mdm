import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const submissionSchema = z.object({
  data: z.record(z.string(), z.any()),
})

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const form = await db.intakeForm.findUnique({
    where: { id },
    select: { spaceId: true }
  })

  if (!form) {
    return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
  }

  // Check access
  const accessResult = await requireSpaceAccess(form.spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    const where: any = { formId: id }
    if (status) {
      where.status = status
    }

    const submissions = await db.intakeSubmission.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

  return NextResponse.json({ submissions })
}

export const GET = withErrorHandling(getHandler, 'GET /api/intake-forms/[id]/submissions')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const bodyValidation = await validateBody(request, submissionSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const form = await db.intakeForm.findUnique({
      where: { id, isActive: true }
    })

    if (!form) {
      return NextResponse.json({ error: 'Intake form not found or inactive' }, { status: 404 })
    }

    const submission = await db.intakeSubmission.create({
      data: {
        formId: id,
        userId: session.user.id,
        data: bodyValidation.data.data as any,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

  return NextResponse.json({ success: true, submission }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/intake-forms/[id]/submissions')

