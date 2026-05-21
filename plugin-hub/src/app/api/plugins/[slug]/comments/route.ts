import { NextRequest, NextResponse } from 'next/server'
import { proxyMainApp } from '../../../../../lib/hub-data'

function mapReview(review: any) {
  return {
    id: review.id,
    pluginSlug: review.slug,
    author: review.user?.name || review.user?.email || 'Anonymous',
    content: review.comment || review.title || '',
    createdAt: review.createdAt,
    rating: review.rating || 5,
    helpfulCount: review.helpfulCount || 0,
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params

  try {
    const response = await proxyMainApp(
      `/api/marketplace/plugins/${params.slug}/reviews`,
      { method: 'GET', cookie: request.headers.get('cookie') }
    )

    if (!response.ok) {
      return NextResponse.json({ comments: [] })
    }

    const data = await response.json()
    return NextResponse.json({
      comments: (data.reviews || []).map(mapReview),
    })
  } catch (error) {
    console.error('Error fetching plugin comments:', error)
    return NextResponse.json({ comments: [] })
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params

  try {
    const body = await request.json()
    const response = await proxyMainApp(
      `/api/marketplace/plugins/${params.slug}/reviews`,
      {
        method: 'POST',
        cookie: request.headers.get('cookie'),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: body.rating || 5,
          title: body.title || null,
          comment: body.content || body.comment || '',
        }),
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create comment' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      comment: mapReview(data.review),
    }, { status: response.status })
  } catch (error) {
    console.error('Error creating plugin comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
