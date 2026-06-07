'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChatbotList, ChatbotListSkeleton } from '@/app/admin/components/chatbot/ChatbotList'
import { Chatbot, ChatbotFolder } from '@/app/admin/components/chatbot/types'
import { Button } from '@/components/ui/button'
import { Plus, Folder as FolderIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSpace } from '@/contexts/space-context'
import { ChatbotEditingWorkspace } from './ChatbotEditingWorkspace'
import { ChatbotFolderDialog } from './ChatbotFolderDialog'
import { createDefaultChatbotDraft } from './chatbotDraftDefaults'

export default function ChatEmbedUIPage() {
    const router = useRouter()
    const { status } = useSession()
    const { currentSpace } = useSpace()
    const [chatbots, setChatbots] = useState<Chatbot[]>([])
    const [folders, setFolders] = useState<ChatbotFolder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'table' | 'card' | 'list'>('list')
    const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editorFormData, setEditorFormData] = useState<Partial<Chatbot>>({})
    const [activeTab, setActiveTab] = useState<'engine' | 'style' | 'config' | 'performance' | 'pwa'>('engine')
    const [previewMode, setPreviewMode] = useState<'popover' | 'fullpage' | 'popup-center'>('popover')
    const [deploymentDrawerOpen, setDeploymentDrawerOpen] = useState(false)
    const [folderSpaceId, setFolderSpaceId] = useState<string | null>(null)
    const [folderDialogOpen, setFolderDialogOpen] = useState(false)
    const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'rename'>('create')
    const [folderName, setFolderName] = useState('')
    const [folderTarget, setFolderTarget] = useState<ChatbotFolder | null>(null)

    const fetchFolders = async (spaceId?: string | null) => {
        if (status !== 'authenticated') {
            setFolders([])
            return
        }

        try {
            const params = new URLSearchParams({ type: 'chatbot' })
            if (spaceId) {
                params.set('space_id', spaceId)
            }

            const res = await fetch(`/api/folders?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch folders')
            const data = await res.json()
            setFolders(data.folders || [])
            setFolderSpaceId(data.spaceId || spaceId || null)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load chatbot folders')
        }
    }

    const fetchChatbots = async () => {
        if (status !== 'authenticated') {
            setChatbots([])
            setFolders([])
            setIsLoading(status === 'loading')
            return
        }

        setIsLoading(true)
        try {
            // Assuming GET /api/chatbots returns { chatbots: Chatbot[] }
            const res = await fetch('/api/chatbots')
            if (!res.ok) throw new Error('Failed to fetch chatbots')
            const data = await res.json()
            setChatbots(data.chatbots || [])
            await fetchFolders(data.folderSpaceId || null)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load chatbots')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchChatbots()
    }, [status])

    const handleCreate = () => {
        setSelectedChatbot(null)
        setEditorFormData(createDefaultChatbotDraft())
        setIsEditing(true)
        setActiveTab('engine')
    }

    const openCreateFolderDialog = () => {
        setFolderDialogMode('create')
        setFolderTarget(null)
        setFolderName('')
        setFolderDialogOpen(true)
    }

    const openRenameFolderDialog = (folder: ChatbotFolder) => {
        setFolderDialogMode('rename')
        setFolderTarget(folder)
        setFolderName(folder.name)
        setFolderDialogOpen(true)
    }

    const handleSaveFolder = async () => {
        const trimmedName = folderName.trim()
        if (!trimmedName) {
            toast.error('Folder name is required')
            return
        }

        try {
            if (folderDialogMode === 'create') {
                const res = await fetch('/api/folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: trimmedName,
                        type: 'chatbot',
                        // space_id is now handled globally on the backend for 'chatbot' type
                    })
                })
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.error || 'Failed to create folder')
                }
                toast.success('Folder created')
            } else if (folderTarget) {
                const params = new URLSearchParams({ type: 'chatbot' })
                if (folderSpaceId) {
                    params.set('space_id', folderSpaceId)
                }
                const res = await fetch(`/api/folders/${folderTarget.id}?${params.toString()}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: trimmedName,
                        type: 'chatbot',
                        // space_id is now handled globally on the backend for 'chatbot' type
                    })
                })
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.error || 'Failed to rename folder')
                }
                toast.success('Folder renamed')
            }

            setFolderDialogOpen(false)
            setFolderName('')
            setFolderTarget(null)
            await fetchFolders(folderSpaceId)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to save folder')
        }
    }

    const handleDeleteFolder = async (folder: ChatbotFolder) => {
        if (!confirm(`Delete folder "${folder.name}"? Chatbots inside will be moved back to the root list.`)) {
            return
        }

        try {
            const params = new URLSearchParams({ type: 'chatbot' })
            if (folderSpaceId) {
                params.set('space_id', folderSpaceId)
            }
            const res = await fetch(`/api/folders/${folder.id}?${params.toString()}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to delete folder')
            }

            setChatbots(prev => prev.map(chatbot =>
                chatbot.folder_id === folder.id ? { ...chatbot, folder_id: null } : chatbot
            ))
            toast.success('Folder deleted')
            await fetchFolders(folderSpaceId)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to delete folder')
        }
    }

    const handleMoveChatbot = async (chatbotId: string, folderId: string | null) => {
        const chatbot = chatbots.find(item => item.id === chatbotId)
        if (!chatbot || chatbot.folder_id === folderId) {
            return
        }

        try {
            const res = await fetch(`/api/chatbots/${chatbotId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder_id: folderId,
                    // folder_space_id is now handled globally on the backend for 'chatbot' type
                })
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to move chatbot')
            }

            const data = await res.json()
            setChatbots(prev => prev.map(item => item.id === chatbotId ? { ...item, ...data.chatbot, folder_id: folderId } : item))
            toast.success(folderId ? 'Chatbot moved to folder' : 'Chatbot moved to root')
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to move chatbot')
        }
    }

    // ... handleEdit, handleDelete ...

    const handleEdit = (chatbot: Chatbot) => {
        setSelectedChatbot(chatbot)
        setEditorFormData(chatbot)
        setIsEditing(true)
        setActiveTab('engine')
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this chatbot?')) return

        try {
            const res = await fetch(`/api/chatbots/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete chatbot')
            toast.success('Chatbot deleted')
            fetchChatbots()
        } catch (error) {
            console.error(error)
            toast.error('Failed to delete chatbot')
        }
    }

    // Helper to increment version string (e.g., "1.0.0" -> "1.0.1")
    const incrementVersion = (version: string | undefined): string => {
        if (!version) return '1.0.0'
        const parts = version.split('.')
        if (parts.length !== 3) return '1.0.0'
        const patch = parseInt(parts[2] || '0', 10) + 1
        return `${parts[0]}.${parts[1]}.${patch}`
    }

    const handleSave = async (dataOverride?: Partial<Chatbot>): Promise<Chatbot | null> => {
        const currentVersion = editorFormData.currentVersion || selectedChatbot?.currentVersion || '1.0.0'
        // Check if current version is a draft (not published)
        // If isPublished is undefined, treat as draft (new chatbot)
        const isCurrentlyDraft = editorFormData.isPublished === false || editorFormData.isPublished === undefined
        
        // If current version is already a draft, update it instead of creating a new one
        // Only create a new draft version if the current version is published
        const versionToSave = isCurrentlyDraft ? currentVersion : incrementVersion(currentVersion)
        
        // Strip massive nested objects to prevent 10MB payload size limits
        const {
            id: _id,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            deletedAt: _deletedAt,
            versions: _versions,
            creator: _creator,
            space: _space,
            createdBy: _createdBy,
            ...cleanData
        } = { ...editorFormData, ...dataOverride } as any;

        const dataToSave = { 
            ...cleanData,
            currentVersion: versionToSave,
            isPublished: false // Always save as draft
        }

        // Client-side validation
        if (!dataToSave.name) {
            toast.error('Name is required')
            return null
        }
        if (!dataToSave.website) {
            toast.error('Website is required')
            return null
        }
        if (dataToSave.engineType === 'custom' && !dataToSave.apiEndpoint) {
            toast.error('API Endpoint is required for Custom engine')
            return null
        }

        try {
            const url = selectedChatbot ? `/api/chatbots/${selectedChatbot.id}` : '/api/chatbots'
            const method = selectedChatbot ? 'PATCH' : 'POST'

            const action = isCurrentlyDraft ? 'updating' : 'creating'
            console.log(`${action} chatbot draft with version:`, versionToSave)
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            })

            if (!res.ok) {
                let errorData: any = {}
                try {
                    errorData = await res.json()
                } catch (e) {
                    const text = await res.text()
                    console.error('Server returned non-JSON error:', text)
                    errorData = { error: `Server error (${res.status}): ${text.substring(0, 100)}` }
                }
                console.error('Server error:', errorData)
                throw new Error(errorData.error || errorData.details || 'Failed to save chatbot')
            }

            const data = await res.json()
            const savedChatbot = data.chatbot

            const toastMessage = isCurrentlyDraft 
                ? `Draft updated (v${versionToSave})`
                : `Draft saved (v${versionToSave})`
            toast.success(toastMessage)

            // Update local state with version
            setEditorFormData(prev => ({ ...prev, ...dataOverride, currentVersion: versionToSave, isPublished: false }))

            if (selectedChatbot) {
                setChatbots(prev => prev.map(c => c.id === savedChatbot.id ? savedChatbot : c))
                setSelectedChatbot(savedChatbot) // Update selected chatbot with latest data
            } else {
                // For new chatbots, we still want to refresh or at least add to list
                setChatbots(prev => [savedChatbot, ...prev])
                setSelectedChatbot(savedChatbot)
            }

            return savedChatbot
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to save chatbot')
            return null
        }
    }

    // Publish the current draft - first saves, then publishes
    const handlePublishFromEditor = async (): Promise<Chatbot | null> => {
        // First save the current changes as a draft
        const savedBot = await handleSave()
        if (!savedBot) return null

        // Then publish it
        try {
            const res = await fetch(`/api/chatbots/${savedBot.id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            
            if (!res.ok) {
                throw new Error('Failed to publish chatbot')
            }
            
            const data = await res.json()
            const publishedChatbot = data.chatbot

            toast.success(`Chatbot published (v${publishedChatbot.currentVersion || savedBot.currentVersion})`)

            // Update local state
            setEditorFormData(prev => ({ ...prev, isPublished: true }))
            setChatbots(prev => prev.map(c => c.id === publishedChatbot.id ? publishedChatbot : c))
            setSelectedChatbot(publishedChatbot)

            return publishedChatbot
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to publish chatbot')
            return null
        }
    }

    const handlePublish = async (chatbot: Chatbot) => {
        try {
            const newIsPublished = !chatbot.isPublished
            const res = await fetch(`/api/chatbots/${chatbot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: newIsPublished })
            })
            if (!res.ok) throw new Error('Failed to update publish status')
            
            toast.success(newIsPublished ? 'Chatbot published' : 'Chatbot unpublished')
            
            // Update local state instead of full fetch
            setChatbots(prev => prev.map(c => c.id === chatbot.id ? { ...c, isPublished: newIsPublished } : c))
            
            if (selectedChatbot?.id === chatbot.id) {
                setSelectedChatbot(prev => prev ? { ...prev, isPublished: newIsPublished } : null)
                setEditorFormData(prev => ({ ...prev, isPublished: newIsPublished }))
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to update status')
        }
    }

    const handlePreview = (chatbot: Chatbot) => {
        window.open(`/chat/${chatbot.id}`, '_blank')
    }

    const handleViewVersions = (chatbot: Chatbot) => {
        toast('Version history coming soon', { icon: 'ℹ️' })
    }

    const handleDuplicate = async (chatbot: Chatbot) => {
        // Implement duplicate
        toast('Duplicate feature coming soon', { icon: 'ℹ️' })
    }

    const handleExport = (chatbot: Chatbot) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatbot, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${chatbot.name}-config.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }


    const generateEmbedCode = (chatbot: Chatbot) => {
        // Use custom domain if provided, otherwise fallback to current origin
        const baseUrl = chatbot.customEmbedDomain
            ? (chatbot.customEmbedDomain.startsWith('http') ? chatbot.customEmbedDomain : `https://${chatbot.customEmbedDomain}`).replace(/\/$/, '')
            : window.location.origin

        return `<script src="${baseUrl}/chat-widget.js" data-chatbot-id="${chatbot.id}"></script>`
    }

    if (isEditing) {
        return (
            <ChatbotEditingWorkspace
                selectedChatbot={selectedChatbot}
                editorFormData={editorFormData}
                setEditorFormData={setEditorFormData}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                deploymentDrawerOpen={deploymentDrawerOpen}
                setDeploymentDrawerOpen={setDeploymentDrawerOpen}
                setIsEditing={setIsEditing}
                handleSave={handleSave}
                handlePublishFromEditor={handlePublishFromEditor}
                generateEmbedCode={generateEmbedCode}
            />
        )
    }
    return (
        <div className="flex flex-col h-full bg-background p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chat Embed UI</h1>
                    <p className="text-muted-foreground mt-2">
                        Create and manage AI chatbots for your websites and applications.
                    </p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                        <div className="flex flex-col gap-1">
                            <Button variant="ghost" className="justify-start font-normal h-9" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Chat
                            </Button>
                            <Button variant="ghost" className="justify-start font-normal h-9" onClick={openCreateFolderDialog}>
                                <FolderIcon className="mr-2 h-4 w-4" />
                                Create Folder
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {isLoading ? (
                <ChatbotListSkeleton viewMode={viewMode} count={6} />
            ) : (
                <>
                    <ChatbotList
                        chatbots={chatbots}
                        folders={folders}
                        viewMode={viewMode}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPublish={handlePublish}
                        onPreview={handlePreview}
                        onViewVersions={handleViewVersions}
                        onDuplicate={handleDuplicate}
                        onExport={handleExport}
                        onCreateFolder={openCreateFolderDialog}
                        onRenameFolder={openRenameFolderDialog}
                        onDeleteFolder={handleDeleteFolder}
                        onMoveChatbot={handleMoveChatbot}
                    />

                    <ChatbotFolderDialog
                        open={folderDialogOpen}
                        onOpenChange={setFolderDialogOpen}
                        mode={folderDialogMode}
                        folderName={folderName}
                        setFolderName={setFolderName}
                        handleSaveFolder={handleSaveFolder}
                    />
                </>
            )}
        </div>
    )
}
