export type VideoSource = { kind: 'embed'; src: string } | { kind: 'file'; src: string }

/** Resolves a promo video URL (YouTube, Vimeo or a direct file) into a playable source. */
export function resolveVideoSource(raw: string | null | undefined): VideoSource | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null

  const host = url.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1)
        : url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')
          ? url.pathname.split('/')[2]
          : url.searchParams.get('v')
    return id && /^[\w-]{6,}$/.test(id)
      ? { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` }
      : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop()
    return id && /^\d+$/.test(id) ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}?autoplay=1` } : null
  }
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: 'file', src: url.toString() }
  return null
}
