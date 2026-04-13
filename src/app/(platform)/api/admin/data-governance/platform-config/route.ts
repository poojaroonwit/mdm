import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    // TODO: Load from database
    // For now, return default empty config
    const config = {
      dataDomains: [],
      classificationSchemes: [],
      qualityRules: [],
      retentionPolicies: [],
      accessControlRules: [],
      dataStewards: [],
      businessGlossary: [],
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error loading platform governance config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/data-governance/platform-config',
)

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    const body = await request.json()
    const { config } = body

    // TODO: Save to database
    // await savePlatformGovernanceConfig(config)

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Error saving platform governance config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/data-governance/platform-config',
)