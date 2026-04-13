import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { pluginGateway } from '@/features/marketplace/lib/plugin-gateway'

/**
 * Plugin API Gateway - Routes requests to plugin APIs
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'GET')
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'POST')
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'PUT')
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'DELETE')
}

export const GET = withErrorHandling(getHandler, 'GET /api/plugins/gateway/[slug]/[...path]')
export const POST = withErrorHandling(postHandler, 'POST /api/plugins/gateway/[slug]/[...path]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/plugins/gateway/[slug]/[...path]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/plugins/gateway/[slug]/[...path]')

async function handleGatewayRequest(
  request: NextRequest,
  params: { slug: string; path: string[] },
  method: string
) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { slug, path } = params
    const installationId = request.nextUrl.searchParams.get('installationId')

    if (!installationId) {
      return NextResponse.json(
        { error: 'installationId is required' },
        { status: 400 }
      )
    }

    // Get plugin
    const pluginResult = await query(
      'SELECT * FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    )

    if (pluginResult.rows.length === 0) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }

    const row = pluginResult.rows[0]
    const plugin = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      apiBaseUrl: row.api_base_url,
      apiAuthType: row.api_auth_type,
      apiAuthConfig: row.api_auth_config,
    }

    // Build path
    const apiPath = `/${path.join('/')}`
    const queryString = request.nextUrl.searchParams.toString()
    const fullPath = queryString ? `${apiPath}?${queryString}` : apiPath

    // Get request body if present
    let body = null
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.json()
      } catch {
        // No body
      }
    }

    // Route request through gateway
    const response = await pluginGateway.routeRequest(
      plugin as any,
      installationId,
      fullPath,
      method,
      body,
      Object.fromEntries(request.headers.entries())
    )

    // Forward response
    const responseData = await response.json().catch(() => null)
    const responseHeaders = new Headers()
    
    // Copy relevant headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        responseHeaders.set(key, value)
      }
    })

    return NextResponse.json(responseData || {}, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error('Error in plugin gateway:', error)
    return NextResponse.json(
      { error: 'Gateway error', details: error.message },
      { status: 500 }
    )
  }
}
