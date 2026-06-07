import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import toast from 'react-hot-toast'
import type { ChatbotConfig } from '../types'
interface OpenAIRealtimeConnectionContext {
  chatbot: ChatbotConfig | null
  wsRef: MutableRefObject<WebSocket | null>
  audioSourceQueueRef: MutableRefObject<AudioBufferSourceNode[]>
  isPlayingAudioRef: MutableRefObject<boolean>
  isResponseInProgressRef: MutableRefObject<boolean>
  isRecordingRef: MutableRefObject<boolean>
  isConnectedRef: MutableRefObject<boolean>
  currentTranscriptRef: MutableRefObject<string>
  audioChunksReceivedRef: MutableRefObject<number>
  processedAudioChunksRef: MutableRefObject<Set<string>>
  setIsRecording: Dispatch<SetStateAction<boolean>>
  setIsSpeaking: Dispatch<SetStateAction<boolean>>
  setIsConnected: Dispatch<SetStateAction<boolean>>
  onTranscript: (transcript: string, isUserInput?: boolean) => void
  onAudioChunk?: (audioData: ArrayBuffer) => void
  playAudioChunk: (audioData: ArrayBuffer) => Promise<void>
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
export function connectOpenAIRealtimeWebSocket(context: OpenAIRealtimeConnectionContext): Promise<boolean> {
  const {
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
  } = context
    return new Promise(async (resolve, reject) => {
      try {
        const chatbotId = chatbot?.id
        if (!chatbotId) {
          console.error('Chatbot ID required for Realtime Voice')
          resolve(false)
          return
        }
        const proxyUrl = await getRealtimeProxyUrl(chatbotId)
        console.log('Connecting to WebSocket proxy:', proxyUrl)
        const ws = new WebSocket(proxyUrl)
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
        let authSuccessReceived = false
        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log('Connected to WebSocket proxy for Realtime Voice')
          const sessionConfig: any = {
            modalities: ['text', 'audio'], // This enables both text and audio responses
            voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
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
          const promptId = (chatbot as any)?.openaiAgentSdkRealtimePromptId
          const hasValidPromptId = promptId && typeof promptId === 'string' && promptId.trim().length > 0
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
            ; (ws as any)._pendingPromptId = hasValidPromptId ? promptId.trim() : null
            ; (ws as any)._pendingPromptVersion = hasValidPromptId ? ((chatbot as any).openaiAgentSdkRealtimePromptVersion || '1') : null
        }
        ws.onmessage = async (event) => {
          try {
            let messageData: string
            if (typeof event.data === 'string') {
              messageData = event.data
            } else if (event.data instanceof ArrayBuffer) {
              messageData = new TextDecoder().decode(event.data)
            } else if (event.data instanceof Blob) {
              messageData = await event.data.text()
            } else {
              messageData = new TextDecoder().decode(event.data as ArrayBuffer)
            }

            const data = JSON.parse(messageData)

            if (data.type && !data.type.startsWith('ping') && !data.type.startsWith('pong')) {
              console.log('📨 Realtime API message:', data.type, data)
            }

            if (data.type === 'auth.success') {
              if (!authSuccessReceived) {
                authSuccessReceived = true
                clearTimeout(connectionTimeout)
                clearTimeout(authTimeout)
                console.log('✅ Authenticated with OpenAI Realtime API - session open for continuous conversation')
                isConnectedRef.current = true
                setIsConnected(true)

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

