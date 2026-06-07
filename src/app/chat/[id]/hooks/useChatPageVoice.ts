import { useState } from 'react'
import { useChatVoice } from './useChatVoice'
import { useOpenAIRealtimeVoice } from './useOpenAIRealtimeVoice'
import type { Attachment } from './useChatFileHandling'
import type { ChatbotConfig, Message } from '../types'

interface UseChatPageVoiceParams {
  chatbot: ChatbotConfig | null
  messages: Message[]
  isLoading: boolean
  setInput: (input: string) => void
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>
}

export function useChatPageVoice({
  chatbot,
  messages,
  isLoading,
  setInput,
  sendMessage,
}: UseChatPageVoiceParams) {
  const [currentTranscript, setCurrentTranscript] = useState('')
  const voiceProvider = chatbot?.voiceProvider || 'browser'

  const browserVoice = useChatVoice({
    chatbot: voiceProvider === 'browser' ? chatbot : null,
    messages,
    isLoading,
    onTranscript: (transcript) => {
      setInput(transcript)
    },
    onSendMessage: (content) => {
      sendMessage(content)
    },
  })

  const openaiRealtimeVoice = useOpenAIRealtimeVoice({
    chatbot: voiceProvider === 'openai-realtime' ? chatbot : null,
    onTranscript: (transcript, isUserInput) => {
      if (isUserInput) {
        setInput(transcript)
        setCurrentTranscript(transcript)
      } else {
        setCurrentTranscript(transcript)
      }
      console.log('Transcript updated:', transcript, isUserInput ? '(user)' : '(AI)')
    },
  })

  const voiceState = voiceProvider === 'openai-realtime'
    ? {
      isRecording: openaiRealtimeVoice.isRecording,
      isVoiceEnabled: openaiRealtimeVoice.isVoiceEnabled,
      isSpeaking: openaiRealtimeVoice.isSpeaking,
      audioLevel: openaiRealtimeVoice.audioLevel,
      handleStartRecording: openaiRealtimeVoice.startRecording,
      handleStopRecording: openaiRealtimeVoice.stopRecording,
      toggleVoiceOutput: () => {
        if (openaiRealtimeVoice.isSpeaking) {
          openaiRealtimeVoice.stopRecording()
        }
      },
    }
    : {
      isRecording: browserVoice.isRecording,
      isVoiceEnabled: browserVoice.isVoiceEnabled,
      isSpeaking: browserVoice.isSpeaking,
      audioLevel: 0,
      handleStartRecording: browserVoice.handleStartRecording,
      handleStopRecording: browserVoice.handleStopRecording,
      toggleVoiceOutput: browserVoice.toggleVoiceOutput,
    }

  return {
    ...voiceState,
    currentTranscript,
  }
}
