import { query } from '@/lib/db'
import { randomUUID } from 'crypto'

export type SupportedFolderType = 'data_model' | 'chatbot'

export interface FolderItem {
  id: string
  name: string
  type: SupportedFolderType
  space_id: string
  parent_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

type FolderState = {
  folders: FolderItem[]
  assignments: Record<string, string | null>
}

function getFolderStateKey(spaceId: string, type: SupportedFolderType) {
  return `folder_state_${type}_${spaceId}`
}

function normalizeFolderItem(input: any): FolderItem | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const id = typeof input.id === 'string' ? input.id.trim() : ''
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const type = input.type === 'data_model' || input.type === 'chatbot' ? input.type : null
  const spaceId = typeof input.space_id === 'string' ? input.space_id.trim() : ''
  const parentId = typeof input.parent_id === 'string' && input.parent_id.trim() ? input.parent_id.trim() : null
  const createdAt = typeof input.created_at === 'string' ? input.created_at : new Date().toISOString()
  const updatedAt = typeof input.updated_at === 'string' ? input.updated_at : createdAt
  const createdBy = typeof input.created_by === 'string' && input.created_by.trim() ? input.created_by.trim() : null

  if (!id || !name || !type || !spaceId) {
    return null
  }

  return {
    id,
    name,
    type,
    space_id: spaceId,
    parent_id: parentId,
    created_at: createdAt,
    updated_at: updatedAt,
    created_by: createdBy,
  }
}

function normalizeFolderState(input: any): FolderState {
  const folders = Array.isArray(input?.folders)
    ? input.folders.map(normalizeFolderItem).filter((item): item is FolderItem => Boolean(item))
    : []

  const assignments =
    input?.assignments && typeof input.assignments === 'object' && !Array.isArray(input.assignments)
      ? Object.fromEntries(
          Object.entries(input.assignments)
            .filter(([key]) => typeof key === 'string' && key.trim().length > 0)
            .map(([key, value]) => [key, typeof value === 'string' && value.trim() ? value.trim() : null])
        )
      : {}

  return { folders, assignments }
}

export async function resolveFolderSpaceId(userId: string, requestedSpaceId?: string | null, type?: string) {
  // Chatbot folders are global and do not depend on spaces
  if (type === 'chatbot') {
    return 'global'
  }

  if (requestedSpaceId) {
    return requestedSpaceId
  }

  const { rows } = await query(
    `SELECT s.id
     FROM public.spaces s
     JOIN public.space_members sm ON sm.space_id = s.id AND sm.user_id::text = $1
     WHERE s.is_default = true AND s.deleted_at IS NULL
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  )

  if (rows.length > 0) {
    return rows[0].id
  }

  // Fallback: If no default space, use the first space they have access to
  const fallback = await query(
    `SELECT s.id
     FROM public.spaces s
     JOIN public.space_members sm ON sm.space_id = s.id AND sm.user_id::text = $1
     WHERE s.deleted_at IS NULL
     ORDER BY s.created_at ASC
     LIMIT 1`,
    [userId]
  )

  return fallback.rows[0]?.id || null
}

export async function getFolderState(spaceId: string, type: SupportedFolderType): Promise<FolderState> {
  const { rows } = await query('SELECT value FROM system_settings WHERE key = $1', [getFolderStateKey(spaceId, type)])
  const rawValue = rows[0]?.value

  if (!rawValue) {
    return { folders: [], assignments: {} }
  }

  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
    return normalizeFolderState(parsed)
  } catch {
    return { folders: [], assignments: {} }
  }
}

async function saveFolderState(spaceId: string, type: SupportedFolderType, state: FolderState) {
  const key = getFolderStateKey(spaceId, type)
  const value = JSON.stringify({
    folders: state.folders,
    assignments: state.assignments,
  })

  await query(
    `INSERT INTO system_settings (id, key, value, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  )
}

export async function getFolderById(spaceId: string, type: SupportedFolderType, folderId: string) {
  const state = await getFolderState(spaceId, type)
  return state.folders.find((folder) => folder.id === folderId) || null
}

export async function createFolderStateEntry(
  spaceId: string,
  type: SupportedFolderType,
  payload: {
    name: string
    parent_id?: string | null
    created_by?: string | null
  }
) {
  const state = await getFolderState(spaceId, type)
  const name = payload.name.trim()
  const parentId = payload.parent_id || null

  if (parentId && !state.folders.some((folder) => folder.id === parentId)) {
    throw new Error('Parent folder not found')
  }

  const duplicate = state.folders.find(
    (folder) => folder.parent_id === parentId && folder.name.toLowerCase() === name.toLowerCase()
  )
  if (duplicate) {
    throw new Error('A folder with this name already exists at this level')
  }

  const now = new Date().toISOString()
  const folder: FolderItem = {
    id: randomUUID(),
    name,
    type,
    space_id: spaceId,
    parent_id: parentId,
    created_at: now,
    updated_at: now,
    created_by: payload.created_by || null,
  }

  state.folders.push(folder)
  await saveFolderState(spaceId, type, state)
  return folder
}

function collectDescendantIds(folders: FolderItem[], folderId: string, bucket = new Set<string>()) {
  bucket.add(folderId)
  for (const child of folders.filter((folder) => folder.parent_id === folderId)) {
    collectDescendantIds(folders, child.id, bucket)
  }
  return bucket
}

export async function updateFolderStateEntry(
  spaceId: string,
  type: SupportedFolderType,
  folderId: string,
  payload: {
    name?: string
    parent_id?: string | null
  }
) {
  const state = await getFolderState(spaceId, type)
  const folderIndex = state.folders.findIndex((folder) => folder.id === folderId)
  if (folderIndex === -1) {
    throw new Error('Folder not found')
  }

  const current = state.folders[folderIndex]
  const nextParentId = payload.parent_id === undefined ? current.parent_id : payload.parent_id
  const nextName = payload.name === undefined ? current.name : payload.name.trim()

  if (!nextName) {
    throw new Error('Folder name is required')
  }

  if (nextParentId && !state.folders.some((folder) => folder.id === nextParentId)) {
    throw new Error('Parent folder not found')
  }

  const descendants = collectDescendantIds(state.folders, folderId)
  if (nextParentId && descendants.has(nextParentId)) {
    throw new Error('Folder cannot be moved inside itself')
  }

  const duplicate = state.folders.find(
    (folder) =>
      folder.id !== folderId &&
      folder.parent_id === (nextParentId || null) &&
      folder.name.toLowerCase() === nextName.toLowerCase()
  )
  if (duplicate) {
    throw new Error('A folder with this name already exists at this level')
  }

  const updatedFolder: FolderItem = {
    ...current,
    name: nextName,
    parent_id: nextParentId || null,
    updated_at: new Date().toISOString(),
  }

  state.folders[folderIndex] = updatedFolder
  await saveFolderState(spaceId, type, state)
  return updatedFolder
}

export async function deleteFolderStateEntry(spaceId: string, type: SupportedFolderType, folderId: string) {
  const state = await getFolderState(spaceId, type)
  if (!state.folders.some((folder) => folder.id === folderId)) {
    throw new Error('Folder not found')
  }

  const deletedIds = collectDescendantIds(state.folders, folderId)
  state.folders = state.folders.filter((folder) => !deletedIds.has(folder.id))
  state.assignments = Object.fromEntries(
    Object.entries(state.assignments).map(([resourceId, assignedFolderId]) => [
      resourceId,
      assignedFolderId && deletedIds.has(assignedFolderId) ? null : assignedFolderId,
    ])
  )

  await saveFolderState(spaceId, type, state)
  return Array.from(deletedIds)
}

export async function assignResourceFolder(
  spaceId: string,
  type: SupportedFolderType,
  resourceId: string,
  folderId: string | null
) {
  const state = await getFolderState(spaceId, type)
  if (folderId && !state.folders.some((folder) => folder.id === folderId)) {
    throw new Error('Folder not found')
  }

  state.assignments[resourceId] = folderId
  await saveFolderState(spaceId, type, state)
}

export async function clearResourceFolderAssignments(type: SupportedFolderType, resourceId: string) {
  const prefix = `folder_state_${type}_%`
  const { rows } = await query('SELECT key, value FROM system_settings WHERE key LIKE $1', [prefix])

  for (const row of rows) {
    const parsed = normalizeFolderState(typeof row.value === 'string' ? JSON.parse(row.value) : row.value)
    if (!(resourceId in parsed.assignments)) {
      continue
    }

    delete parsed.assignments[resourceId]
    await query(
      'UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2',
      [JSON.stringify(parsed), row.key]
    )
  }
}
