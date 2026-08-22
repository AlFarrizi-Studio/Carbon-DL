export type Platform = {
  key: string
  label: string
}

const PLATFORMS: Array<{hosts: string[]; platform: Platform}> = [
  {hosts: ['youtube.com', 'youtu.be', 'music.youtube.com'], platform: {key: 'youtube', label: 'YouTube'}},
  {hosts: ['x.com', 'twitter.com'], platform: {key: 'x', label: 'X / Twitter'}},
  {hosts: ['instagram.com'], platform: {key: 'instagram', label: 'Instagram'}},
  {hosts: ['threads.net', 'threads.com'], platform: {key: 'threads', label: 'Threads'}},
  {hosts: ['tiktok.com'], platform: {key: 'tiktok', label: 'TikTok'}},
  {hosts: ['vimeo.com'], platform: {key: 'vimeo', label: 'Vimeo'}},
  {hosts: ['twitch.tv'], platform: {key: 'twitch', label: 'Twitch'}},
  {hosts: ['reddit.com', 'redd.it'], platform: {key: 'reddit', label: 'Reddit'}},
  {hosts: ['facebook.com', 'fb.watch', 'fb.com'], platform: {key: 'facebook', label: 'Facebook'}},
  {hosts: ['soundcloud.com'], platform: {key: 'soundcloud', label: 'SoundCloud'}},
  {hosts: ['spotify.com', 'open.spotify.com'], platform: {key: 'spotify', label: 'Spotify'}},
  {hosts: ['bandcamp.com'], platform: {key: 'bandcamp', label: 'Bandcamp'}},
  {hosts: ['dailymotion.com', 'dai.ly'], platform: {key: 'dailymotion', label: 'Dailymotion'}},
  {hosts: ['bilibili.com', 'b23.tv'], platform: {key: 'bilibili', label: 'Bilibili'}},
  {hosts: ['pinterest.com', 'pin.it'], platform: {key: 'pinterest', label: 'Pinterest'}},
  {hosts: ['tumblr.com'], platform: {key: 'tumblr', label: 'Tumblr'}},
  {hosts: ['ok.ru', 'odnoklassniki.ru'], platform: {key: 'ok', label: 'OK.ru'}},
  {hosts: ['streamable.com'], platform: {key: 'streamable', label: 'Streamable'}},
  // Streaming hosts / embedded players
  {hosts: ['streamtape.com', 'streamtape.net', 'streamtape.to'], platform: {key: 'streamtape', label: 'StreamTape'}},
  {hosts: ['mixdrop.co', 'mixdrop.to', 'mixdrop.sx'], platform: {key: 'mixdrop', label: 'MixDrop'}},
  {hosts: ['dood.to', 'dood.so', 'dood.ws', 'dood.sh', 'dood.re'], platform: {key: 'doodstream', label: 'DoodStream'}},
  {hosts: ['filemoon.sx', 'filemoon.to', 'filemoon.in'], platform: {key: 'filemoon', label: 'FileMoon'}},
  {hosts: ['voe.sx'], platform: {key: 'voe', label: 'VOE'}},
  {hosts: ['vidcloud.co', 'vidcloud.pro'], platform: {key: 'vidcloud', label: 'VidCloud'}},
  {hosts: ['upstream.to'], platform: {key: 'upstream', label: 'UpStream'}},
  {hosts: ['streamhub.to'], platform: {key: 'streamhub', label: 'StreamHub'}},
  {hosts: ['embed.smashystream.com', 'smashystream.com'], platform: {key: 'smashy', label: 'SmashyStream'}},
]

export function detectPlatform(url: string): Platform {
  const trimmed = url.trim()

  // Direct manifest links (HLS / DASH) — common on streaming sites
  if (/\.m3u8(\?|$)/i.test(trimmed)) return {key: 'hls', label: 'HLS Stream (.m3u8)'}
  if (/\.mpd(\?|$)/i.test(trimmed)) return {key: 'dash', label: 'DASH Stream (.mpd)'}
  if (/\.(mp4|mkv|webm|mov|avi)(\?|$)/i.test(trimmed)) return {key: 'direct', label: 'Direct video file'}

  let hostname: string
  try {
    hostname = new URL(trimmed).hostname.toLowerCase()
  } catch {
    return {key: 'unknown', label: 'Unknown site'}
  }

  for (const {hosts, platform} of PLATFORMS) {
    if (hosts.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
      return platform
    }
  }

  return {key: 'generic', label: hostname}
}

export function isProbablyUrl(input: string): boolean {
  try {
    const u = new URL(input.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}