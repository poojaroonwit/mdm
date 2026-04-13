import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('POST', `/api/spaces/${spaceId}/invite`, { userId: session.user.id })

    const bodySchema = z.object({
      email: z.string().email(),
      role: z.enum(['owner', 'admin', 'member', 'viewer']).optional().default('member'),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { email, role = 'member' } = bodyValidation.data

    // Check if current user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Check if current user has permission to invite members (must be owner or admin)
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to invite member', { spaceId, userId: session.user.id })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get space details
    const spaceResult = await query(`
      SELECT name, description FROM spaces WHERE id = $1
    `, [spaceId])

    if (spaceResult.rows.length === 0) {
      logger.warn('Space not found for invitation', { spaceId })
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const space = spaceResult.rows[0]

    // Check if user already exists
    const existingUser = await query(`
      SELECT id, name, email FROM users WHERE email = $1 AND is_active = true
    `, [email])

    if (existingUser.rows.length > 0) {
      // User exists, add them to the space directly
      const user = existingUser.rows[0]
      
      // Check if they're already a member
      const existingMember = await query(`
        SELECT id FROM space_members WHERE space_id = $1 AND user_id = $2
      `, [spaceId, user.id])

      if (existingMember.rows.length > 0) {
        logger.warn('User is already a member of space', { spaceId, email })
        return NextResponse.json({ error: 'User is already a member of this space' }, { status: 400 })
      }

      // Add user to space
      await query(`
        INSERT INTO space_members (space_id, user_id, role)
        VALUES ($1, $2, $3)
      `, [spaceId, user.id, role])

      const duration = Date.now() - startTime
      logger.apiResponse('POST', `/api/spaces/${spaceId}/invite`, 200, duration, {
        action: 'added_existing_user',
        email,
        role,
      })
      return NextResponse.json({
        success: true,
        message: 'User added to space successfully',
        user: user
      })
    }

    // User doesn't exist, send invitation email
    const invitationToken = generateInvitationToken()
    
    // Store invitation in database
    await query(`
      INSERT INTO space_invitations (space_id, email, role, token, invited_by, expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
    `, [spaceId, email, role, invitationToken, session.user.id])

    // Send invitation email
    await sendInvitationEmail(email, space.name, invitationToken, session.user.name || 'Admin')

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/spaces/${spaceId}/invite`, 200, duration, {
      action: 'sent_invitation',
      email,
      role,
    })
    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      email: email
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/invite')

function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function sendInvitationEmail(
  email: string, 
  spaceName: string, 
  token: string, 
  inviterName: string
) {
  try {
    const invitationUrl = `${env.NEXTAUTH_URL}/invite/${token}`

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited to join ${spaceName}</h2>
          <p>Hello!</p>
          <p><strong>${inviterName}</strong> has invited you to join the space <strong>"${spaceName}"</strong> in our MDM platform.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>
        </div>
      `

    const sent = await sendEmail(email, `You're invited to join ${spaceName}`, html)
    if (!sent) {
      throw new Error('SMTP is not configured in system settings')
    }

    logger.info('Invitation email sent', { email, spaceName })
  } catch (error) {
    logger.error('Error sending invitation email', error, { email, spaceName })
    throw error
  }
}
