import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const convertSchema = z.object({
  spaceId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.string().optional(),
})

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params
  const bodyValidation = await validateBody(request, convertSchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const submission = await db.intakeSubmission.findUnique({
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

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Check access
  const accessResult = await requireSpaceAccess(submission.form.spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Extract title and description from submission data
    const submissionData = submission.data as any
    const title = bodyValidation.data.title || submissionData.title || submissionData.subject || submissionData.name || 'Ticket from Intake Form'
    const description = bodyValidation.data.description || submissionData.description || submissionData.message || JSON.stringify(submissionData, null, 2)

    // Create ticket
    const ticket = await db.ticket.create({
      data: {
        title,
        description,
        status: bodyValidation.data.status || 'BACKLOG',
        priority: bodyValidation.data.priority || 'MEDIUM',
        createdBy: session.user.id,
        spaces: {
          create: {
            spaceId: bodyValidation.data.spaceId || submission.form.spaceId,
          }
        },
        // Store submission reference in metadata
        metadata: {
          intakeSubmissionId: submission.id,
          intakeFormId: submission.formId,
          ...submissionData
        } as any
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Update submission to CONVERTED and link ticket
    await db.intakeSubmission.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        ticketId: ticket.id
      }
    })

  return NextResponse.json({
    success: true,
    ticket,
    message: 'Submission converted to ticket successfully'
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/intake-submissions/[id]/convert')

