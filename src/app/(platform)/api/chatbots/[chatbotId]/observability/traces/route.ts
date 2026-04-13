import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-middleware';

async function handler(request: NextRequest) {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export const GET = withErrorHandling(handler, 'GET placeholder');
