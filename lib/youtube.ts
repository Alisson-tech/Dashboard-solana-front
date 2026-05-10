export async function getYouTubeChannelId(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/get-channel-id?url=${encodeURIComponent(videoUrl)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.channelId ?? null
  } catch {
    return null
  }
}
