import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

// POST /api/auth/reset-password - request a reset token
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

    await query(
      `CREATE TABLE IF NOT EXISTS public.password_resets (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ
      )`
    )

    const { rows } = await query('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [email])
    // Always return success to prevent email enumeration
    if (!rows.length) return NextResponse.json({ success: true })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30) // 30 minutes

    await query('DELETE FROM public.password_resets WHERE user_id = $1', [rows[0].id])
    await query('INSERT INTO public.password_resets (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, rows[0].id, expiresAt])

    const baseUrl = process.env.NEXTAUTH_URL || ''
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`
    const html = `<p>You requested a password reset. Click the link below to set a new password. This link expires in 30 minutes.</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, you can safely ignore this email.</p>`

    sendEmail(email, 'Password Reset Request', html).catch(err =>
      console.error('Failed to send password reset email:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/auth/reset-password - consume reset token and set new password
export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) return NextResponse.json({ error: 'token and password required' }, { status: 400 })

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const { rows } = await query('SELECT user_id, expires_at, used_at FROM public.password_resets WHERE token = $1 LIMIT 1', [token])
    if (!rows.length) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    const pr = rows[0]
    if (pr.used_at || new Date(pr.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token has expired or already been used' }, { status: 400 })
    }

    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.hash(password, 12)
    await query('UPDATE public.users SET password = $1 WHERE id = $2', [hashed, pr.user_id])
    await query('UPDATE public.password_resets SET used_at = NOW() WHERE token = $1', [token])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
