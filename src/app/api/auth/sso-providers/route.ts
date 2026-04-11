import { NextRequest, NextResponse } from 'next/server'
import { getPublicSSOAvailability } from '@/lib/sso'

export async function GET(request: NextRequest) {
  try {
    const config = await getPublicSSOAvailability()

    return NextResponse.json({
      google: config.google,
      azure: config.azure
    })
  } catch (error: any) {
    console.error('[SSO-Providers] CRITICAL ERROR:', error)
    return NextResponse.json({
      google: false,
      azure: false,
      error: error.message 
    })
  }
}
