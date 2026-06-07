import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import toast from 'react-hot-toast'

interface WorkflowRealtimeMessageHandlerOptions {
  ws: WebSocket
  onTranscript: (transcript: string) => void
  onAudioChunk?: (audioData: ArrayBuffer) => void
  onResponse?: (response: string) => void
  playAudioChunk: (audioData: ArrayBuffer) => Promise<void>
  audioSourceQueueRef: MutableRefObject<AudioBufferSourceNode[]>
  isPlayingAudioRef: MutableRefObject<boolean>
  setIsConnected: Dispatch<SetStateAction<boolean>>
  setIsRecording: Dispatch<SetStateAction<boolean>>
  setIsSpeaking: Dispatch<SetStateAction<boolean>>
  onReady: () => void
}

export function createWorkflowRealtimeMessageHandler({
  ws,
  onTranscript,
  onAudioChunk,
  onResponse,
  playAudioChunk,
  audioSourceQueueRef,
  isPlayingAudioRef,
  setIsConnected,
  setIsRecording,
  setIsSpeaking,
  onReady
}: WorkflowRealtimeMessageHandlerOptions) {
  return async (event: MessageEvent) => {
    try {
      const messageData = typeof event.data === 'string'
        ? event.data
        : new TextDecoder().decode(event.data as ArrayBuffer)

      const data = JSON.parse(messageData)

      if (data.type === 'auth.success') {
        console.log('Authenticated with OpenAI Realtime API - connection ready')
        setIsConnected(true)

        const pendingPromptId = (ws as any)._pendingPromptId
        const pendingPromptVersion = (ws as any)._pendingPromptVersion

        if (pendingPromptId) {
          console.log('Sending prompt ID via session.update:', {
            id: pendingPromptId,
            version: pendingPromptVersion,
          })

          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              prompt: {
                id: pendingPromptId,
                version: pendingPromptVersion || '1',
              },
            },
          }))

          console.log('Prompt ID sent to Realtime API:', {
            id: pendingPromptId,
            version: pendingPromptVersion || '1',
          })
        }

        await new Promise(resolve => setTimeout(resolve, 200))
        onReady()
        return
      }

      if (data.type === 'session.updated') {
        console.log('Session configuration updated - prompt ID applied')
        delete (ws as any)._pendingPromptId
        delete (ws as any)._pendingPromptVersion
      }

      if (data.type === 'connection.closed') {
        console.log('Connection to OpenAI Realtime API closed')
        setIsConnected(false)
        setIsRecording(false)
        setIsSpeaking(false)
        return
      }

      switch (data.type) {
        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            console.log('User said:', data.transcript)
            onTranscript(data.transcript)
          }
          break

        case 'conversation.item.input_audio_transcription.delta':
        case 'response.audio_transcript.delta':
          if (data.delta) {
            onTranscript(data.delta)
          }
          break

        case 'response.audio_transcript.done':
          if (data.transcript) {
            onTranscript(data.transcript)
          }
          break

        case 'response.text.delta':
          if (data.delta && onResponse) {
            onResponse(data.delta)
          }
          break

        case 'response.text.done':
          if (data.text && onResponse) {
            onResponse(data.text)
          }
          break

        case 'response.audio.delta':
          if (data.delta) {
            try {
              const audioData = Uint8Array.from(atob(data.delta), c => c.charCodeAt(0))
              void playAudioChunk(audioData.buffer)
              onAudioChunk?.(audioData.buffer)
            } catch (error) {
              console.error('Error decoding audio:', error)
            }
          }
          break

        case 'response.audio.done':
          console.log('Audio response done, waiting for playback to complete')
          break

        case 'response.done':
          console.log('Response completed')
          setTimeout(() => {
            if (audioSourceQueueRef.current.length === 0) {
              setIsSpeaking(false)
              isPlayingAudioRef.current = false
            }
          }, 500)
          break

        case 'conversation.item.created':
          console.log('Conversation item created')
          break

        case 'conversation.item.input_audio_buffer.speech_started':
          console.log('Speech started')
          break

        case 'conversation.item.input_audio_buffer.speech_stopped':
          console.log('Speech stopped')
          break

        case 'error':
          console.error('OpenAI Realtime API error:', data.error)
          toast.error(data.error?.message || 'Voice API error')
          setIsRecording(false)
          setIsSpeaking(false)
          break

        default:
          if (data.type && !data.type.startsWith('ping') && !data.type.startsWith('pong')) {
            console.debug('Unhandled message type:', data.type, data)
          }
          break
      }
    } catch (error: any) {
      console.error('Error processing WebSocket message:', error)
    }
  }
}
