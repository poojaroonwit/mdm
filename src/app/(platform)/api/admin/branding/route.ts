import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { defaultBrandingConfig } from '@/config/branding'
import type { BrandingConfig } from '@/app/admin/features/system/types'

async function getHandler(request: NextRequest) {
  // Allow unauthenticated access for branding (used in public pages like signin)
  // No auth check needed - branding is public information
  
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'branding' }
  })

  // Parse JSON if it exists, otherwise use default
  let branding: BrandingConfig = defaultBrandingConfig
  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value)
      // Merge with defaults to ensure all required fields are present
      branding = { ...defaultBrandingConfig, ...parsed }
    } catch (e) {
      // If parsing fails, use default
      console.error('Failed to parse branding config:', e)
    }
  }

  return NextResponse.json(branding)
}

async function putHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const body = await request.json()
  
  // Validate that it's a valid BrandingConfig structure
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await prisma.systemSetting.upsert({
    where: { key: 'branding' },
    update: { value: JSON.stringify(body) },
    create: { key: 'branding', value: JSON.stringify(body) }
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/branding')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/branding')
