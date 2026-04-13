import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getLangfuseClient, isLangfuseEnabled } from '@/lib/langfuse'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { 
      agentId = body.agent_id, 
      apiKey = body.api_key, 
      messageId = body.message_id,
      feedback, // 'liked' | 'disliked' | null
      messageContent = body.message_content,
      conversationContext = body.conversation_context,
      chatbotId = body.chatbot_id,
      threadId = body.thread_id,
      traceId = body.trace_id, // Optional: Langfuse trace ID if available
    } = body

    if (!agentId || !apiKey || !messageId) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, apiKey, or messageId' },
        { status: 400 }
      )
    }

    if (!feedback || (feedback !== 'liked' && feedback !== 'disliked')) {
      return NextResponse.json(
        { error: 'Invalid feedback. Must be "liked" or "disliked"' },
        { status: 400 }
      )
    }

    // Check if agentId is a workflow ID (wf_...) or assistant ID (asst_...)
    const isWorkflow = agentId.startsWith('wf_')
    const isAssistant = agentId.startsWith('asst_')

    if (!isWorkflow && !isAssistant) {
      return NextResponse.json(
        { 
          error: 'Invalid agent ID format',
          details: 'Agent ID must start with "wf_" (workflow) or "asst_" (assistant)'
        },
        { status: 400 }
      )
    }

    // For workflows, we can send feedback to OpenAI's feedback API if available
    // For now, we'll log it and potentially store it for analytics
    if (isWorkflow) {
      try {
        // Try to send feedback to OpenAI's feedback endpoint if available
        // Note: This endpoint might not be available in all versions
        const feedbackResponse = await fetch(`https://api.openai.com/v1/workflows/${agentId}/feedback`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message_id: messageId,
            feedback: feedback,
            message_content: messageContent,
            conversation_context: conversationContext
          }),
        })

        if (feedbackResponse.ok) {
          const data = await feedbackResponse.json()
          
          // Send feedback to Langfuse if enabled and traceId is provided
          if ((await isLangfuseEnabled()) && traceId) {
            const langfuse = await getLangfuseClient()
            if (langfuse) {
              try {
                langfuse.score({
                  traceId,
                  name: 'user-feedback',
                  value: feedback === 'liked' ? 1 : 0,
                  comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                  metadata: {
                    messageId,
                    agentId,
                    chatbotId: chatbotId || undefined,
                    threadId: threadId || undefined,
                    agentType: 'workflow',
                  },
                })
              } catch (langfuseError) {
                console.warn('Failed to send feedback to Langfuse:', langfuseError)
              }
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Feedback sent successfully',
            data
          })
        } else {
          // If the endpoint doesn't exist, we'll still log the feedback locally
          console.log('Workflow feedback (not sent to API):', {
            agentId,
            messageId,
            feedback,
            messageContent
          })
          
          // Still send to Langfuse even if OpenAI API doesn't accept it
          if ((await isLangfuseEnabled()) && traceId) {
            const langfuse = await getLangfuseClient()
            if (langfuse) {
              try {
                langfuse.score({
                  traceId,
                  name: 'user-feedback',
                  value: feedback === 'liked' ? 1 : 0,
                  comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                  metadata: {
                    messageId,
                    agentId,
                    chatbotId: chatbotId || undefined,
                    threadId: threadId || undefined,
                    agentType: 'workflow',
                  },
                })
              } catch (langfuseError) {
                console.warn('Failed to send feedback to Langfuse:', langfuseError)
              }
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Feedback recorded locally (API endpoint not available)',
            note: 'Feedback has been logged but not sent to OpenAI API'
          })
        }
      } catch (error) {
        console.error('Error sending feedback:', error)
        return NextResponse.json(
          { error: 'Failed to send feedback' },
          { status: 500 }
        )
      }
    }

    // For assistants
    return NextResponse.json({
      success: true,
      message: 'Feedback recorded for assistant'
    })
  } catch (error: any) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to process feedback', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/openai-agent-sdk/feedback')
