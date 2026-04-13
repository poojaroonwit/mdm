import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const models = await prisma.aIModel.findMany({
      where: {
        isAvailable: true
      },
      orderBy: [
        { provider: 'asc' },
        { name: 'asc' }
      ]
    })

    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      type: model.type,
      description: model.description,
      maxTokens: model.maxTokens,
      costPerToken: model.costPerToken,
      isAvailable: model.isAvailable,
      capabilities: model.capabilities || [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    }))

    return NextResponse.json({ models: formattedModels })
  } catch (error: any) {
    console.error('Error fetching AI models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI models', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { name, provider, type, description, maxTokens, costPerToken, capabilities } = body

    const model = await prisma.aIModel.create({
      data: {
        name,
        provider,
        type: type || 'text',
        description,
        maxTokens: maxTokens || 4096,
        costPerToken: costPerToken || 0.000001,
        capabilities: capabilities || [],
        isAvailable: true
      }
    })

    const formattedModel = {
      id: model.id,
      name: model.name,
      provider: model.provider,
      type: model.type,
      description: model.description,
      maxTokens: model.maxTokens,
      costPerToken: model.costPerToken,
      isAvailable: model.isAvailable,
      capabilities: model.capabilities || [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    }

    return NextResponse.json({ model: formattedModel })
  } catch (error: any) {
    console.error('Error creating AI model:', error)
    return NextResponse.json(
      { error: 'Failed to create AI model', details: error.message },
      { status: 500 }
    )
  }
}
