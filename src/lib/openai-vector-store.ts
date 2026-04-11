import OpenAI from 'openai';
import { getGlobalOpenAIApiKey } from '@/lib/openai-config';

/**
 * Get an OpenAI client instance with the API key from the configured provider settings
 */
export async function getOpenAIClient(apiKeyOverride?: string) {
  let apiKey = apiKeyOverride;

  if (!apiKey) {
    apiKey = await getGlobalOpenAIApiKey() || undefined;
  }

  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure it in Admin -> API Configuration.');
  }

  return new OpenAI({
    apiKey,
  });
}

/**
 * List all vector stores
 */
export async function listVectorStores(apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);
  const vectorStores = await openai.beta.vectorStores.list();
  return vectorStores.data;
}

/**
 * Create a new vector store
 */
export async function createVectorStore(name: string, apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);
  return await openai.beta.vectorStores.create({
    name,
  });
}

/**
 * Get a specific vector store
 */
export async function getVectorStore(id: string, apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);
  return await openai.beta.vectorStores.retrieve(id);
}

/**
 * Delete a vector store
 */
export async function deleteVectorStore(id: string, apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);
  return await openai.beta.vectorStores.del(id);
}

/**
 * List files in a vector store
 */
export async function listVectorStoreFiles(id: string, apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);
  const files = await openai.beta.vectorStores.files.list(id);
  
  // To get filenames, we need to retrieve each file separately from the main Files API
  // or return the IDs and let the frontend/caller handle it if needed.
  // For a better UX, we'll fetch the details.
  const fileDetails = await Promise.all(
    files.data.map(async (vFile) => {
      try {
        const file = await openai.files.retrieve(vFile.id);
        return {
          id: vFile.id,
          name: file.filename,
          size: file.bytes,
          createdAt: file.created_at,
          status: vFile.status,
        };
      } catch (err) {
        return {
          id: vFile.id,
          name: 'Unknown File',
          size: 0,
          createdAt: 0,
          status: vFile.status,
        };
      }
    })
  );

  return fileDetails;
}

/**
 * Upload a file and attach to vector store
 */
export async function uploadFileToVectorStore(vectorStoreId: string, file: File | Buffer, filename: string, apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);

  // 1. Upload file to OpenAI
  const uploadedFile = await openai.files.create({
    file: file as any, // OpenAI SDK handles File or Buffer
    purpose: 'assistants',
  });

  // 2. Attach to vector store
  return await openai.beta.vectorStores.files.create(vectorStoreId, {
    file_id: uploadedFile.id,
  });
}

/**
 * Remove file from vector store
 */
export async function removeFileFromVectorStore(vectorStoreId: string, fileId: string, apiKey?: string) {
  const openai = await getOpenAIClient(apiKey);
  
  // 1. Remove from vector store
  await openai.beta.vectorStores.files.del(vectorStoreId, fileId);
  
  // 2. Delete the actual file from OpenAI (optional, but cleaner)
  try {
    await openai.files.del(fileId);
  } catch (err) {
    console.warn(`Failed to delete file ${fileId} from OpenAI storage, but it was removed from vector store.`);
  }
}
