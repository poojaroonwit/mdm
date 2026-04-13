import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return new Response('Realtime via Supabase is disabled in this build', { status: 503 })
}
