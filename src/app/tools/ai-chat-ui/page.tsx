'use client'

import { useState, useEffect } from 'react'
import { ChatbotList } from '@/app/admin/components/chatbot/ChatbotList'
import { ChatbotEditor } from '@/app/admin/components/chatbot/ChatbotEditor'
import { Chatbot, ChatbotFolder } from '@/app/admin/components/chatbot/types'
import { ChatbotEmulator } from '@/app/admin/components/chatbot/ChatbotEmulator'
import { DeploymentDrawer } from '@/app/admin/components/chatbot/components/DeploymentDrawer'
import { VersionDrawer } from '@/app/admin/components/chatbot/components/VersionDrawer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogBody,
} from '@/components/ui/dialog'
import { Plus, ArrowLeft, Rocket, History, Folder as FolderIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSpace } from '@/contexts/space-context'

export default function ChatEmbedUIPage() {
    const router = useRouter()
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
    }, [])

    const handleCreate = () => {
        setSelectedChatbot(null)
        setEditorFormData({
            name: 'New Chatbot',
            folder_id: null,
            website: 'https://example.com',
            description: 'A new AI assistant',
            engineType: 'custom',
            apiEndpoint: 'https://api.openai.com/v1/chat/completions',
            apiAuthType: 'none',
            apiAuthValue: '',
            conversationOpener: 'Hello! How can I help you today?',
            openaiAgentSdkModel: 'gpt-4o',
            deploymentType: 'popover',
            customEmbedDomain: '',

            // ===== Default Style Settings =====
            // Primary colors
            primaryColor: '#1e40af',
            fontFamily: 'Inter',

            // Header settings
            headerTitle: 'New Chatbot',
            headerDescription: 'How can I help you today?',
            headerShowTitle: true,
            headerShowLogo: false,
            headerBgColor: '#1e40af',
            headerFontColor: '#ffffff',
            headerBorderEnabled: true,
            headerBorderColor: '#e5e7eb',
            headerShowClearSession: true,

            // Widget settings
            widgetPosition: 'bottom-right',
            widgetOffsetX: '20px',
            widgetOffsetY: '20px',
            widgetSize: '60px',
            widgetAvatarStyle: 'circle',
            widgetBackgroundColor: '#1e40af',
            widgetBorderRadius: '50%',
            widgetBorderWidth: '0px',
            widgetBorderColor: 'transparent',
            widgetShadowBlur: '8px',
            widgetShadowColor: 'rgba(0,0,0,0.2)',
            widgetAutoShow: false,
            widgetAutoShowDelay: 3,

            // Chat container settings
            chatBackgroundColor: '#ffffff',
            chatFontColor: '#1f2937',
            chatBorderRadius: '12px',

            // Message bubble settings
            userBubbleColor: '#1e40af',
            userBubbleFontColor: '#ffffff',
            botBubbleColor: '#f3f4f6',
            botBubbleFontColor: '#1f2937',

            // Composer settings
            composerBackgroundColor: '#ffffff',
            composerFontColor: '#1f2937',
            composerPlaceholder: 'Type a message...',

            // Popover settings
            popoverWidth: '400px',
            popoverHeight: '600px',
            popoverBorderRadius: '16px',

            // Avatar settings
            avatarType: 'icon',
            avatarIcon: 'Bot',
            avatarIconColor: '#ffffff',

            // Conversation settings
            showStartConversation: true,
            enableConversationRenaming: true,

            // Required arrays/booleans
            followUpQuestions: [],
            enableFileUpload: false,
            showCitations: true,
            isPublished: false,

            // ChatKit options with defaults
            chatkitOptions: {
                history: {
                    enabled: true,
                    showDelete: true,
                    showRename: true
                }
            }
        } as any)
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
            <div className="flex flex-col h-full bg-background overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">
                                {selectedChatbot ? `Edit ${selectedChatbot.name}` : 'Create New Chatbot'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Version indicator */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                v{editorFormData.currentVersion || selectedChatbot?.currentVersion || '1.0.0'}
                            </span>
                            {editorFormData.isPublished ? (
                                <span className="text-green-600 text-xs font-medium">Published</span>
                            ) : (
                                <span className="text-amber-600 text-xs font-medium">Draft</span>
                            )}
                            {/* Version History button - icon only */}
                            <VersionDrawer
                                versions={selectedChatbot?.versions || editorFormData.versions || []}
                                currentVersion={editorFormData.currentVersion || selectedChatbot?.currentVersion}
                                onRestore={(version) => {
                                    setEditorFormData(prev => ({
                                        ...prev,
                                        ...version.config,
                                        currentVersion: version.version,
                                        isPublished: false
                                    }))
                                    toast.success(`Loaded configuration from v${version.version}`)
                                }}
                                chatbot={editorFormData}
                                iconOnly={true}
                            />
                        </div>
                        <div className="w-px h-6 bg-border" />
                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center gap-2">
                            <Switch
                                id="chatbot-enabled-header"
                                checked={editorFormData.chatbotEnabled !== false}
                                onCheckedChange={(checked) => setEditorFormData(prev => ({ ...prev, chatbotEnabled: checked }))}
                            />
                            <span className={`text-xs font-medium ${editorFormData.chatbotEnabled !== false ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {editorFormData.chatbotEnabled !== false ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        {/* Deployment button */}
                        <Button variant="outline" onClick={() => setDeploymentDrawerOpen(true)}>
                            <Rocket className="h-4 w-4 mr-2" />
                            Deployment
                        </Button>
                        {/* Save Draft - always saves as draft with incremented version */}
                        <Button variant="outline" onClick={() => handleSave()}>
                            Save Draft
                        </Button>
                        {/* Publish - saves then publishes */}
                        <Button 
                            onClick={() => handlePublishFromEditor()}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Publish
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-[500px] border-r border-border/50">
                        <ChatbotEditor
                            formData={editorFormData}
                            setFormData={setEditorFormData}
                            selectedChatbot={selectedChatbot}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            onGenerateEmbedCode={generateEmbedCode}
                            onSave={handleSave}
                        />
                    </div>

                    <div className="w-[450px] lg:w-[600px] xl:w-[700px] bg-muted/10 h-full overflow-hidden shrink-0">
                        <ChatbotEmulator
                            selectedChatbot={selectedChatbot}
                            formData={editorFormData}
                            onFormDataChange={setEditorFormData}
                            previewMode={previewMode}
                            onPreviewModeChange={setPreviewMode}
                        />
                    </div>
                </div>

                {/* Deployment Drawer */}
                <DeploymentDrawer
                    open={deploymentDrawerOpen}
                    onOpenChange={setDeploymentDrawerOpen}
                    formData={editorFormData}
                    setFormData={setEditorFormData}
                    selectedChatbot={selectedChatbot}
                    onGenerateEmbedCode={generateEmbedCode}
                    onSave={handleSave}
                />
            </div>
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
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
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

                    <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{folderDialogMode === 'create' ? 'Create Folder' : 'Rename Folder'}</DialogTitle>
                                <DialogDescription>
                                    {folderDialogMode === 'create'
                                        ? 'Create a folder to organize chatbot configurations.'
                                        : 'Update the folder name for this chatbot group.'}
                                </DialogDescription>
                            </DialogHeader>
                             <DialogBody>
                                <Input
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    placeholder="Folder name"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            void handleSaveFolder()
                                        }
                                    }}
                                />
                            </DialogBody>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => void handleSaveFolder()}>
                                    {folderDialogMode === 'create' ? 'Create Folder' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}
