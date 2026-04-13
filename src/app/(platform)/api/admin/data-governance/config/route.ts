import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

const CONFIG_KEY = 'data_governance_config'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Load from system_settings table
    const result = await query(
      `SELECT value FROM system_settings WHERE key = $1`,
      [CONFIG_KEY]
    )

    let config = null
    if (result.rows.length > 0 && result.rows[0].value) {
      try {
        config = typeof result.rows[0].value === 'string' 
          ? JSON.parse(result.rows[0].value) 
          : result.rows[0].value
      } catch (parseError) {
        console.error('Error parsing data governance config:', parseError)
        config = null
      }
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error loading data governance config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/data-governance/config')

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { config } = body

    if (!config.host) {
      return NextResponse.json(
        { error: 'OpenMetadata host is required' },
        { status: 400 }
      )
    }

    // Validate OpenMetadata connection
    try {
      const testUrl = `${config.host}/api/v1/system/version`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (config.authProvider === 'basic' && config.authConfig?.username && config.authConfig?.password) {
        const credentials = Buffer.from(
          `${config.authConfig.username}:${config.authConfig.password}`
        ).toString('base64')
        headers['Authorization'] = `Basic ${credentials}`
      } else if (config.authProvider === 'jwt' && config.authConfig?.jwtToken) {
        headers['Authorization'] = `Bearer ${config.authConfig.jwtToken}`
      }

      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers,
      })

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to connect to OpenMetadata. Please check your configuration.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to connect to OpenMetadata. Please check your configuration.' },
        { status: 400 }
      )
    }

    // Save config to system_settings table
    const configWithTimestamp = {
      ...config,
      lastSync: new Date().toISOString()
    }
    
    // Generate UUID for new records
    // We try to update first, if it fails (not found), we insert with new ID
    // Actually, ON CONFLICT handles it, but we need an ID for the INSERT part
    const { v4: uuidv4 } = require('uuid')
    
    await query(
      `INSERT INTO system_settings (id, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [uuidv4(), CONFIG_KEY, JSON.stringify(configWithTimestamp)]
    )

    return NextResponse.json({ 
      success: true,
      config: configWithTimestamp
    })
  } catch (error) {
    console.error('Error saving data governance config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/data-governance/config')


