'use client'

import React from 'react'
import { ChatbotConfig, Message } from '../types'
import { ChatHeader } from './ChatHeader'
import { MessagesList } from './MessagesList'
import { ChatInput } from './ChatInput'
import { VoiceWaveUI } from './VoiceWaveUI'

interface ChatContentProps {
  chatbot: ChatbotConfig
  messages: Message[]
  input: string
  setInput: (value: string) => void
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }>
  setAttachments: React.Dispatch<React.SetStateAction<Array<{ type: 'image' | 'video', url: string, name?: string }>>>
  isLoading: boolean
  selectedFollowUp: string | null
  messageFeedback: Record<string, 'liked' | 'disliked' | null>
  setMessageFeedback: React.Dispatch<React.SetStateAction<Record<string, 'liked' | 'disliked' | null>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sendMessage: (content: string, attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>) => Promise<void>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFollowUpClick: (question: string) => void
  removeAttachment: (index: number) => void
  handleSubmit: (e: React.FormEvent) => void
  isRecording: boolean
  isVoiceEnabled: boolean
  isSpeaking: boolean
  audioLevel?: number // Real-time audio level (0-100) for visualization
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleVoiceOutput?: () => void
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  currentTranscript?: string
  chatbotId?: string
  threadId?: string | null
  hideHeader?: boolean
  isMobile?: boolean
}

export function ChatContent({
  chatbot,
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
  onFileSelect,
  onFollowUpClick,
  removeAttachment,
  handleSubmit,
  isRecording,
  isVoiceEnabled,
  isSpeaking,
  audioLevel = 0,
  onStartRecording,
  onStopRecording,
  onToggleVoiceOutput,
  scrollAreaRef,
  messagesEndRef,
  currentTranscript,
  chatbotId,
  threadId,
  hideHeader = false,
  isMobile = false,
}: ChatContentProps) {
  // Check if wave UI should be shown
  const showWaveUI = chatbot.enableVoiceAgent && chatbot.voiceUIStyle === 'wave'

  if (showWaveUI) {
    return (
      <div className="relative flex flex-col h-full">
        {!hideHeader && (
          <ChatHeader
            chatbot={chatbot}
            onClearSession={() => setMessages([])}
            isMobile={isMobile}
          />
        )}
        <div className="flex-1 relative flex flex-col" style={{ minHeight: '400px' }}>
          {/* Wave UI takes most of the space */}
          <div className="flex-1 relative">
            <VoiceWaveUI
              chatbot={chatbot}
              isRecording={isRecording}
              isVoiceEnabled={isVoiceEnabled}
              isSpeaking={isSpeaking}
              audioLevel={audioLevel}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onToggleVoiceOutput={onToggleVoiceOutput}
              transcript={currentTranscript}
              messages={messages}
              showMessages={true}
            />
          </div>

          {/* Optional: Show compact input at bottom for text fallback - Floating */}
          <div className="absolute bottom-0 left-0 right-0 z-50 border-t p-2" style={{
            borderColor: chatbot.borderColor,
            ...(() => {
              const bgValue = chatbot.messageBoxColor
              // Check if it's an image URL
              if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
                const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
                return {
                  backgroundImage: imageUrl,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#ffffff', // Fallback color
                }
              }
              return { backgroundColor: bgValue }
            })(),
          }}>
            <div className="text-xs text-center text-muted-foreground mb-1">
              Voice mode active • Switch to text input below
            </div>
            <ChatInput
              chatbot={chatbot}
              input={input}
              setInput={setInput}
              attachments={attachments}
              setAttachments={setAttachments}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onFileSelect={onFileSelect}
              isRecording={isRecording}
              isVoiceEnabled={isVoiceEnabled}
              isSpeaking={isSpeaking}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              removeAttachment={removeAttachment}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full">
      {!hideHeader && (
        <ChatHeader
          chatbot={chatbot}
          onClearSession={() => setMessages([])}
          isMobile={isMobile}
        />
      )}

      <MessagesList
        messages={messages}
        chatbot={chatbot}
        isLoading={isLoading}
        messageFeedback={messageFeedback}
        setMessageFeedback={setMessageFeedback}
        setMessages={setMessages}
        sendMessage={sendMessage}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
        chatbotId={chatbotId}
        threadId={threadId}
      />

      {/* Follow-up Questions */}
      {chatbot.followUpQuestions && chatbot.followUpQuestions.length > 0 && !isLoading && (
        <div className="px-6 pb-4 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {chatbot.followUpQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => onFollowUpClick(question)}
              disabled={isLoading || selectedFollowUp === question}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                borderColor: chatbot.borderColor,
                borderWidth: chatbot.borderWidth,
                ...(() => {
                  const bgValue = chatbot.messageBoxColor
                  // Check if it's an image URL
                  if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
                    const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
                    return {
                      backgroundImage: imageUrl,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: '#ffffff', // Fallback color
                    }
                  }
                  return { backgroundColor: bgValue }
                })(),
                color: chatbot.fontColor,
              }}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {/* Floating Chat Input */}
      <div className="absolute bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out">
        <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-background/95 via-background/90 to-transparent backdrop-blur-sm">
          <ChatInput
            chatbot={chatbot}
            input={input}
            setInput={setInput}
            attachments={attachments}
            setAttachments={setAttachments}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onFileSelect={onFileSelect}
            isRecording={isRecording}
            isVoiceEnabled={isVoiceEnabled}
            isSpeaking={isSpeaking}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
            removeAttachment={removeAttachment}
          />
        </div>
      </div>
    </div>
  )
}

