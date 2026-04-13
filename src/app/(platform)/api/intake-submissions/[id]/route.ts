import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const updateSubmissionSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONVERTED']).optional(),
})

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  const submission = await db.intakeSubmission.findUnique({
    where: { id },
    include: {
      form: {
        include: {
          space: {
            select: { id: true, name: true }
          }
        }
      },
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  })

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Check access - user can view their own submission, or space members/owners
  if (submission.userId !== session.user.id!) {
    const accessResult = await requireSpaceAccess(submission.form.spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response
  }

  return NextResponse.json({ submission })
}

export const GET = withErrorHandling(getHandler, 'GET /api/intake-submissions/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params
  const bodyValidation = await validateBody(request, updateSubmissionSchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const existingSubmission = await db.intakeSubmission.findUnique({
    where: { id },
    include: {
      form: {
        include: {
          space: {
            select: { id: true }
          }
        }
      }
    }
  })

  if (!existingSubmission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Check access (only space members/owners can update)
  const accessResult = await requireSpaceAccess(existingSubmission.form.spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    const updateData: any = {}
    if (bodyValidation.data.status !== undefined) {
      updateData.status = bodyValidation.data.status
    }

    const updatedSubmission = await db.intakeSubmission.update({
      where: { id },
      data: updateData,
      include: {
        form: true,
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

  return NextResponse.json({ success: true, submission: updatedSubmission })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/intake-submissions/[id]')

