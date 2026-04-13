import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/api-middleware';
import { getVectorStore, deleteVectorStore } from '@/lib/openai-vector-store';

/**
 * GET /api/vector-stores/[id]
 * Get details of a specific vector store
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;
    const vectorStore = await getVectorStore(id);
    return NextResponse.json({ vectorStore });
  } catch (error) {
    const { id } = await params;
    console.error(`Error retrieving vector store ${id}:`, error);
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
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;

  try {
    const { id } = await params;
    const result = await deleteVectorStore(id);
    return NextResponse.json({ success: result.deleted });
  } catch (error) {
    const { id } = await params;
    console.error(`Error deleting vector store ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete vector store' },
      { status: 500 }
    );
  }
}
