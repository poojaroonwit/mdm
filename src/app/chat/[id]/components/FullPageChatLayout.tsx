import React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../types'
import { ThreadSelector } from './ThreadSelector'
import { ChatSidebar } from './ChatSidebar'
import { ChatHeader } from './ChatHeader'
import { PWAInstallBanner } from './PWAInstallBanner'

interface FullPageChatLayoutProps {
    emulatorConfig: any
    chatbot: ChatbotConfig
    threadManagementEnabled: boolean
    currentThreadId: string | null
    threads: any[]
    threadsLoading: boolean
    setCurrentThreadId: (id: string | null) => void
    setMessages: (messages: any[]) => void
    deleteThread: (id: string) => void
    updateThreadTitle: (id: string, title: string) => Promise<boolean>
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    chatHistory: any[]
    currentChatId: string | null
    handleSelectChat: (chatId: string) => void
    handleNewChat: () => void
    handleDeleteChat: (chatId: string, e: React.MouseEvent) => void
    previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
    setPreviewDeploymentType: (type: 'popover' | 'fullpage' | 'popup-center') => void
    setIsOpen: (isOpen: boolean) => void
    isMobile: boolean
    isEmbed: boolean
    isPreview?: boolean
    useChatKitInRegularStyle: boolean
    shouldRenderChatKit: boolean
    handleClose: () => void
    children: React.ReactNode // renderChatContent result
}

export function FullPageChatLayout({
    emulatorConfig,
    chatbot,
    threadManagementEnabled,
    currentThreadId,
    threads,
    threadsLoading,
    setCurrentThreadId,
    setMessages,
    deleteThread,
    updateThreadTitle,
    sidebarOpen,
    setSidebarOpen,
    chatHistory,
    currentChatId,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
    previewDeploymentType,
    setPreviewDeploymentType,
    setIsOpen,
    isMobile,
    isEmbed,
    isPreview,
    useChatKitInRegularStyle,
    shouldRenderChatKit,
    handleClose,
    children
}: FullPageChatLayoutProps) {

    return (
        <div
            className="flex h-screen w-screen overflow-hidden"
            style={{
                backgroundColor: isEmbed ? 'transparent' : emulatorConfig.backgroundColor,
                backgroundImage: isEmbed ? undefined : (emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined),
                backgroundSize: isEmbed ? undefined : (emulatorConfig.backgroundImage ? 'cover' : undefined),
                backgroundPosition: isEmbed ? undefined : (emulatorConfig.backgroundImage ? 'center' : undefined),
                backgroundRepeat: isEmbed ? undefined : (emulatorConfig.backgroundImage ? 'no-repeat' : undefined),
                pointerEvents: isEmbed ? 'none' : 'auto', // Allow clicks to pass through transparent background in embed mode
            }}
        >
            {/* Thread Selector for OpenAI Agent SDK */}
            {threadManagementEnabled && (
                <div style={{ pointerEvents: 'auto', height: '100%' }}>
                    <ThreadSelector
                        threads={threads}
                        currentThreadId={currentThreadId}
                        onSelectThread={(threadId: string) => {
                            setCurrentThreadId(threadId)
                            // Messages will be loaded by useChatMessages hook when threadId changes
                        }}
                        onNewThread={() => {
                            setCurrentThreadId(null)
                            setMessages([]) // Clear messages for new thread
                        }}
                        onDeleteThread={deleteThread}
                        onUpdateThreadTitle={updateThreadTitle}
                        isLoading={threadsLoading}
                        chatbot={chatbot}
                    />
                </div>
            )}

            {/* Sidebar for regular chat history */}
            {!isEmbed && !threadManagementEnabled && chatbot && (
                <ChatSidebar
                    sidebarOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    chatHistory={chatHistory}
                    currentChatId={currentChatId}
                    onSelectChat={handleSelectChat}
                    onNewChat={handleNewChat}
                    onDeleteChat={handleDeleteChat}
                    chatbot={chatbot}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Top Bar with Menu and Preview Type - Hide in Embed Mode */}
                {!isEmbed && (
                    <div className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 z-10 transition-all duration-200 ease-out">
                        <div className="flex items-center gap-2">
                            {!threadManagementEnabled && !sidebarOpen && (
                                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="h-8 w-8 p-0">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            )}
                            <h1 className="font-semibold">{chatbot?.name || 'Chat'}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
                            <Select
                                value={previewDeploymentType}
                                onValueChange={(value: string) => {
                                    const deploymentType = value as 'popover' | 'fullpage' | 'popup-center'
                                    setPreviewDeploymentType(deploymentType)
                                    if (deploymentType === 'popover' || deploymentType === 'popup-center') {
                                        setIsOpen(false)
                                    } else {
                                        setIsOpen(true)
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8 w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="popover">Popover</SelectItem>
                                    <SelectItem value="popup-center">Popup Center</SelectItem>
                                    <SelectItem value="fullpage">Full Page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Chat Container */}
                {(() => {
                    const isWindowedMode = !isMobile && !isEmbed && (chatbot as any).useChatKitInRegularStyle === true
                    const showHeader = (chatbot as any).headerEnabled !== false && (!shouldRenderChatKit || useChatKitInRegularStyle)

                    return (
                        <div className={`flex-1 flex flex-col ${isWindowedMode ? 'p-4 md:p-8 lg:p-12 items-center justify-center' : 'p-0'}`}>
                            <div
                                className={`flex-1 flex flex-col overflow-hidden relative bg-background transition-all duration-300 ease-in-out ${isWindowedMode ? 'shadow-2xl' : ''}`}
                                style={{
                                    width: isWindowedMode ? (chatbot?.chatWindowWidth || '800px') : '100%',
                                    maxWidth: '100%',
                                    maxHeight: isWindowedMode ? (chatbot?.chatWindowHeight || '85vh') : '100%',
                                    borderRadius: isWindowedMode ? (chatbot?.chatWindowBorderRadius || chatbot?.borderRadius || '12px') : '0px',
                                    border: isWindowedMode ? `${chatbot?.chatWindowBorderWidth || chatbot?.borderWidth || '1px'} solid ${chatbot?.chatWindowBorderColor || chatbot?.borderColor || 'rgba(0,0,0,0.1)'}` : 'none',
                                    pointerEvents: 'auto', // Ensure chat window allows interaction
                                    fontFamily: chatbot.chatkitOptions?.theme?.typography?.fontFamily || chatbot?.fontFamily,
                                }}
                            >
                                {/* Custom Header for Fullpage Desktop/Mobile (Regular Style) */}
                                {showHeader && (
                                    <ChatHeader
                                        chatbot={chatbot}
                                        onClearSession={() => setMessages([])}
                                        onClose={handleClose}
                                        isMobile={isMobile}
                                    />
                                )}
                                {/* PWA Install Banner - Only shows on mobile */}
                                <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} isPreview={isPreview} />
                                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                    {children}
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}
