import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/db' // Assuming prisma is available for system settings access

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'adSyncSchedule' }
  })

  // Parse JSON if it exists, otherwise default
  let schedule = { enabled: false, frequency: 'daily', time: '00:00' }
  if (setting?.value) {
    try {
        schedule = JSON.parse(setting.value)
    } catch (e) {
        // ignore
    }
  }

  return NextResponse.json(schedule)
}

async function putHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    const body = await request.json()
    // Validate body structure briefly
    if (typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await prisma.systemSetting.upsert({
        where: { key: 'adSyncSchedule' },
        update: { value: JSON.stringify(body) },
        create: { key: 'adSyncSchedule', value: JSON.stringify(body) }
    })

    return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/settings/ad-sync-schedule')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/settings/ad-sync-schedule')
