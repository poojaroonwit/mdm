import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/api-middleware';
import { listVectorStores, createVectorStore } from '@/lib/openai-vector-store';

/**
 * GET /api/vector-stores
 * List all vector stores
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const vectorStores = await listVectorStores();
    return NextResponse.json({ vectorStores });
  } catch (error) {
    console.error('Error listing vector stores:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list vector stores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vector-stores
 * Create a new vector store
 */
export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const vectorStore = await createVectorStore(name);
    return NextResponse.json({ vectorStore });
  } catch (error) {
    console.error('Error creating vector store:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create vector store' },
      { status: 500 }
    );
  }
}
