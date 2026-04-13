import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get('collectionId')

    const requests = await prisma.apiRequest.findMany({
      where: {
        ...(collectionId && { collectionId }),
        createdBy: session.user.id,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ requests })
}


async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const {
      collectionId,
      name,
      method,
      url,
      headers,
      params,
      body: requestBody,
      bodyType,
      authType,
      authConfig,
      preRequestScript,
      testScript,
      requestType,
      graphqlQuery,
      graphqlVariables,
      order,
    } = body

    const apiRequest = await prisma.apiRequest.create({
      data: {
        collectionId,
        name,
        method: method || 'GET',
        url,
        headers: headers || [],
        params: params || [],
        body: requestBody,
        bodyType,
        authType: authType || 'none',
        authConfig,
        preRequestScript,
        testScript,
        requestType: requestType || 'REST',
        graphqlQuery,
        graphqlVariables,
        order: order || 0,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ request: apiRequest })
}




export const GET = withErrorHandling(getHandler, 'GET GET /api/api-client/requests')
export const POST = withErrorHandling(postHandler, 'POST POST /api/api-client/requests')