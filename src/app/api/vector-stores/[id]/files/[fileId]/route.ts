import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-middleware';
import { removeFileFromVectorStore } from '@/lib/openai-vector-store';

/**
 * DELETE /api/vector-stores/[id]/files/[fileId]
 * Remove a file from a vector store
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;

  try {
    const { id, fileId } = await params;
    await removeFileFromVectorStore(id, fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { id, fileId } = await params;
    console.error(`Error removing file ${fileId} from vector store ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove file' },
      { status: 500 }
    );
  }
}
