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
      google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      azure: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID),
      error: error.message 
    })
  }
}
