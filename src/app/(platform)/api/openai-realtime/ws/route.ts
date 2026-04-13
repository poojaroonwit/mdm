import { NextRequest } from 'next/server'

// This route handles WebSocket upgrade requests for OpenAI Realtime API
// Note: Next.js API routes don't support WebSocket directly
// This is a placeholder that returns instructions for setting up a WebSocket proxy

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      message: 'WebSocket proxy required',
      instructions: [
        'Next.js API routes do not support WebSocket connections directly.',
        'You need to set up a separate WebSocket proxy server.',
        'See /lib/websocket-proxy.ts for a standalone server implementation.',
        'Or use a service like Pusher, Ably, or Socket.io for WebSocket proxying.',
      ],
      alternative: 'Use the browser voice provider for now, or set up a WebSocket proxy server.',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

