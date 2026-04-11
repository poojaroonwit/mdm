'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'
import { ChatbotConfig } from '../types'
import { TypingText } from './TypingText'
import styles from './VoiceWaveUI.module.css'

interface VoiceWaveUIProps {
  chatbot: ChatbotConfig
  isRecording: boolean
  isVoiceEnabled: boolean
  isSpeaking: boolean
  audioLevel?: number // Real-time audio level (0-100) for visualization
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleVoiceOutput?: () => void
  transcript?: string
  messages?: Array<{ role: string; content: string }>
  showMessages?: boolean
}

export function VoiceWaveUI({
  chatbot,
  isRecording,
  isVoiceEnabled,
  isSpeaking,
  audioLevel = 0,
  onStartRecording,
  onStopRecording,
  onToggleVoiceOutput,
  transcript,
  messages = [],
  showMessages = false,
}: VoiceWaveUIProps) {
  const [isVoiceOn, setIsVoiceOn] = useState(false)

  useEffect(() => {
    setIsVoiceOn(isRecording || isSpeaking)
  }, [isRecording, isSpeaking])

  const toggleVoice = () => {
    if (isRecording) {
      onStopRecording()
    } else if (isVoiceOn) {
      setIsVoiceOn(false)
      onToggleVoiceOutput?.()
    } else {
      setIsVoiceOn(true)
      onStartRecording()
    }
  }

  const getSubtitle = () => {
    if (isRecording) {
      return transcript || 'Listening...'
    }
    if (isSpeaking) {
      return 'Speaking...'
    }
    if (isVoiceOn) {
      return 'Voice is on'
    }
    return 'Tap to start voice'
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" style={{
      backgroundColor: chatbot.messageBoxColor || '#ffffff',
    }}>
      {/* Wave Animation Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          style={{
            opacity: isVoiceOn ? 0.6 : 0.3,
            transition: 'opacity 0.3s ease',
          }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chatbot.primaryColor || '#1e40af'} stopOpacity="0.8" />
              <stop offset="100%" stopColor={chatbot.primaryColor || '#1e40af'} stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M 0,${100 + i * 20} Q 150,${80 + i * 20} 300,${100 + i * 20} T 600,${100 + i * 20} T 900,${100 + i * 20} T 1200,${100 + i * 20}`}
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="3"
              className={styles.wavePath}
              style={{
                animationDuration: `${2 + i * 0.5}s`,
                animationDelay: `${i * 0.3}s`,
                opacity: isVoiceOn ? 1 : 0.5,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Real-time Audio Level Wave Bars */}
      {isVoiceOn && (
        <div className="absolute inset-0 flex items-center justify-center gap-1" style={{
          opacity: 0.6,
        }}>
          {Array.from({ length: 20 }).map((_, i) => {
            // Use real audio level with variation for visual effect
            // Each bar responds to audio level with slight offset for wave effect
            const baseLevel = audioLevel || 0
            const variation = Math.sin((Date.now() / 100) + i * 0.5) * 10 // Subtle animation
            const barLevel = Math.max(10, Math.min(100, baseLevel + variation + (i % 3) * 5))
            const height = 10 + (barLevel / 100) * 80 // Scale from 10% to 90% based on audio level

            return (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  backgroundColor: chatbot.primaryColor || '#1e40af',
                  height: `${height}%`,
                  minHeight: '10%',
                  transition: 'height 0.075s ease-out',
                }}
              />
            )
          })}
        </div>
      )}

      {/* Voice Toggle Button */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Button
          type="button"
          onClick={toggleVoice}
          disabled={!isVoiceEnabled}
          size="lg"
          className="rounded-full w-20 h-20 p-0 shadow-lg hover:scale-105 transition-transform"
          style={{
            backgroundColor: isVoiceOn
              ? (chatbot.primaryColor || '#1e40af')
              : '#e5e7eb',
            color: isVoiceOn ? '#ffffff' : '#6b7280',
          }}
        >
          {isVoiceOn ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>

        {/* Subtitle with typing effect */}
        <p
          className="text-sm font-medium text-center px-4 max-w-md min-h-[1.5rem]"
          style={{
            color: chatbot.fontColor || '#374151',
          }}
        >
          {transcript ? (
            <TypingText
              text={transcript}
              speed={50} // Fast typing speed for real-time feel
              className="inline-block"
            />
          ) : (
            getSubtitle()
          )}
        </p>

        {/* Transcript Display - More prominent when recording */}
        {isRecording && transcript && (
          <div
            className="mt-2 px-6 py-3 rounded-lg max-w-lg text-center min-h-[3rem] flex items-center justify-center"
            style={{
              backgroundColor: chatbot.primaryColor || '#1e40af',
              color: '#ffffff',
              opacity: 0.9,
            }}
          >
            <p className="text-base font-medium">
              <TypingText
                text={transcript}
                speed={40} // Slightly slower for main transcript display
                style={{ color: '#ffffff' }}
              />
            </p>
          </div>
        )}
      </div>

      {/* Optional: Show recent messages in a compact view */}
      {showMessages && messages.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 max-h-48 overflow-y-auto space-y-2 z-10">
          {messages.slice(-3).map((msg, idx) => (
            <div
              key={idx}
              className="px-3 py-2 rounded-lg text-sm backdrop-blur-sm"
              style={{
                backgroundColor: msg.role === 'user'
                  ? (chatbot.userMessageBackgroundColor || chatbot.primaryColor || '#1e40af')
                  : (chatbot.botMessageBackgroundColor || '#f3f4f6'),
                color: msg.role === 'user'
                  ? (chatbot.userMessageFontColor || '#ffffff')
                  : (chatbot.fontColor || '#374151'),
                opacity: 0.9,
              }}
            >
              {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

