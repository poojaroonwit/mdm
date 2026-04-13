import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: [],
    warnings: [],
  }

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    diagnostics.errors.push('DATABASE_URL is not set')
    diagnostics.checks.databaseUrl = { status: 'missing', value: null }
  } else {
    diagnostics.checks.databaseUrl = { 
      status: 'set', 
      value: databaseUrl.replace(/:[^:@]+@/, ':****@') // Mask password
    }
    // Validate format
    try {
      const url = new URL(databaseUrl.replace(/^postgres:\/\//, 'http://'))
      if (!url.hostname || !url.pathname) {
        diagnostics.errors.push('DATABASE_URL format appears invalid')
      }
    } catch (e) {
      diagnostics.errors.push('DATABASE_URL format is invalid')
    }
  }

  // Check NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  if (!nextAuthSecret) {
    diagnostics.warnings.push('NEXTAUTH_SECRET is not set (will use temporary secret in development)')
    diagnostics.checks.nextAuthSecret = { status: 'missing', value: null }
  } else {
    diagnostics.checks.nextAuthSecret = { 
      status: 'set', 
      value: nextAuthSecret.length > 0 ? `${nextAuthSecret.substring(0, 10)}...` : 'empty'
    }
  }

  // Check NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (!nextAuthUrl) {
    diagnostics.warnings.push('NEXTAUTH_URL is not set')
    diagnostics.checks.nextAuthUrl = { status: 'missing', value: null }
  } else {
    diagnostics.checks.nextAuthUrl = { status: 'set', value: nextAuthUrl }
  }

  // Check Prisma Client
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    diagnostics.checks.prisma = { status: 'connected', value: 'OK' }
    await prisma.$disconnect()
  } catch (error: any) {
    diagnostics.errors.push(`Prisma connection failed: ${error.message}`)
    diagnostics.checks.prisma = { status: 'error', value: error.message }
  }

  // Check Database Connection
  try {
    const { query } = await import('@/lib/db')
    await query('SELECT 1 as test')
    diagnostics.checks.databaseConnection = { status: 'connected', value: 'OK' }
  } catch (error: any) {
    diagnostics.errors.push(`Database connection failed: ${error.message}`)
    diagnostics.checks.databaseConnection = { status: 'error', value: error.message }
  }

  // Check other important env vars
  const importantVars = [
    'NEXT_PUBLIC_API_URL',
    'ENCRYPTION_KEY',
  ]

  importantVars.forEach((varName) => {
    const value = process.env[varName]
    if (!value) {
      diagnostics.warnings.push(`${varName} is not set`)
      diagnostics.checks[varName] = { status: 'missing', value: null }
    } else {
      diagnostics.checks[varName] = { 
        status: 'set', 
        value: varName.includes('SECRET') || varName.includes('KEY') 
          ? `${value.substring(0, 10)}...` 
          : value
      }
    }
  })

  const status = diagnostics.errors.length > 0 ? 'error' : diagnostics.warnings.length > 0 ? 'warning' : 'ok'
  
  return NextResponse.json({
    ...diagnostics,
    status,
    summary: {
      totalErrors: diagnostics.errors.length,
      totalWarnings: diagnostics.warnings.length,
      allChecksPassed: diagnostics.errors.length === 0,
    }
  }, { 
    status: diagnostics.errors.length > 0 ? 500 : 200 
  })
}

