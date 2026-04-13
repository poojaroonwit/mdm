import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { checkRateLimit } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit('signup', ip, {
      enabled: true,
      maxRequestsPerHour: 5, // Strict limit for signups
      blockDuration: 3600,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Check system settings
    const settingsRecord = await prisma.systemSetting.findUnique({
      where: { key: 'global' }
    })

    let enableUserRegistration = true
    let requireAdminApproval = false

    if (settingsRecord) {
      try {
        const settings = JSON.parse(settingsRecord.value)
        enableUserRegistration = settings.enableUserRegistration ?? true
        requireAdminApproval = settings.requireAdminApproval ?? false
      } catch (e) {
        console.error('Failed to parse system settings during signup', e)
      }
    }

    if (!enableUserRegistration) {
      return NextResponse.json(
        { error: 'User registration is currently disabled' },
        { status: 403 }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    const initialIsActive = !requireAdminApproval

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: 'USER',
        isActive: initialIsActive
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    })

    const message = requireAdminApproval
      ? 'Account created successfully. Please wait for admin approval.'
      : 'User created successfully'

    return NextResponse.json(
      { message, user: newUser },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
