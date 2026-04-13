import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const engineId = formData.get('engineId') as string

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    if (!engineId) {
      return NextResponse.json({ error: 'Engine ID is required' }, { status: 400 })
    }

    // Convert audio file to base64 or send directly to Agent Builder API
    const audioBuffer = await audioFile.arrayBuffer()
    
    // Call Agent Builder voice API
    // Note: This is a placeholder - you'll need to implement the actual Agent Builder voice API call
    // The Agent Builder API endpoint and authentication will depend on your Agent Builder setup
    
    try {
      // Example: Call Agent Builder API
      const agentBuilderResponse = await fetch(`https://api.agentbuilder.com/v1/engines/${engineId}/voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
          // Add your Agent Builder API key here
          // 'Authorization': `Bearer ${process.env.AGENTBUILDER_API_KEY}`,
        },
        body: audioBuffer,
      })

      if (!agentBuilderResponse.ok) {
        throw new Error(`Agent Builder API error: ${agentBuilderResponse.status}`)
      }

      const result = await agentBuilderResponse.json()
      
      return NextResponse.json({
        transcript: result.transcript || '',
        audio: result.audio || null, // Base64 encoded audio response
      })
    } catch (apiError: any) {
      console.error('Agent Builder API error:', apiError)
      return NextResponse.json({ 
        error: 'Failed to process voice with Agent Builder',
        details: apiError.message 
      })
    }
  } catch (error: any) {
    console.error('Agent Builder voice error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' })
  }
}

