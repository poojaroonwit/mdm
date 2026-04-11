import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'

interface UseWorkflowRealtimeVoiceProps {
  chatbot: ChatbotConfig | null
  onTranscript: (transcript: string) => void
  onAudioChunk?: (audioData: ArrayBuffer) => void
  onResponse?: (response: string) => void
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

/**
 * Realtime Voice Hook for Workflow Integration
 * 
 * This hook provides real-time voice communication using OpenAI Realtime API
 * and integrates with the workflow system.
 */
export function useWorkflowRealtimeVoice({
  chatbot,
  onTranscript,
  onAudioChunk,
  onResponse,
}: UseWorkflowRealtimeVoiceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioSourceQueueRef = useRef<AudioBufferSourceNode[]>([])
  const isPlayingAudioRef = useRef(false)

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

  useEffect(() => {
    // When voice is enabled, connect and keep connection open for continuous conversation
    if (chatbot?.enableVoiceAgent && chatbot?.voiceProvider === 'openai-realtime') {
      setIsVoiceEnabled(true)
      // Auto-connect when voice is enabled to keep session open
      if (!isConnected && !wsRef.current) {
        connectWebSocket().catch((error) => {
          console.error('Failed to auto-connect WebSocket:', error)
        })
      }
    } else {
      setIsVoiceEnabled(false)
      // Only disconnect if voice is explicitly disabled
      if (chatbot?.enableVoiceAgent === false) {
        disconnect()
      }
    }

    return () => {
      // Only disconnect on unmount, not when voice is temporarily disabled
      // This keeps the session open for continuous conversation
      if (!chatbot?.enableVoiceAgent) {
        disconnect()
      }
    }
  }, [chatbot?.enableVoiceAgent, chatbot?.voiceProvider])

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
    setIsRecording(false)
    setIsSpeaking(false)
    isPlayingAudioRef.current = false
    setIsConnected(false)
  }

  const connectWebSocket = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // Get API key from chatbot config
        const apiKey = chatbot?.openaiAgentSdkApiKey
        
        if (!apiKey) {
          toast.error('OpenAI API key is required for Realtime Voice')
          resolve(false)
          return
        }

        const chatbotId = chatbot?.id
        if (!chatbotId) {
          toast.error('Chatbot ID is required for Realtime Voice')
          resolve(false)
          return
        }

        const proxyUrl = await getRealtimeProxyUrl(chatbotId)
        console.log('Attempting to connect to WebSocket proxy:', proxyUrl)
        
        // First, try to check if server is reachable (optional health check)
        // For now, just try to connect directly
        const ws = new WebSocket(proxyUrl)
        
        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close()
            console.error('WebSocket connection timeout')
            toast.error(
              'Failed to connect to voice service. Please ensure the WebSocket proxy server is running.\n\n' +
              'To start it, run: npx tsx lib/websocket-proxy.ts\n' +
              'Or add to package.json: "ws-proxy": "tsx lib/websocket-proxy.ts"',
              { duration: 8000 }
            )
            resolve(false)
          }
        }, 5000) // 5 second timeout

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log('Connected to WebSocket proxy for Realtime Voice')
          
          // Send authentication and session configuration
          // Support both prompt-based and instruction-based sessions
          const sessionConfig: any = {
            modalities: ['text', 'audio'],
            voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
              // Whisper-1 automatically detects language and supports 99+ languages
              // No need to specify language - it will auto-detect
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            // Configure automatic response generation
            // When using server_vad, responses are automatically generated when speech stops
            // But we can also explicitly configure response settings
            temperature: 0.8,
            max_response_output_tokens: 4096,
          }
          
          // Store prompt ID for sending after authentication
          // According to OpenAI Realtime API docs, prompt should be sent via session.update event
          // https://platform.openai.com/docs/guides/realtime-models-prompting
          const promptId = (chatbot as any)?.openaiAgentSdkRealtimePromptId
          const hasValidPromptId = promptId && typeof promptId === 'string' && promptId.trim().length > 0
          
          // Use instructions in initial session config if no prompt ID
          // Prompt ID will be sent via session.update after auth.success
          if (!hasValidPromptId) {
            sessionConfig.instructions = chatbot?.openaiAgentSdkInstructions || 'You are a helpful assistant.'
            console.warn('No prompt ID configured for Realtime Voice. Using instructions instead.')
          }
          
          // Do NOT include workflow tools for realtime voice
          // Realtime API is designed for continuous conversation with prompts, not workflows

          ws.send(JSON.stringify({
            type: 'auth',
            apiKey: apiKey,
            sessionConfig,
          }))
          
          // Store prompt info for sending after auth
          ;(ws as any)._pendingPromptId = hasValidPromptId ? promptId.trim() : null
          ;(ws as any)._pendingPromptVersion = hasValidPromptId ? ((chatbot as any).openaiAgentSdkRealtimePromptVersion || '1') : null
        }
        
        ws.onmessage = async (event) => {
          try {
            const messageData = typeof event.data === 'string' 
              ? event.data 
              : new TextDecoder().decode(event.data as ArrayBuffer)
            
            const data = JSON.parse(messageData)
            
            // Handle auth confirmation
            if (data.type === 'auth.success') {
              console.log('Authenticated with OpenAI Realtime API - connection ready')
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
              
              // Wait a bit more to ensure OpenAI WebSocket is fully ready
              await new Promise(resolve => setTimeout(resolve, 200))
              resolve(true)
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
              setIsConnected(false)
              setIsRecording(false)
              setIsSpeaking(false)
              return
            }
            
            // Handle OpenAI Realtime API messages
            switch (data.type) {
              // Handle input transcription (what the user said)
              case 'conversation.item.input_audio_transcription.completed':
                if (data.transcript) {
                  console.log('User said:', data.transcript)
                  onTranscript(data.transcript)
                }
                break
              
              case 'conversation.item.input_audio_transcription.delta':
                // Real-time transcription updates as user speaks
                if (data.delta) {
                  onTranscript(data.delta)
                }
                break
              
              // Handle response transcription (what the assistant said)
              case 'response.audio_transcript.delta':
                // Handle transcript updates
                if (data.delta) {
                  onTranscript(data.delta)
                }
                break
              
              case 'response.audio_transcript.done':
                // Final transcript
                if (data.transcript) {
                  onTranscript(data.transcript)
                }
                break
              
              // Handle text response
              case 'response.text.delta':
                // Handle text response updates
                if (data.delta && onResponse) {
                  onResponse(data.delta)
                }
                break
              
              case 'response.text.done':
                // Final text response
                if (data.text && onResponse) {
                  onResponse(data.text)
                }
                break
              
              // Handle audio response
              case 'response.audio.delta':
                // Handle audio chunks - play immediately
                if (data.delta) {
                  // Convert base64 to ArrayBuffer
                  try {
                    const audioData = Uint8Array.from(atob(data.delta), c => c.charCodeAt(0))
                    // Play audio immediately
                    playAudioChunk(audioData.buffer)
                    // Also call callback if provided
                    if (onAudioChunk) {
                      onAudioChunk(audioData.buffer)
                    }
                  } catch (error) {
                    console.error('Error decoding audio:', error)
                  }
                }
                break
              
              case 'response.audio.done':
                // Audio response complete - wait for all queued audio to finish
                console.log('Audio response done, waiting for playback to complete')
                // Don't set isSpeaking to false yet - let the onended handlers do it
                break
              
              case 'response.done':
                // Response complete
                console.log('Response completed')
                // Wait a bit for any remaining audio to finish
                setTimeout(() => {
                  if (audioSourceQueueRef.current.length === 0) {
                    setIsSpeaking(false)
                    isPlayingAudioRef.current = false
                  }
                }, 500)
                break
              
              // Handle conversation events
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
        console.error('WebSocket connection error:', error)
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
        setIsConnected(false)
        resolve(false)
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log('OpenAI Realtime API disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean })
        setIsConnected(false)
        setIsRecording(false)
        setIsSpeaking(false)
        
        // Code 1006 = abnormal closure (server not running or connection refused)
        if (event.code === 1006) {
          toast.error(
            'Connection refused. The WebSocket proxy server is not running.\n\n' +
            'Please start it with: npm run ws-proxy',
            { duration: 8000 }
          )
        } else if (event.code !== 1000 && event.code !== 1001) {
          toast.error(
            `Voice connection closed unexpectedly (code: ${event.code}). ` +
            'Please check if the WebSocket proxy server is running.',
            { duration: 5000 }
          )
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
    if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('Connecting to voice service...')
      const connected = await connectWebSocket()
      if (!connected) {
        toast.error('Failed to connect to voice service')
        return
      }
      // Wait for auth.success to be received and OpenAI connection to be fully established
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Double-check connection state before starting recording
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnected) {
      toast.error('Not connected to voice service. Please wait for connection to establish.')
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
        }
      })
      mediaStreamRef.current = stream
      
      // Create audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      })
      audioContextRef.current = audioContext
      
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      
      processor.onaudioprocess = (e) => {
        // Only send audio if connected and recording
        // Double-check connection state before sending
        if (wsRef.current && 
            wsRef.current.readyState === WebSocket.OPEN && 
            isRecording && 
            isConnected) {
          const inputData = e.inputBuffer.getChannelData(0)
          // Convert Float32Array to Int16Array (PCM16)
          const int16Data = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
          }
          
          // Convert to base64 for sending (OpenAI Realtime API expects base64-encoded PCM16)
          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(int16Data.buffer))
          )
          
          // Send audio to OpenAI Realtime API via proxy
          // The proxy will forward this to OpenAI
          try {
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }))
          } catch (error) {
            console.error('Error sending audio chunk:', error)
            // If sending fails, stop recording
            if (error instanceof Error && error.message.includes('not connected')) {
              setIsRecording(false)
              setIsConnected(false)
            }
          }
        }
      }
      
      source.connect(processor)
      processor.connect(audioContext.destination)
      
      // Start recording - only send if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isConnected) {
        // Set recording state first
        setIsRecording(true)
        
        // With server_vad turn detection, we just need to start sending audio
        // The API will automatically detect when speech starts/stops and generate responses
        // No need to manually create conversation items or commit buffers initially
        
        toast.success('Recording started')
        console.log('Recording started - connection ready')
      } else {
        console.error('Cannot start recording - connection not ready', {
          wsReady: wsRef.current?.readyState === WebSocket.OPEN,
          isConnected,
        })
        toast.error('Not connected to voice service. Please wait for connection to establish.')
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    // Stop microphone input
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    
    // With server_vad turn detection, the API automatically:
    // 1. Detects when speech stops (based on silence_duration_ms)
    // 2. Commits the audio buffer
    // 3. Transcribes the input
    // 4. Generates a response automatically
    // 
    // The connection stays open for continuous conversation
    // No need to manually request response - server_vad handles it
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isConnected) {
      // Commit the audio buffer to finalize the input
      // The API will automatically generate a response when it detects speech has stopped
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }))
      console.log('Audio buffer committed - waiting for automatic response generation')
    }
    
    setIsRecording(false)
    // Note: Connection stays open for next interaction
  }

  return {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    isConnected,
    startRecording,
    stopRecording,
    playAudioChunk,
    disconnect,
  }
}

