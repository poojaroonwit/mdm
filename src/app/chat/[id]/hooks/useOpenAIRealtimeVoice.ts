import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { connectOpenAIRealtimeWebSocket } from './openai-realtime-connection'

interface UseOpenAIRealtimeVoiceProps {
  chatbot: ChatbotConfig | null
  onTranscript: (transcript: string, isUserInput?: boolean) => void
  onAudioChunk?: (audioData: ArrayBuffer) => void
}


export function useOpenAIRealtimeVoice({
  chatbot,
  onTranscript,
  onAudioChunk,
}: UseOpenAIRealtimeVoiceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0) // Audio level 0-100 for visualization

  // Track recording start time to ensure we have enough audio before committing
  const recordingStartTimeRef = useRef<number | null>(null)
  const audioChunksSentRef = useRef(0) // Track how many audio chunks we've sent
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioSourceQueueRef = useRef<AudioBufferSourceNode[]>([])
  const isPlayingAudioRef = useRef(false)
  const isResponseInProgressRef = useRef(false) // Track if a response is currently being generated
  const pendingResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track pending response requests
  const isRecordingRef = useRef(false) // Use ref to avoid stale closure in onaudioprocess
  const isConnectedRef = useRef(false) // Use ref to avoid stale closure in onaudioprocess
  const currentTranscriptRef = useRef('') // Track current transcript for accumulation
  const audioChunksReceivedRef = useRef(0) // Track how many audio chunks we've received from AI
  const processedAudioChunksRef = useRef<Set<string>>(new Set()) // Track processed audio chunks to prevent duplicates

  // Track previous prompt ID to detect changes
  const previousPromptIdRef = useRef<string | null | undefined>(null)

  useEffect(() => {
    // When voice is enabled, connect and keep connection open for continuous conversation
    if (chatbot?.enableVoiceAgent && chatbot?.voiceProvider === 'openai-realtime') {
      setIsVoiceEnabled(true)

      // Check if prompt ID has changed or become available
      const currentPromptId = (chatbot as any)?.openaiAgentSdkRealtimePromptId
      const hasValidPromptId = currentPromptId && typeof currentPromptId === 'string' && currentPromptId.trim().length > 0
      const previousPromptId = previousPromptIdRef.current
      const promptIdChanged = currentPromptId !== previousPromptId

      // If prompt ID changed from empty to valid, or changed to a different ID, reconnect
      if (promptIdChanged && hasValidPromptId && wsRef.current && isConnected) {
        console.log('🔄 Prompt ID changed or became available, reconnecting to use new prompt:', {
          previous: previousPromptId,
          current: currentPromptId,
        })
        disconnect()
        // Small delay before reconnecting to ensure cleanup
        setTimeout(() => {
          connectWebSocket().catch((error) => {
            console.error('Failed to reconnect WebSocket after prompt ID change:', error)
          })
        }, 500)
      } else if (!isConnected && !wsRef.current) {
        // Auto-connect when voice is enabled to keep session open
        connectWebSocket().catch((error) => {
          console.error('Failed to auto-connect WebSocket:', error)
        })
      }

      // Update previous prompt ID
      previousPromptIdRef.current = currentPromptId
    } else {
      setIsVoiceEnabled(false)
      // Only disconnect if voice is explicitly disabled
      if (chatbot?.enableVoiceAgent === false) {
        disconnect()
      }
      previousPromptIdRef.current = null
    }

    return () => {
      // Only disconnect on unmount, not when voice is temporarily disabled
      // This keeps the session open for continuous conversation
      if (!chatbot?.enableVoiceAgent) {
        disconnect()
      }
    }
  }, [chatbot?.enableVoiceAgent, chatbot?.voiceProvider, (chatbot as any)?.openaiAgentSdkRealtimePromptId, isConnected])

  // Define playAudioChunk function early so it can be used in message handlers
  const playAudioChunk = async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        })
      }

      // Resume audio context if suspended (required for autoplay policies)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Decode PCM16 audio data
      const int16Array = new Int16Array(audioData)
      const float32Array = new Float32Array(int16Array.length)
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000)
      audioBuffer.copyToChannel(float32Array, 0)

      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination) // This connects to speakers/headphones

      // Queue the source to ensure smooth playback
      audioSourceQueueRef.current.push(source)

      // Set up the source to play
      source.onended = () => {
        // Remove from queue
        const index = audioSourceQueueRef.current.indexOf(source)
        if (index > -1) {
          audioSourceQueueRef.current.splice(index, 1)
        }

        // If queue is empty, we're done speaking
        if (audioSourceQueueRef.current.length === 0) {
          isPlayingAudioRef.current = false
          setIsSpeaking(false)
        }
      }

      // Start playing immediately
      const currentTime = audioContextRef.current.currentTime
      source.start(currentTime)

      isPlayingAudioRef.current = true
      setIsSpeaking(true)

      console.log('Playing audio chunk through speakers', {
        duration: audioBuffer.duration,
        sampleRate: audioContextRef.current.sampleRate,
        queueLength: audioSourceQueueRef.current.length,
      })
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsSpeaking(false)
      isPlayingAudioRef.current = false
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    // Stop all playing audio sources
    audioSourceQueueRef.current.forEach(source => {
      try {
        source.stop()
      } catch (e) {
        // Source may already be stopped
      }
    })
    audioSourceQueueRef.current = []

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    isRecordingRef.current = false
    isConnectedRef.current = false
    setIsRecording(false)
    setIsSpeaking(false)
    isPlayingAudioRef.current = false
    setIsConnected(false)
  }

  const connectWebSocket = () => connectOpenAIRealtimeWebSocket({
    chatbot,
    wsRef,
    audioSourceQueueRef,
    isPlayingAudioRef,
    isResponseInProgressRef,
    isRecordingRef,
    isConnectedRef,
    currentTranscriptRef,
    audioChunksReceivedRef,
    processedAudioChunksRef,
    setIsRecording,
    setIsSpeaking,
    setIsConnected,
    onTranscript,
    onAudioChunk,
    playAudioChunk,
  })

  const startRecording = async () => {
    // Prevent duplicate calls
    if (isRecording) {
      console.log('Recording already in progress')
      return
    }

    // Ensure we're connected before starting
    // For realtime voice, connection should stay open for continuous conversation
    if (!isConnected || !isConnectedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('Connecting to voice service...', {
        isConnected,
        isConnectedRef: isConnectedRef.current,
        wsExists: !!wsRef.current,
        wsState: wsRef.current?.readyState,
      })
      toast.loading('Connecting to voice service...', { id: 'voice-connecting' })
      const connected = await connectWebSocket()
      toast.dismiss('voice-connecting')
      if (!connected) {
        toast.error('Failed to connect to voice service. Please check if the WebSocket proxy server is running.')
        return
      }
      // Wait a bit more to ensure everything is ready (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Double-check connection state before starting recording
    // Wait up to 3 seconds for connection to be fully ready
    let retries = 0
    const maxRetries = 6 // 6 * 500ms = 3 seconds
    while ((!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnected || !isConnectedRef.current) && retries < maxRetries) {
      console.log(`Waiting for connection to be ready... (attempt ${retries + 1}/${maxRetries})`, {
        wsExists: !!wsRef.current,
        wsReady: wsRef.current?.readyState === WebSocket.OPEN,
        wsState: wsRef.current?.readyState,
        isConnected,
        isConnectedRef: isConnectedRef.current,
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      retries++
    }

    // Final check
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnected || !isConnectedRef.current) {
      const errorMsg = 'Not connected to voice service. Please wait for connection to establish.'
      toast.error(errorMsg)
      console.error('Connection check failed after retries:', {
        wsExists: !!wsRef.current,
        wsReady: wsRef.current?.readyState === WebSocket.OPEN,
        wsState: wsRef.current?.readyState,
        isConnected,
        isConnectedRef: isConnectedRef.current,
      })
      return
    }

    try {
      // Get user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      mediaStreamRef.current = stream

      // Log audio track info for debugging
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        const track = audioTracks[0]
        const settings = track.getSettings()
        console.log('🎤 Microphone settings:', {
          label: track.label,
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
        })
      }

      // Create audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        // Use refs to avoid stale closure issues
        // Only send audio if connected and recording
        if (wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN &&
          isRecordingRef.current &&
          isConnectedRef.current) {
          const inputData = e.inputBuffer.getChannelData(0)

          // Calculate audio level (RMS - Root Mean Square) for visualization
          let sum = 0
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i]
          }
          const rms = Math.sqrt(sum / inputData.length)
          // Convert RMS to decibels, then normalize to 0-100
          const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity
          // Normalize: -60dB (silence) to 0dB (max) maps to 0-100
          const normalizedLevel = Math.max(0, Math.min(100, ((db + 60) / 60) * 100))
          setAudioLevel(normalizedLevel)

          // Convert Float32Array to Int16Array (PCM16)
          const int16Data = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
          }

          // Convert Int16Array to base64 string
          // OpenAI Realtime API expects base64-encoded PCM16 audio
          const uint8Array = new Uint8Array(int16Data.buffer)
          let binaryString = ''
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
          }
          const base64Audio = btoa(binaryString)

          // Send audio to OpenAI Realtime API via proxy
          // Format: { type: 'input_audio_buffer.append', audio: base64_string }
          try {
            const audioMessage = {
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }

            // Verify WebSocket is ready
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
              console.error('❌ WebSocket not open, cannot send audio. State:', wsRef.current?.readyState)
              return
            }

            // Verify we're connected (use ref for real-time check)
            if (!isConnectedRef.current) {
              console.error('❌ Not connected to OpenAI, cannot send audio')
              return
            }

            wsRef.current.send(JSON.stringify(audioMessage))
            audioChunksSentRef.current++

            // Log every 50 chunks (roughly every second at 24kHz) to verify audio is being sent
            if (audioChunksSentRef.current % 50 === 0) {
              console.log(`✅ Audio chunks sent: ${audioChunksSentRef.current}, Audio level: ${normalizedLevel.toFixed(1)}% (${db.toFixed(1)}dB), Base64 length: ${base64Audio.length}`)
            }

            // Log first chunk to verify format
            if (audioChunksSentRef.current === 1) {
              console.log('🎤 First audio chunk sent:', {
                audioLength: base64Audio.length,
                sampleCount: inputData.length,
                audioLevel: normalizedLevel.toFixed(1),
                db: db.toFixed(1),
                wsState: wsRef.current.readyState,
                isConnected: isConnectedRef.current,
              })
            }
          } catch (error) {
            console.error('❌ Error sending audio chunk:', error)
            // If sending fails, stop recording
            if (error instanceof Error && error.message.includes('not connected')) {
              isRecordingRef.current = false
              isConnectedRef.current = false
              setIsRecording(false)
              setIsConnected(false)
            }
          }
        } else {
          // Not recording or not connected - still calculate audio level for visualization
          // but don't send audio
          const inputData = e.inputBuffer.getChannelData(0)
          let sum = 0
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i]
          }
          const rms = Math.sqrt(sum / inputData.length)
          const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity
          const normalizedLevel = Math.max(0, Math.min(100, ((db + 60) / 60) * 100))
          setAudioLevel(normalizedLevel)
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      // With server_vad turn detection, we just need to start sending audio
      // The API will automatically:
      // 1. Detect when speech starts (creates conversation item automatically)
      // 2. Process audio chunks
      // 3. Detect when speech stops (commits buffer automatically)
      // 4. Generate transcription and response automatically
      // No need to manually create conversation items - server_vad handles it
      recordingStartTimeRef.current = Date.now()
      audioChunksSentRef.current = 0 // Reset counter
      isRecordingRef.current = true // Set ref first for onaudioprocess callback
      setIsRecording(true)
      toast.success('Recording started')
      console.log('🎤 Recording started - session open for continuous conversation')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    console.log('🛑 Stopping recording - letting server_vad handle buffer commit automatically')

    // Stop sending new audio chunks by setting isRecording to false first
    // This prevents new audio from being sent while we clean up
    isRecordingRef.current = false // Set ref first for onaudioprocess callback
    setIsRecording(false)

    // Stop microphone input
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    // With server_vad, we should NOT manually commit the buffer
    // server_vad will automatically:
    // 1. Detect when speech stops (based on silence_duration_ms = 500ms)
    // 2. Commit the audio buffer automatically
    // 3. Transcribe the input
    // 4. Generate a response automatically
    //
    // If we manually commit, we might commit before enough audio is in the buffer
    // Let server_vad handle everything automatically for smooth real-time conversation

    const recordingDuration = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : 0

    console.log(`📊 Recording stopped after ${recordingDuration}ms - server_vad will detect silence and commit automatically`)

    // Cancel any pending response requests
    if (pendingResponseTimeoutRef.current) {
      clearTimeout(pendingResponseTimeoutRef.current)
      pendingResponseTimeoutRef.current = null
    }

    // Don't cancel in-progress responses - let them complete naturally
    // Only cancel if user explicitly disconnects

    recordingStartTimeRef.current = null
    audioChunksSentRef.current = 0
    setAudioLevel(0) // Reset audio level when stopping
    // Note: Connection stays open for next interaction
    // server_vad will handle the rest automatically
  }

  return {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    audioLevel, // Expose audio level for visualization
    isConnected,
    startRecording,
    stopRecording,
    playAudioChunk,
  }
}

