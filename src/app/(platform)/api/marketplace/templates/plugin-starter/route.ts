import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { buildPluginStarterBundle } from '@/lib/project-developer'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const { searchParams } = new URL(request.url)
  const bundle = buildPluginStarterBundle({
    slug: searchParams.get('slug') || undefined,
    name: searchParams.get('name') || undefined,
    provider: searchParams.get('provider') || undefined,
    category: (searchParams.get('category') as any) || undefined,
  })

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${bundle.downloadFileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/templates/plugin-starter')
