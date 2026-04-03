import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-middleware';
import { removeFileFromVectorStore } from '@/lib/openai-vector-store';

/**
 * DELETE /api/vector-stores/[id]/files/[fileId]
 * Remove a file from a vector store
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;

  try {
    await removeFileFromVectorStore(params.id, params.fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error removing file ${params.fileId} from vector store ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove file' },
      { status: 500 }
    );
  }
}
