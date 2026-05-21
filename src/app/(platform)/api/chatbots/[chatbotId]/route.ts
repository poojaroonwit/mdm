import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { mergeVersionConfig, sanitizeChatbotConfig } from '@/lib/chatbot-helper'
import { requireSpaceAccess } from '@/lib/space-access'
import { canAccessChatbot } from '@/lib/chatbot-access'
import {
  assignResourceFolder,
  clearResourceFolderAssignments,
  getFolderState,
  resolveFolderSpaceId,
} from '@/lib/folder-state'

export const dynamic = 'force-dynamic'

async function getAuthorizedChatbot(chatbotId: string, userId: string) {
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!chatbot || chatbot.deletedAt) {
    return null
  }

  const hasAccess = await canAccessChatbot(userId, chatbot)
  if (!hasAccess) {
    return null
  }

  return chatbot
}

// GET - Fetch a specific chatbot by ID
async function getHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params

  const chatbot = await getAuthorizedChatbot(chatbotId, session.user.id!)

  if (!chatbot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  const folderSpaceId = await resolveFolderSpaceId(session.user.id!, chatbot.spaceId || null, 'chatbot')
  const folderState = folderSpaceId ? await getFolderState(folderSpaceId, 'chatbot') : null

  // Merge version config and sanitize (rewrites MinIO URLs to proxy paths, strips API keys)
  const mergedChatbot = await sanitizeChatbotConfig({
    ...mergeVersionConfig(chatbot),
    folder_id: folderState?.assignments[chatbot.id] || null,
  })

  return NextResponse.json({ chatbot: mergedChatbot })
}

// PUT - Update a specific chatbot
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params

  let body: any
  try {
    const rawBody = await request.text()
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }
    body = JSON.parse(rawBody)
  } catch (parseError: any) {
    return NextResponse.json({
      error: 'Invalid JSON body',
      details: parseError.message
    }, { status: 400 })
  }

  const existingChatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
  })

  if (!existingChatbot || existingChatbot.deletedAt) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  const hasAccess = await canAccessChatbot(session.user.id!, existingChatbot)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  // Extract updatable fields from body
  const {
    name,
    website,
    description,
    apiEndpoint,
    apiAuthType,
    apiAuthValue,
    logo,
    primaryColor,
    fontFamily,
    fontSize,
    fontColor,
    borderColor,
    borderWidth,
    borderRadius,
    messageBoxColor,
    shadowColor,
    shadowBlur,
    conversationOpener,
    followUpQuestions,
    enableFileUpload,
    showCitations,
    deploymentType,
    widgetBackgroundColor,
    isPublished = body.is_published,
    currentVersion = body.current_version,
    spaceId = body.space_id,
    folderId = body.folder_id,
    folderSpaceId = body.folder_space_id,
    customEmbedDomain,
    domainAllowlist,
    chatkitAgentId = body.chatkit_agent_id, // Explicitly extract
    chatkitApiKey = body.chatkit_api_key, // Explicitly extract
    chatkitOptions = body.chatkit_options, // Explicitly extract
    engineType = body.engine_type, // Explicitly extract
    // IMPORTANT: Extract and discard internal/system fields to prevent them from
    // being included in versionConfig, which would cause circular references or
    // invalid JSON in the version config. These fields come from the frontend
    // when it sends the full chatbot object.
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    deletedAt: _deletedAt,
    versions: _versions,
    creator: _creator,
    space: _space,
    createdBy: _createdBy,
    ...versionConfig
  } = body

  const normalizedSpaceId = spaceId === 'global' ? null : spaceId

  if (normalizedSpaceId) {
    const accessResult = await requireSpaceAccess(normalizedSpaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response
  }

  // Check if there are version-specific config updates
  // Filter out any remaining internal fields that might have slipped through
  const internalFields = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'versions', 'creator', 'space', 'createdBy']
  const cleanVersionConfig = Object.fromEntries(
    Object.entries(versionConfig).filter(([key]) => !internalFields.includes(key))
  )
  const hasVersionConfig = Object.keys(cleanVersionConfig).length > 0 || chatkitAgentId !== undefined || chatkitApiKey !== undefined || chatkitOptions !== undefined || engineType !== undefined

  // Update the chatbot
  let updatedChatbot: any
  try {
    updatedChatbot = await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        ...(name !== undefined && { name }),
        ...(website !== undefined && { website }),
        ...(description !== undefined && { description }),
        ...(apiEndpoint !== undefined && { apiEndpoint }),
        ...(engineType !== undefined && { engineType }),
        ...(apiAuthType !== undefined && { apiAuthType }),
        ...(apiAuthValue !== undefined && { apiAuthValue }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(fontFamily !== undefined && { fontFamily }),
        ...(fontSize !== undefined && { fontSize }),
        ...(fontColor !== undefined && { fontColor }),
        ...(borderColor !== undefined && { borderColor }),
        ...(borderWidth !== undefined && { borderWidth }),
        ...(borderRadius !== undefined && { borderRadius }),
        ...(messageBoxColor !== undefined && { messageBoxColor }),
        ...(shadowColor !== undefined && { shadowColor }),
        ...(shadowBlur !== undefined && { shadowBlur }),
        ...(conversationOpener !== undefined && { conversationOpener }),
        ...(followUpQuestions !== undefined && { followUpQuestions }),
        ...(enableFileUpload !== undefined && { enableFileUpload }),
        ...(showCitations !== undefined && { showCitations }),
        ...(deploymentType !== undefined && { deploymentType }),
        ...(widgetBackgroundColor !== undefined && { widgetBackgroundColor }),
        // Force Draft mode (isPublished: false) if we are updating config fields (Save action)
        // Only allow isPublished: true if it's explicitly passed AND we are NOT updating config (Publish action)
        isPublished: (hasVersionConfig || name || description || logo || primaryColor || messageBoxColor) ? false : (isPublished !== undefined ? isPublished : undefined),
        ...(currentVersion !== undefined && { currentVersion }),
        ...(spaceId !== undefined && {
          space: normalizedSpaceId
            ? { connect: { id: normalizedSpaceId } }
            : { disconnect: true }
        }),
        ...(customEmbedDomain !== undefined && { customEmbedDomain }),
        ...(domainAllowlist !== undefined && { domainAllowlist }),
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
  } catch (updateError: any) {
    throw updateError
  }

  // Check if there are version-specific config updates (already calculated above)
  if (hasVersionConfig) {
    // Get latest version config to merge with
    const latestVersion = updatedChatbot.versions[0]
    const existingConfig = (latestVersion?.config || {}) as any

    // Build the new config - preserve existing values unless explicitly provided
    // Important: Don't use || null conversion which would lose empty string values
    const newConfig = {
      ...existingConfig,
      ...cleanVersionConfig,
      name: name !== undefined ? name : existingConfig.name,
      website: website !== undefined ? website : existingConfig.website,
      description: description !== undefined ? description : existingConfig.description,
      apiEndpoint: apiEndpoint !== undefined ? apiEndpoint : existingConfig.apiEndpoint,
      apiAuthType: apiAuthType !== undefined ? apiAuthType : existingConfig.apiAuthType,
      apiAuthValue: apiAuthValue !== undefined ? apiAuthValue : existingConfig.apiAuthValue,
      logo: logo !== undefined ? logo : existingConfig.logo,
      primaryColor: primaryColor !== undefined ? primaryColor : existingConfig.primaryColor,
      fontFamily: fontFamily !== undefined ? fontFamily : existingConfig.fontFamily,
      fontSize: fontSize !== undefined ? fontSize : existingConfig.fontSize,
      fontColor: fontColor !== undefined ? fontColor : existingConfig.fontColor,
      borderColor: borderColor !== undefined ? borderColor : existingConfig.borderColor,
      borderWidth: borderWidth !== undefined ? borderWidth : existingConfig.borderWidth,
      borderRadius: borderRadius !== undefined ? borderRadius : existingConfig.borderRadius,
      messageBoxColor: messageBoxColor !== undefined ? messageBoxColor : existingConfig.messageBoxColor,
      widgetBackgroundColor: widgetBackgroundColor !== undefined ? widgetBackgroundColor : existingConfig.widgetBackgroundColor,
      shadowColor: shadowColor !== undefined ? shadowColor : existingConfig.shadowColor,
      shadowBlur: shadowBlur !== undefined ? shadowBlur : existingConfig.shadowBlur,
      conversationOpener: conversationOpener !== undefined ? conversationOpener : existingConfig.conversationOpener,
      followUpQuestions: followUpQuestions !== undefined ? followUpQuestions : existingConfig.followUpQuestions,
      enableFileUpload: enableFileUpload !== undefined ? enableFileUpload : existingConfig.enableFileUpload,
      showCitations: showCitations !== undefined ? showCitations : existingConfig.showCitations,
      deploymentType: deploymentType !== undefined ? deploymentType : existingConfig.deploymentType,
      customEmbedDomain: customEmbedDomain !== undefined ? customEmbedDomain : existingConfig.customEmbedDomain,
      domainAllowlist: domainAllowlist !== undefined ? domainAllowlist : existingConfig.domainAllowlist,
      chatkitAgentId: chatkitAgentId !== undefined ? chatkitAgentId : existingConfig.chatkitAgentId,
      chatkitApiKey: chatkitApiKey !== undefined ? chatkitApiKey : existingConfig.chatkitApiKey,
      chatkitOptions: chatkitOptions !== undefined ? chatkitOptions : existingConfig.chatkitOptions,
      engineType: engineType !== undefined ? engineType : existingConfig.engineType,
    }

    await db.chatbotVersion.create({
      data: {
        chatbotId,
        version: currentVersion || latestVersion?.version || '1.0.0',
        config: newConfig,
        // New versions created from "Save" should always be drafts until explicitly published
        isPublished: false,
        createdBy: session.user.id
      }
    })
  }

  const resolvedFolderSpaceId = await resolveFolderSpaceId(
    session.user.id!,
    folderSpaceId || normalizedSpaceId || existingChatbot.spaceId || null,
    'chatbot'
  )
  if (resolvedFolderSpaceId && (folderId !== undefined || folderSpaceId !== undefined || spaceId !== undefined)) {
    await assignResourceFolder(resolvedFolderSpaceId, 'chatbot', chatbotId, folderId || null)
  }

  // Refetch with updated versions
  const finalChatbot = await getAuthorizedChatbot(chatbotId, session.user.id!)

  const finalFolderState = resolvedFolderSpaceId
    ? await getFolderState(resolvedFolderSpaceId, 'chatbot')
    : null

  // Merge version config into chatbot object
  const mergedChatbot = {
    ...mergeVersionConfig(finalChatbot),
    folder_id: finalFolderState?.assignments[chatbotId] || null,
  }

  return NextResponse.json({ chatbot: mergedChatbot })
}

// DELETE - Soft delete a chatbot
async function deleteHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params

  // Check if chatbot exists and user has access (only owner can delete)
  const existingChatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      createdBy: session.user.id // Only owner can delete
    }
  })

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found or you do not have permission to delete it' }, { status: 404 })
  }

  // Soft delete - set deletedAt timestamp
  await db.chatbot.update({
    where: { id: chatbotId },
    data: {
      deletedAt: new Date()
    }
  })

  await clearResourceFolderAssignments('chatbot', chatbotId)

  return NextResponse.json({ message: 'Chatbot deleted successfully' })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/chatbots/[chatbotId]')
export const PATCH = withErrorHandling(putHandler, 'PATCH /api/chatbots/[chatbotId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]')
