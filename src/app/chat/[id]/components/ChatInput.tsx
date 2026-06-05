'use client'

import { Suspense, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Paperclip, Mic, MicOff, Send, X } from 'lucide-react'
import { ChatbotConfig } from '../types'
import { loadIcon } from '@/lib/utils/icon-loader'

interface ChatInputProps {
  chatbot: ChatbotConfig
  input: string
  setInput: (value: string) => void
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }>
  setAttachments: React.Dispatch<React.SetStateAction<Array<{ type: 'image' | 'video', url: string, name?: string }>>>
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  isRecording: boolean
  isVoiceEnabled: boolean
  isSpeaking: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  removeAttachment: (index: number) => void
}

export function ChatInput({
  chatbot,
  input,
  setInput,
  attachments,
  setAttachments,
  isLoading,
  onSubmit,
  onFileSelect,
  isRecording,
  isVoiceEnabled,
  isSpeaking,
  onStartRecording,
  onStopRecording,
  removeAttachment,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fileUploadLayout = (chatbot as any).fileUploadLayout || 'attach-first'

  const attachButton = chatbot.enableFileUpload ? (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        aria-label="Attach file"
        title="Attach file"
        className="transition-all duration-200 ease-out hover:scale-110 active:scale-95 hover:shadow-md"
      >
        <Paperclip className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
      </Button>
    </>
  ) : null

  // Hide voice button when wave UI is active (voice controls are in VoiceWaveUI)
  const voiceButton = chatbot.enableVoiceAgent && chatbot.voiceUIStyle !== 'wave' ? (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={isRecording ? onStopRecording : onStartRecording}
      disabled={isLoading || !isVoiceEnabled}
      title={isRecording ? "Stop recording" : "Start voice input"}
      className="transition-all duration-200 ease-out hover:scale-110 active:scale-95 hover:shadow-md"
    >
      {isRecording ? (
        <MicOff className="h-4 w-4 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
      )}
    </Button>
  ) : null

  const inputField = (
    <Input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        // Allow Enter to submit (but Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          if ((input.trim() || attachments.length > 0) && !isLoading) {
            onSubmit(e as any)
          }
        }
      }}
      placeholder={chatbot.openaiAgentSdkPlaceholder || chatbot.chatkitOptions?.composer?.placeholder || "Type your message..."}
      disabled={isLoading}
      className="flex-1 transition-all duration-200 ease-out focus:ring-2 focus:ring-offset-2 focus:shadow-md"
      aria-label="Message input"
      style={{
        fontFamily: chatbot.fontFamily,
        fontSize: chatbot.fontSize,
        color: (chatbot as any).footerInputFontColor || chatbot.fontColor,
        backgroundColor: (chatbot as any).footerInputBgColor || chatbot.messageBoxColor,
        borderTopWidth: (chatbot as any).footerInputBorderWidthTop || (chatbot as any).footerInputBorderWidth || chatbot.borderWidth,
        borderRightWidth: (chatbot as any).footerInputBorderWidthRight || (chatbot as any).footerInputBorderWidth || chatbot.borderWidth,
        borderBottomWidth: (chatbot as any).footerInputBorderWidthBottom || (chatbot as any).footerInputBorderWidth || chatbot.borderWidth,
        borderLeftWidth: (chatbot as any).footerInputBorderWidthLeft || (chatbot as any).footerInputBorderWidth || chatbot.borderWidth,
        borderTopLeftRadius: (chatbot as any).footerInputBorderRadiusTopLeft || (chatbot as any).footerInputBorderRadius || chatbot.borderRadius,
        borderTopRightRadius: (chatbot as any).footerInputBorderRadiusTopRight || (chatbot as any).footerInputBorderRadius || chatbot.borderRadius,
        borderBottomRightRadius: (chatbot as any).footerInputBorderRadiusBottomRight || (chatbot as any).footerInputBorderRadius || chatbot.borderRadius,
        borderBottomLeftRadius: (chatbot as any).footerInputBorderRadiusBottomLeft || (chatbot as any).footerInputBorderRadius || chatbot.borderRadius,
      }}
    />
  )

  const sendButtonIconName = (chatbot as any).sendButtonIcon || 'Send'
  const SendIconComponent = loadIcon(sendButtonIconName)
  const sendButtonRounded = (chatbot as any).sendButtonRounded !== undefined ? (chatbot as any).sendButtonRounded : false // Deprecated
  const sendButtonBorderRadius = (chatbot as any).sendButtonBorderRadius
  const sendButtonBorderRadiusTopLeft = (chatbot as any).sendButtonBorderRadiusTopLeft
  const sendButtonBorderRadiusTopRight = (chatbot as any).sendButtonBorderRadiusTopRight
  const sendButtonBorderRadiusBottomRight = (chatbot as any).sendButtonBorderRadiusBottomRight
  const sendButtonBorderRadiusBottomLeft = (chatbot as any).sendButtonBorderRadiusBottomLeft
  const sendButtonBgColor = (chatbot as any).sendButtonBgColor || chatbot.primaryColor
  const sendButtonIconColor = (chatbot as any).sendButtonIconColor || '#ffffff'
  const sendButtonShadowColor = (chatbot as any).sendButtonShadowColor || '#000000'
  const sendButtonShadowBlur = (chatbot as any).sendButtonShadowBlur || '0px'
  const sendButtonPaddingX = (chatbot as any).sendButtonPaddingX || '8px'
  const sendButtonPaddingY = (chatbot as any).sendButtonPaddingY || '8px'
  const sendButtonWidth = (chatbot as any).sendButtonWidth
  const sendButtonHeight = (chatbot as any).sendButtonHeight
  const sendButtonPosition = (chatbot as any).sendButtonPosition || 'outside'

  // Default button height matches input height (h-10 = 40px)
  // Default button width matches height for square button
  const inputHeight = '40px' // Input component uses h-10 class = 40px
  const defaultButtonHeight = sendButtonHeight || inputHeight
  const defaultButtonWidth = sendButtonWidth || defaultButtonHeight // Square by default

  // Determine border radius - use individual corners if set, otherwise use unified, fallback to rounded boolean
  const getSendButtonBorderRadius = () => {
    if (sendButtonBorderRadiusTopLeft || sendButtonBorderRadiusTopRight ||
      sendButtonBorderRadiusBottomRight || sendButtonBorderRadiusBottomLeft) {
      return {
        borderTopLeftRadius: sendButtonBorderRadiusTopLeft || sendButtonBorderRadius || '8px',
        borderTopRightRadius: sendButtonBorderRadiusTopRight || sendButtonBorderRadius || '8px',
        borderBottomRightRadius: sendButtonBorderRadiusBottomRight || sendButtonBorderRadius || '8px',
        borderBottomLeftRadius: sendButtonBorderRadiusBottomLeft || sendButtonBorderRadius || '8px',
      }
    }
    if (sendButtonBorderRadius) {
      return { borderRadius: sendButtonBorderRadius }
    }
    if (sendButtonRounded) {
      return { borderRadius: '50%' }
    }
    return undefined
  }

  const sendButton = (
    <Button
      type="submit"
      disabled={(!input.trim() && attachments.length === 0) || isLoading}
      aria-label="Send message"
      title="Send message"
      className="transition-all duration-200 ease-out hover:scale-110 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      style={{
        backgroundColor: sendButtonBgColor,
        ...getSendButtonBorderRadius(),
        boxShadow: sendButtonShadowBlur !== '0px' ? `0 0 ${sendButtonShadowBlur} ${sendButtonShadowColor}` : undefined,
        paddingLeft: sendButtonPaddingX,
        paddingRight: sendButtonPaddingX,
        paddingTop: sendButtonPaddingY,
        paddingBottom: sendButtonPaddingY,
        width: defaultButtonWidth, // Default to square (matches height)
        height: defaultButtonHeight, // Default to input height (40px)
        minWidth: defaultButtonWidth,
        minHeight: defaultButtonHeight,
      }}
    >
      <Suspense fallback={<Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: sendButtonIconColor }} />}>
        {SendIconComponent ? (
          <SendIconComponent className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: sendButtonIconColor }} />
        ) : (
          <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: sendButtonIconColor }} />
        )}
      </Suspense>
    </Button>
  )

  return (
    <>
      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-t animate-in slide-in-from-top-2 fade-in duration-200" style={{ borderColor: chatbot.borderColor, borderWidth: chatbot.borderWidth }}>
          <div className="flex flex-wrap gap-2.5">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                <div className="rounded-lg overflow-hidden border transition-all duration-200 ease-out group-hover:shadow-md group-hover:scale-105" style={{ borderColor: chatbot.borderColor }}>
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name || 'Image'}
                      className="w-20 h-20 object-cover"
                    />
                  ) : (
                    <video
                      src={attachment.url}
                      className="w-20 h-20 object-cover"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  aria-label={`Remove ${attachment.name || attachment.type}`}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out transform hover:scale-110 active:scale-95 shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
                {attachment.name && (
                  <p className="text-xs text-muted-foreground mt-1.5 truncate w-20">{attachment.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={onSubmit}
        className="transition-all duration-200 ease-out"
        style={{
          paddingLeft: (chatbot as any).footerPaddingX || chatbot.headerPaddingX || '20px',
          paddingRight: (chatbot as any).footerPaddingX || chatbot.headerPaddingX || '20px',
          paddingTop: (chatbot as any).footerPaddingY || chatbot.headerPaddingY || '16px',
          paddingBottom: (chatbot as any).footerPaddingY || chatbot.headerPaddingY || '16px',
          borderTopColor: (chatbot as any).footerBorderColor || chatbot.borderColor,
          borderRightColor: (chatbot as any).footerBorderColor || chatbot.borderColor,
          borderBottomColor: (chatbot as any).footerBorderColor || chatbot.borderColor,
          borderLeftColor: (chatbot as any).footerBorderColor || chatbot.borderColor,
          borderTopWidth: (chatbot as any).footerBorderWidthTop || (chatbot as any).footerBorderWidth || chatbot.borderWidth,
          borderRightWidth: (chatbot as any).footerBorderWidthRight || ((chatbot as any).footerBorderWidth !== undefined ? (chatbot as any).footerBorderWidth : '0px'),
          borderBottomWidth: (chatbot as any).footerBorderWidthBottom || ((chatbot as any).footerBorderWidth !== undefined ? (chatbot as any).footerBorderWidth : '0px'),
          borderLeftWidth: (chatbot as any).footerBorderWidthLeft || ((chatbot as any).footerBorderWidth !== undefined ? (chatbot as any).footerBorderWidth : '0px'),
          borderStyle: 'solid',
          borderTopLeftRadius: (chatbot as any).footerBorderRadiusTopLeft || (chatbot as any).footerBorderRadius || '0px',
          borderTopRightRadius: (chatbot as any).footerBorderRadiusTopRight || (chatbot as any).footerBorderRadius || '0px',
          borderBottomRightRadius: (chatbot as any).footerBorderRadiusBottomRight || (chatbot as any).footerBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
          borderBottomLeftRadius: (chatbot as any).footerBorderRadiusBottomLeft || (chatbot as any).footerBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
          backgroundColor: (chatbot as any).footerBgColor || chatbot.messageBoxColor
        }}
      >
        {sendButtonPosition === 'inside' ? (
          <div className="relative">
            <div className="flex items-center gap-2.5">
              {fileUploadLayout === 'input-first' ? (
                <>
                  {inputField}
                  {attachButton}
                  {voiceButton}
                </>
              ) : (
                <>
                  {attachButton}
                  {voiceButton}
                  <div className="flex-1 relative">
                    {inputField}
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {sendButton}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {fileUploadLayout === 'input-first' ? (
              <>
                {inputField}
                {attachButton}
                {voiceButton}
                {sendButton}
              </>
            ) : (
              <>
                {attachButton}
                {voiceButton}
                {inputField}
                {sendButton}
              </>
            )}
          </div>
        )}
      </form>
    </>
  )
}

