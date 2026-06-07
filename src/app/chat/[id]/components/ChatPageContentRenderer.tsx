import type { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from 'react'
import { ChatKitRenderer } from './ChatKitRenderer'
import { ChatContent } from './ChatContent'
import type { Attachment } from '../hooks/useChatFileHandling'
import type { ChatbotConfig, Message } from '../types'

interface ChatPageContentRendererProps {
  chatbot: ChatbotConfig
  shouldRenderChatKit: boolean
  useChatKitInRegularStyle: boolean
  effectiveDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  isInIframe: boolean
  isMobile: boolean
  isEmbed: boolean
  isPreview: boolean
  isDesktopPreview: boolean
  onChatKitUnavailable: () => void
  messages: Message[]
  input: string
  setInput: (input: string) => void
  attachments: Attachment[]
  setAttachments: Dispatch<SetStateAction<Attachment[]>>
  isLoading: boolean
  selectedFollowUp: string | null
  messageFeedback: Record<string, 'liked' | 'disliked' | null>
  setMessageFeedback: Dispatch<SetStateAction<Record<string, 'liked' | 'disliked' | null>>>
  setMessages: Dispatch<SetStateAction<Message[]>>
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>
  resetChat: () => void
  isSessionExpired: boolean
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
  onFollowUpClick: (followUp: string) => void
  removeAttachment: (index: number) => void
  handleSubmit: (e: FormEvent) => void
  isRecording: boolean
  isVoiceEnabled: boolean
  isSpeaking: boolean
  audioLevel: number
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleVoiceOutput: () => void
  scrollAreaRef: RefObject<HTMLDivElement | null>
  messagesEndRef: RefObject<HTMLDivElement | null>
  currentTranscript: string
  chatbotId: string
  threadId: string | null
}

export function ChatPageContentRenderer({
  chatbot,
  shouldRenderChatKit,
  useChatKitInRegularStyle,
  effectiveDeploymentType,
  isInIframe,
  isMobile,
  isEmbed,
  isPreview,
  isDesktopPreview,
  onChatKitUnavailable,
  messages,
  input,
  setInput,
  attachments,
  setAttachments,
  isLoading,
  selectedFollowUp,
  messageFeedback,
  setMessageFeedback,
  setMessages,
  sendMessage,
  resetChat,
  isSessionExpired,
  onFileSelect,
  onFollowUpClick,
  removeAttachment,
  handleSubmit,
  isRecording,
  isVoiceEnabled,
  isSpeaking,
  audioLevel,
  onStartRecording,
  onStopRecording,
  onToggleVoiceOutput,
  scrollAreaRef,
  messagesEndRef,
  currentTranscript,
  chatbotId,
  threadId,
}: ChatPageContentRendererProps) {
  if (shouldRenderChatKit && !useChatKitInRegularStyle) {
    const stableIsMobile = isEmbed ? false : isMobile
    return (
      <ChatKitRenderer
        chatbot={chatbot}
        previewDeploymentType={effectiveDeploymentType}
        isInIframe={isInIframe}
        isMobile={stableIsMobile}
        isPreview={isPreview}
        isDesktopPreview={isDesktopPreview}
        onChatKitUnavailable={onChatKitUnavailable}
      />
    )
  }

  if (shouldRenderChatKit && useChatKitInRegularStyle) {
    return (
      <div
        className="flex-1 min-h-0 relative overflow-hidden chatkit-in-regular-style"
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChatKitRenderer
          chatbot={chatbot}
          previewDeploymentType={effectiveDeploymentType}
          isInIframe={isInIframe}
          isMobile={isMobile}
          useChatKitInRegularStyle={true}
          onChatKitUnavailable={onChatKitUnavailable}
        />
      </div>
    )
  }

  return (
    <ChatContent
      chatbot={chatbot}
      messages={messages}
      input={input}
      setInput={setInput}
      attachments={attachments}
      setAttachments={setAttachments}
      isLoading={isLoading}
      selectedFollowUp={selectedFollowUp}
      messageFeedback={messageFeedback}
      setMessageFeedback={setMessageFeedback}
      setMessages={setMessages}
      sendMessage={sendMessage}
      resetChat={resetChat}
      isSessionExpired={isSessionExpired}
      onFileSelect={onFileSelect}
      onFollowUpClick={onFollowUpClick}
      removeAttachment={removeAttachment}
      handleSubmit={handleSubmit}
      isRecording={isRecording}
      isVoiceEnabled={isVoiceEnabled}
      isSpeaking={isSpeaking}
      audioLevel={audioLevel}
      onStartRecording={onStartRecording}
      onStopRecording={onStopRecording}
      onToggleVoiceOutput={onToggleVoiceOutput}
      scrollAreaRef={scrollAreaRef}
      messagesEndRef={messagesEndRef}
      currentTranscript={currentTranscript}
      chatbotId={chatbotId}
      threadId={threadId}
      hideHeader={true}
    />
  )
}
