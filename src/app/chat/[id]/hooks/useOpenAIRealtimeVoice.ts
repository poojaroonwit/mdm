import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'

interface UseOpenAIRealtimeVoiceProps {
  chatbot: ChatbotConfig | null
  onTranscript: (transcript: string, isUserInput?: boolean) => void
  onAudioChunk?: (audioData: ArrayBuffer) => void
}

async function getRealtimeProxyUrl(chatbotId: string): Promise<string> {
  const response = await fetch(`/api/openai-realtime?chatbotId=${encodeURIComponent(chatbotId)}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to load Realtime voice configuration')
  }

  const data = await response.json()
  if (!data.wsUrl) {
    throw new Error('Realtime voice WebSocket URL is not configured')
  }

  return data.wsUrl as string
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

  const connectWebSocket = async (): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Use chatbotId for server-side key lookup (Security Best Practice)
        const chatbotId = chatbot?.id

        if (!chatbotId) {
          console.error('Chatbot ID required for Realtime Voice')
          resolve(false)
          return
        }

        // Connect to WebSocket proxy server (default: localhost:3002, since 3001 may be used by Docker)
        // In production, this should be your WebSocket proxy server URL
        const proxyUrl = await getRealtimeProxyUrl(chatbotId)
        console.log('Connecting to WebSocket proxy:', proxyUrl)
        const ws = new WebSocket(proxyUrl)

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close()
            console.error('❌ WebSocket connection timeout')
            toast.error(
              'Failed to connect to voice service. Please ensure the WebSocket proxy server is running.\n\n' +
              'To start it, run: npx tsx lib/websocket-proxy.ts\n' +
              'Or add to package.json: "ws-proxy": "tsx lib/websocket-proxy.ts"',
              { duration: 8000 }
            )
            isConnectedRef.current = false
            setIsConnected(false)
            resolve(false)
          }
        }, 10000) // 10 second timeout

        // Set auth response timeout (separate from connection timeout)
        // This prevents UI from being stuck if auth.success never arrives
        const authTimeout = setTimeout(() => {
          if (!authSuccessReceived) {
            console.error('❌ Auth response timeout - no auth.success received')
            ws.close()
            toast.error(
              'Voice authentication timeout. The connection may have failed.\n\n' +
              'Please check:\n' +
              '1. WebSocket proxy server is running\n' +
              '2. OpenAI API key is valid (server-side)\n' +
              '3. Prompt ID is correct (if configured)',
              { duration: 8000 }
            )
            isConnectedRef.current = false
            setIsConnected(false)
            resolve(false)
          }
        }, 15000) // 15 second timeout for auth

        // Track if auth.success was received
        let authSuccessReceived = false

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log('Connected to WebSocket proxy for Realtime Voice')

          // Send authentication and session configuration
          // For realtime voice, use prompt ID (not workflow) and keep session open
          const sessionConfig: any = {
            modalities: ['text', 'audio'], // This enables both text and audio responses
            voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
              // Whisper-1 automatically detects language and supports 99+ languages
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            temperature: 0.8,
            max_response_output_tokens: 4096,
          }

          console.log('📋 Session configuration:', JSON.stringify(sessionConfig, null, 2))
          console.log('📋 Chatbot config for voice:', {
            hasChatbot: !!chatbot,
            promptId: (chatbot as any)?.openaiAgentSdkRealtimePromptId,
            promptVersion: (chatbot as any)?.openaiAgentSdkRealtimePromptVersion,
            instructions: chatbot?.openaiAgentSdkInstructions,
          })

          // Store prompt ID for sending after authentication
          // According to OpenAI Realtime API docs, prompt should be sent via session.update event
          const promptId = (chatbot as any)?.openaiAgentSdkRealtimePromptId
          const hasValidPromptId = promptId && typeof promptId === 'string' && promptId.trim().length > 0

          // Use instructions in initial session config if no prompt ID
          // Prompt ID will be sent via session.update after auth.success
          if (!hasValidPromptId) {
            sessionConfig.instructions = chatbot?.openaiAgentSdkInstructions || 'You are a helpful assistant.'
            console.warn('⚠️ No valid prompt ID configured for Realtime Voice. Using instructions instead.')
            console.warn('⚠️ Prompt ID check:', {
              promptId,
              hasPromptId: !!promptId,
              isString: typeof promptId === 'string',
              isNonEmpty: promptId && promptId.trim().length > 0,
            })
            console.warn('⚠️ For best results, configure a Realtime Voice Prompt ID in chatbot settings.')
          }

          ws.send(JSON.stringify({
            type: 'auth',
            chatbotId, // Send ID instead of Key
            sessionConfig,
          }))

            // Store prompt info for sending after auth
            ; (ws as any)._pendingPromptId = hasValidPromptId ? promptId.trim() : null
            ; (ws as any)._pendingPromptVersion = hasValidPromptId ? ((chatbot as any).openaiAgentSdkRealtimePromptVersion || '1') : null
        }

        ws.onmessage = async (event) => {
          try {
            // Handle both string and ArrayBuffer messages
            let messageData: string
            if (typeof event.data === 'string') {
              messageData = event.data
            } else if (event.data instanceof ArrayBuffer) {
              messageData = new TextDecoder().decode(event.data)
            } else if (event.data instanceof Blob) {
              messageData = await event.data.text()
            } else {
              // Buffer or Uint8Array
              messageData = new TextDecoder().decode(event.data as ArrayBuffer)
            }

            const data = JSON.parse(messageData)

            // Log all messages for debugging (except ping/pong)
            if (data.type && !data.type.startsWith('ping') && !data.type.startsWith('pong')) {
              console.log('📨 Realtime API message:', data.type, data)
            }

            // Handle auth confirmation
            if (data.type === 'auth.success') {
              if (!authSuccessReceived) {
                authSuccessReceived = true
                clearTimeout(connectionTimeout)
                clearTimeout(authTimeout)
                console.log('✅ Authenticated with OpenAI Realtime API - session open for continuous conversation')
                isConnectedRef.current = true
                setIsConnected(true)

                // Send prompt ID via session.update event after authentication
                // According to OpenAI Realtime API documentation:
                // https://platform.openai.com/docs/guides/realtime-models-prompting
                const pendingPromptId = (ws as any)._pendingPromptId
                const pendingPromptVersion = (ws as any)._pendingPromptVersion

                if (pendingPromptId) {
                  console.log('📤 Sending prompt ID via session.update:', {
                    id: pendingPromptId,
                    version: pendingPromptVersion,
                  })

                  // Send session.update event with prompt configuration
                  // Note: session.type is not needed in session.update - only the fields to update
                  ws.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                      prompt: {
                        id: pendingPromptId,
                        version: pendingPromptVersion || '1',
                      },
                    },
                  }))

                  console.log('✅ Prompt ID sent to Realtime API:', {
                    id: pendingPromptId,
                    version: pendingPromptVersion || '1',
                  })
                }

                resolve(true)
              }
              return
            }

            // Handle errors from proxy
            if (data.type === 'error') {
              clearTimeout(connectionTimeout)
              clearTimeout(authTimeout)
              const errorMsg = data.error?.message || 'Unknown error'
              const errorDetails = data.error?.details || ''
              console.error('❌ Error from proxy:', errorMsg, errorDetails)
              toast.error(`Voice connection error: ${errorMsg}`, { duration: 5000 })
              isConnectedRef.current = false
              isRecordingRef.current = false
              setIsConnected(false)
              setIsRecording(false)
              resolve(false)
              return
            }

            // Handle session update confirmation
            if (data.type === 'session.updated') {
              console.log('✅ Session configuration updated - prompt ID applied')
              // Clear pending prompt info after successful update
              delete (ws as any)._pendingPromptId
              delete (ws as any)._pendingPromptVersion
            }

            // Handle connection closed
            if (data.type === 'connection.closed') {
              console.log('Connection to OpenAI Realtime API closed')
              isConnectedRef.current = false
              isRecordingRef.current = false
              setIsConnected(false)
              setIsRecording(false)
              setIsSpeaking(false)
              return
            }

            // Log all incoming messages for debugging
            if (data.type && !data.type.includes('ping') && !data.type.includes('pong')) {
              console.log('📨 Received message:', data.type, {
                hasDelta: !!data.delta,
                hasTranscript: !!data.transcript,
                hasText: !!data.text,
                hasAudio: !!data.audio,
              })
            }

            // Handle OpenAI Realtime API messages
            switch (data.type) {
              // Handle input transcription (what the user said)
              case 'conversation.item.input_audio_transcription.completed':
                if (data.transcript) {
                  console.log('👤 User said:', data.transcript)
                  currentTranscriptRef.current = data.transcript
                  if (onTranscript) {
                    onTranscript(data.transcript, true) // true = user input
                  }
                }
                break

              case 'conversation.item.input_audio_transcription.delta':
                // Real-time transcription updates as user speaks
                if (data.delta) {
                  console.log('👤 User transcript delta:', data.delta)
                  currentTranscriptRef.current += data.delta
                  if (onTranscript) {
                    onTranscript(currentTranscriptRef.current, true) // true = user input
                  }
                }
                break

              // Handle response transcription (what the assistant said)
              case 'response.audio_transcript.delta':
                // Handle transcript updates - show in UI
                if (data.delta) {
                  console.log('💬 AI response transcript delta:', data.delta)
                  // Accumulate AI response transcript
                  currentTranscriptRef.current += data.delta
                  if (onTranscript) {
                    onTranscript(currentTranscriptRef.current, false) // false = AI response
                  }
                }
                break

              case 'response.audio_transcript.done':
                // Final transcript
                if (data.transcript) {
                  console.log('💬 AI response transcript done:', data.transcript)
                  currentTranscriptRef.current = data.transcript
                  if (onTranscript) {
                    onTranscript(data.transcript, false) // false = AI response
                  }
                }
                break

              // Handle audio response
              case 'response.create':
                // Response generation started
                isResponseInProgressRef.current = true
                setIsSpeaking(true)
                // Reset audio chunk counter for this response
                audioChunksReceivedRef.current = 0
                // Clear processed chunks set to prevent duplicates
                processedAudioChunksRef.current.clear()
                // Clear previous transcript when new response starts
                currentTranscriptRef.current = ''
                if (onTranscript) {
                  onTranscript('', false) // false = AI response (clearing)
                }
                console.log('🎙️ Response generation started', data)
                break

              case 'response.audio.delta':
                // Handle audio chunks - play immediately
                // The delta contains base64-encoded PCM16 audio data
                if (data.delta) {
                  try {
                    // Create a unique hash for this chunk to prevent duplicates
                    const chunkHash = `${data.delta.substring(0, 20)}_${data.delta.length}`

                    // Skip if this chunk was already processed
                    if (processedAudioChunksRef.current.has(chunkHash)) {
                      return
                    }

                    // Mark as processed
                    processedAudioChunksRef.current.add(chunkHash)

                    // Decode base64 to get the raw audio bytes
                    const base64Audio = data.delta
                    const binaryString = atob(base64Audio)
                    const audioBytes = new Uint8Array(binaryString.length)
                    for (let i = 0; i < binaryString.length; i++) {
                      audioBytes[i] = binaryString.charCodeAt(i)
                    }

                    // The audio is already in PCM16 format (Int16)
                    // Convert Uint8Array to Int16Array buffer
                    const audioData = audioBytes.buffer

                    // Play audio automatically
                    playAudioChunk(audioData)
                    // Also call callback if provided
                    if (onAudioChunk) {
                      onAudioChunk(audioData)
                    }
                  } catch (error) {
                    console.error('❌ Error decoding audio:', error, {
                      deltaLength: data.delta?.length,
                      deltaType: typeof data.delta,
                    })
                  }
                }
                break

              case 'response.audio.done':
                // Audio response complete - wait for all queued audio to finish
                console.log('✅ Audio response done, waiting for playback to complete', {
                  queueLength: audioSourceQueueRef.current.length,
                  isPlaying: isPlayingAudioRef.current,
                })
                // Don't set isSpeaking to false yet - let the onended handlers do it
                break

              case 'response.done':
                // Response complete - reset state
                console.log('✅ Response completed - ready for next interaction', data)
                isResponseInProgressRef.current = false
                // Wait a bit for any remaining audio to finish
                setTimeout(() => {
                  if (audioSourceQueueRef.current.length === 0) {
                    setIsSpeaking(false)
                    isPlayingAudioRef.current = false
                  }
                }, 500)
                break

              case 'response.cancelled':
                // Response was cancelled
                console.log('❌ Response cancelled')
                isResponseInProgressRef.current = false
                setIsSpeaking(false)
                // Stop all playing audio
                audioSourceQueueRef.current.forEach(source => {
                  try {
                    source.stop()
                  } catch (e) {
                    // Source may already be stopped
                  }
                })
                audioSourceQueueRef.current = []
                isPlayingAudioRef.current = false
                break

              // Handle conversation events
              case 'conversation.item.created':
                console.log('📝 Conversation item created by server_vad')
                break

              case 'conversation.item.input_audio_buffer.speech_started':
                console.log('🎙️ Speech started - server_vad detected user speaking')
                break

              case 'conversation.item.input_audio_buffer.speech_stopped':
                console.log('🛑 Speech stopped - server_vad will automatically commit and generate response')
                // server_vad will automatically commit and generate response
                // No need to manually request response
                break

              case 'conversation.item.input_audio_buffer.committed':
                console.log('✅ Audio buffer committed by server_vad - requesting response...')
                // server_vad has committed the buffer
                // Explicitly request a response to ensure one is generated
                // Wait a small delay to ensure the commit is fully processed
                setTimeout(() => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isConnectedRef.current) {
                    try {
                      const responseRequest = {
                        type: 'response.create',
                      }
                      wsRef.current.send(JSON.stringify(responseRequest))
                      console.log('📤 Sent response.create request after buffer commit')
                    } catch (error) {
                      console.error('❌ Error requesting response:', error)
                    }
                  } else {
                    console.warn('⚠️ Cannot send response.create - WebSocket not ready', {
                      wsExists: !!wsRef.current,
                      wsReady: wsRef.current?.readyState === WebSocket.OPEN,
                      isConnected: isConnectedRef.current,
                    })
                  }
                }, 100) // Small delay to ensure commit is processed
                break

              case 'error':
                console.error('OpenAI Realtime API error:', data.error)
                toast.error(data.error?.message || 'Voice API error')
                isRecordingRef.current = false
                setIsRecording(false)
                setIsSpeaking(false)
                break

              default:
                // Log unknown message types for debugging
                if (data.type && !data.type.startsWith('ping') && !data.type.startsWith('pong')) {
                  console.debug('Unhandled message type:', data.type, data)
                }
                break
            }
          } catch (error: any) {
            console.error('Error processing WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          clearTimeout(authTimeout)
          console.error('❌ WebSocket error:', error)
          console.error('Proxy URL attempted:', proxyUrl)

          // Check if it's a connection refused error (server not running)
          const errorMessage =
            'Failed to connect to voice service. The WebSocket proxy server may not be running.\n\n' +
            'To fix this:\n' +
            '1. Open a new terminal\n' +
            '2. Run: npm run ws-proxy\n' +
            '3. Or: npx tsx lib/websocket-proxy.ts\n' +
            '4. Wait for "WebSocket proxy server running" message\n' +
            '5. Then try the voice button again\n\n' +
            `Expected server URL: ${proxyUrl}\n\n` +
            'Note: If you see "port already in use", the server may already be running!'
          toast.error(errorMessage, { duration: 12000 })
          isConnectedRef.current = false
          isRecordingRef.current = false
          setIsConnected(false)
          setIsRecording(false)
          setIsSpeaking(false)
          resolve(false)
        }

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout)
          clearTimeout(authTimeout)
          console.log('WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean })
          isConnectedRef.current = false
          isRecordingRef.current = false
          setIsConnected(false)
          setIsRecording(false)
          setIsSpeaking(false)

          // Code 1006 = abnormal closure (server not running or connection refused)
          if (event.code === 1006 && !authSuccessReceived) {
            toast.error(
              'Connection refused. The WebSocket proxy server is not running.\n\n' +
              'Please start it with: npm run ws-proxy\n' +
              'Or: npx tsx lib/websocket-proxy.ts',
              { duration: 8000 }
            )
            resolve(false)
          } else if (event.code !== 1000 && event.code !== 1001 && !authSuccessReceived) {
            toast.error(
              `Voice connection closed unexpectedly (code: ${event.code}). ` +
              'Please check if the WebSocket proxy server is running.',
              { duration: 5000 }
            )
            resolve(false)
          }
        }

        wsRef.current = ws
      } catch (error) {
        console.error('Error connecting to OpenAI Realtime API:', error)
        toast.error('Failed to initialize voice service')
        resolve(false)
      }
    })
  }

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

