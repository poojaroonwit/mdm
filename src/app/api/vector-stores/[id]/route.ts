import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/api-middleware';
import { getVectorStore, deleteVectorStore } from '@/lib/openai-vector-store';

/**
 * GET /api/vector-stores/[id]
 * Get details of a specific vector store
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const vectorStore = await getVectorStore(params.id);
    return NextResponse.json({ vectorStore });
  } catch (error) {
    console.error(`Error retrieving vector store ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve vector store' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vector-stores/[id]
 * Delete a vector store
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;

  try {
    const result = await deleteVectorStore(params.id);
    return NextResponse.json({ success: result.deleted });
  } catch (error) {
    console.error(`Error deleting vector store ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete vector store' },
      { status: 500 }
    );
  }
}
