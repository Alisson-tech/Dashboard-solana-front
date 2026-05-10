import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const res = await fetch('https://backend-views-solana.onrender.com/api/v1/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.APP_API_KEY || '',
    },
    body: JSON.stringify({
      job_id: `submission-${Date.now()}`,
      deep_analysis: false,
      tasks: [{ user_handle: '', videos: [{ url, platform: 'youtube' }] }],
    }),
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'API error' }, { status: 502 })
  }

  const data = await res.json()
  const channelId = data?.summary?.[0]?.videos?.[0]?.youtube_channel_id
  return NextResponse.json({ channelId })
}
