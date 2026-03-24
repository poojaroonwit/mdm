import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/api-middleware';
import { listVectorStoreFiles, uploadFileToVectorStore } from '@/lib/openai-vector-store';

/**
 * GET /api/vector-stores/[id]/files
 * List all files in a vector store
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult.response;

  try {
    const files = await listVectorStoreFiles(params.id);
    return NextResponse.json({ files });
  } catch (error) {
    console.error(`Error listing files for vector store ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vector-stores/[id]/files
 * Upload a file and attach to vector store
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer for OpenAI SDK if needed, 
    // though modern OpenAI SDK often handles File objects in Node.js environments.
    // We'll pass it through and let the utility handle it.
    const result = await uploadFileToVectorStore(params.id, file, file.name);
    
    return NextResponse.json({ success: true, file: result });
  } catch (error) {
    console.error(`Error uploading file to vector store ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}
