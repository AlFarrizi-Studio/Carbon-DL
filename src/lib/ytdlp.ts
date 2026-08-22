import {spawn, type ChildProcess} from 'node:child_process'
import {createWriteStream} from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {formatBytes} from './format.js'
import type {AudioFormat, VideoFormat} from './formats.js'
import {searchYtMusic, ytmTrackUrl} from './ytmusic.js'

const CARBON_DIR = path.join(os.homedir(), '.carbon', 'bin')
const RELEASE_BASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download'

function ytDlpAssetName(): string {
  if (process.platform === 'win32') return 'yt-dlp.exe'
  if (process.platform === 'darwin') return 'yt-dlp_macos'
  return process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux'
}

function commandWorks(cmd: string, args: string[]): Promise<boolean> {
  return new Promise(resolve => {
    let child
    try {
      child = spawn(cmd, args, {stdio: 'ignore', timeout: 10_000})
    } catch {
      resolve(false)
      return
    }
    child.on('error', () => resolve(false))
    child.on('close', code => resolve(code === 0))
  })
}

/**
 * Resolve a usable yt-dlp binary: system install first, then a previously
 * downloaded copy, then download the standalone binary from GitHub releases.
 */
export async function ensureYtDlp(onStatus: (message: string) => void, signal?: AbortSignal): Promise<string> {
  if (await commandWorks('yt-dlp', ['--version'])) return 'yt-dlp'

  const local = path.join(CARBON_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
  if (await commandWorks(local, ['--version'])) return local

  onStatus('first run: fetching yt-dlp…')
  await fs.mkdir(CARBON_DIR, {recursive: true})

  const url = `${RELEASE_BASE}/${ytDlpAssetName()}`
  const response = await fetch(url, {signal})
  if (!response.ok || !response.body) {
    throw new Error(`Could not download yt-dlp (${response.status}). Check your connection and try again.`)
  }

  const tmp = `${local}.download`
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(tmp), {signal})
  if (process.platform !== 'win32') await fs.chmod(tmp, 0o755)
  await fs.rename(tmp, local)
  return local
}

/**
 * Find or download ffmpeg for stream merging / audio extraction.
 * Checks: system PATH → previously downloaded → download from GitHub.
 * Supports Windows, Linux (x64/arm64), and macOS.
 */
export async function ensureFfmpeg(onStatus?: (message: string) => void, signal?: AbortSignal): Promise<string | undefined> {
  // 1. System ffmpeg
  if (await commandWorks('ffmpeg', ['-version'])) return undefined

  // 2. Previously downloaded
  const ffmpegName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  const ffprobeName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
  const localFfmpeg = path.join(CARBON_DIR, ffmpegName)
  const localFfprobe = path.join(CARBON_DIR, ffprobeName)
  if (await commandWorks(localFfmpeg, ['-version'])) return CARBON_DIR

  // 3. Download ffmpeg
  onStatus?.('first run: fetching ffmpeg…')
  await fs.mkdir(CARBON_DIR, {recursive: true})

  const platform = process.platform
  const arch = process.arch

  let downloadUrl: string
  let archiveType: 'zip' | 'tar.xz'

  if (platform === 'win32') {
    downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip'
    archiveType = 'zip'
  } else if (platform === 'darwin') {
    // macOS: use evermeet.cx static builds (ffmpeg + ffprobe separately)
    await downloadMacOsFfmpeg(localFfmpeg, localFfprobe, signal)
    if (await commandWorks(localFfmpeg, ['-version'])) return CARBON_DIR
    return undefined
  } else {
    // Linux
    if (arch === 'arm64') {
      downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-linuxarm64-gpl.tar.xz'
    } else {
      downloadUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-linux64-gpl.tar.xz'
    }
    archiveType = 'tar.xz'
  }

  try {
    const response = await fetch(downloadUrl, {signal, redirect: 'follow'})
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`)
    }

    const archivePath = path.join(CARBON_DIR, archiveType === 'zip' ? 'ffmpeg.zip' : 'ffmpeg.tar.xz')
    await pipeline(Readable.fromWeb(response.body as never), createWriteStream(archivePath), {signal})

    // Extract
    if (archiveType === 'zip') {
      if (platform === 'win32') {
        // Use PowerShell to extract on Windows
        await new Promise<void>((resolve, reject) => {
          const child = spawn('powershell', ['-NoProfile', '-Command',
            `Expand-Archive -Path "${archivePath}" -DestinationPath "${CARBON_DIR}" -Force`], {stdio: 'ignore'})
          child.on('error', reject)
          child.on('close', code => code === 0 ? resolve() : reject(new Error(`Extract failed: ${code}`)))
        })
      } else {
        // macOS: use unzip
        await new Promise<void>((resolve, reject) => {
          const child = spawn('unzip', ['-o', archivePath, '-d', CARBON_DIR], {stdio: 'ignore'})
          child.on('error', reject)
          child.on('close', code => code === 0 ? resolve() : reject(new Error(`Extract failed: ${code}`)))
        })
      }
    } else {
      // Linux: use tar
      await new Promise<void>((resolve, reject) => {
        const child = spawn('tar', ['-xf', archivePath, '-C', CARBON_DIR], {stdio: 'ignore'})
        child.on('error', reject)
        child.on('close', code => code === 0 ? resolve() : reject(new Error(`Extract failed: ${code}`)))
      })
    }

    // Find and move ffmpeg/ffprobe binaries to CARBON_DIR
    await moveExtractedBinaries(CARBON_DIR, localFfmpeg, localFfprobe)

    // Cleanup archive
    await fs.unlink(archivePath).catch(() => {})

    if (await commandWorks(localFfmpeg, ['-version'])) return CARBON_DIR
  } catch {
    // Download failed — return undefined, yt-dlp will try without ffmpeg
  }

  return undefined
}

/** Recursively find ffmpeg/ffprobe in extracted directory and move to target. */
async function moveExtractedBinaries(searchDir: string, targetFfmpeg: string, targetFfprobe: string): Promise<void> {
  const ffmpegName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  const ffprobeName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'

  async function findFile(dir: string, name: string): Promise<string | undefined> {
    try {
      const entries = await fs.readdir(dir, {withFileTypes: true})
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          const found = await findFile(fullPath, name)
          if (found) return found
        } else if (entry.name === name) {
          return fullPath
        }
      }
    } catch {}
    return undefined
  }

  const foundFfmpeg = await findFile(searchDir, ffmpegName)
  const foundFfprobe = await findFile(searchDir, ffprobeName)

  if (foundFfmpeg) {
    await fs.copyFile(foundFfmpeg, targetFfmpeg)
    if (process.platform !== 'win32') await fs.chmod(targetFfmpeg, 0o755)
  }
  if (foundFfprobe) {
    await fs.copyFile(foundFfprobe, targetFfprobe)
    if (process.platform !== 'win32') await fs.chmod(targetFfprobe, 0o755)
  }

  // Cleanup extracted directories (ffmpeg-master-latest-* folders)
  try {
    const entries = await fs.readdir(searchDir, {withFileTypes: true})
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('ffmpeg-')) {
        await fs.rm(path.join(searchDir, entry.name), {recursive: true, force: true}).catch(() => {})
      }
    }
  } catch {}
}

/** Download ffmpeg and ffprobe for macOS from evermeet.cx static builds. */
async function downloadMacOsFfmpeg(targetFfmpeg: string, targetFfprobe: string, signal?: AbortSignal): Promise<void> {
  const downloads = [
    {url: 'https://evermeet.cx/ffmpeg/getrelease/zip', target: targetFfmpeg, name: 'ffmpeg'},
    {url: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip', target: targetFfprobe, name: 'ffprobe'},
  ]

  for (const {url, target, name} of downloads) {
    try {
      const response = await fetch(url, {signal, redirect: 'follow'})
      if (!response.ok || !response.body) continue

      const zipPath = path.join(CARBON_DIR, `${name}.zip`)
      await pipeline(Readable.fromWeb(response.body as never), createWriteStream(zipPath), {signal})

      // Extract using unzip
      await new Promise<void>((resolve, reject) => {
        const child = spawn('unzip', ['-o', zipPath, '-d', CARBON_DIR], {stdio: 'ignore'})
        child.on('error', reject)
        child.on('close', code => (code === 0 ? resolve() : reject(new Error(`Extract failed: ${code}`))))
      })

      // The extracted binary may be named 'ffmpeg' or 'ffprobe' directly
      const extractedPath = path.join(CARBON_DIR, name)
      if (extractedPath !== target) {
        await fs.rename(extractedPath, target).catch(() => {})
      }
      await fs.chmod(target, 0o755).catch(() => {})

      // Cleanup zip
      await fs.unlink(zipPath).catch(() => {})
    } catch {
      // Continue to next binary
    }
  }
}

export type RawFormat = {
  format_id: string
  ext?: string
  vcodec?: string
  acodec?: string
  height?: number
  width?: number
  fps?: number
  abr?: number
  tbr?: number
  filesize?: number
  filesize_approx?: number
}

export type VideoInfo = {
  title: string
  uploader?: string
  /** Track artist (music extractors: SoundCloud, Spotify, etc.) */
  artist?: string
  /** Album name (music extractors) */
  album?: string
  /** Release date in YYYYMMDD format */
  release_date?: string
  /** Track name (may differ from title) */
  track?: string
  /** Alternative creator field */
  creator?: string
  duration?: number
  webpage_url?: string
  extractor_key?: string
  formats?: RawFormat[]
  thumbnail?: string
  thumbnails?: Array<{url?: string; width?: number; height?: number; preference?: number}>
}

/** Format a YYYYMMDD release date into a readable string. */
export function formatReleaseDate(raw?: string): string | undefined {
  if (!raw || raw.length !== 8) return undefined
  const year = raw.slice(0, 4)
  const month = raw.slice(4, 6)
  const day = raw.slice(6, 8)
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return undefined
  return `${year}-${month}-${day}`
}

/** Best-guess artist/creator from available metadata fields. */
export function artistOf(info: VideoInfo): string | undefined {
  return info.artist ?? info.creator ?? info.uploader
}

/** Pick the best (highest-resolution) thumbnail URL from yt-dlp info.
 *
 *  yt-dlp's `thumbnails[]` array already carries the full set of artwork
 *  variants for every extractor — maxres/hq/mq for YouTube, the largest
 *  artwork for Spotify, SoundCloud, Deezer, etc. We therefore don't need
 *  any per-site URL tricks (no `maxresdefault.jpg` hardcoding); we simply
 *  choose the candidate with the biggest pixel area.
 *
 *  Sort order: resolution (width×height) first, extractor preference as the
 *  tiebreaker. This guarantees we grab the largest available source so the
 *  native-protocol render starts from a high-res image instead of upscaling
 *  a small thumbnail. */
/** Thumbnail URL plus its real pixel dimensions (when the extractor reports
 *  them). The dimensions let the UI reproduce the artwork's true aspect ratio
 *  — audio covers are usually square (1:1), video covers usually landscape
 *  (16:9), but many sources vary. */
export type ThumbnailInfo = {url: string; width?: number; height?: number}

export function bestThumbnail(info: VideoInfo): ThumbnailInfo | undefined {
  if (info.thumbnails && info.thumbnails.length > 0) {
    const candidates = info.thumbnails.filter(t => t.url)
    if (candidates.length > 0) {
      const sorted = [...candidates].sort((a, b) => {
        const areaA = (a.width ?? 0) * (a.height ?? 0)
        const areaB = (b.width ?? 0) * (b.height ?? 0)
        if (areaB !== areaA) return areaB - areaA
        return (b.preference ?? 0) - (a.preference ?? 0)
      })
      const best = sorted[0]!
      return {url: best.url!, width: best.width, height: best.height}
    }
  }
  if (info.thumbnail) return {url: info.thumbnail}
  return undefined
}

export type ProbeResult = {
  info: VideoInfo
  /** True if this was a music-service fallback (searched on YouTube Music) */
  spotifyFallback?: boolean
  /** Original music-service URL if fallback was used */
  originalUrl?: string
}

/** Music metadata from various services (public APIs, no auth). */
type MusicMeta = {title: string; artist?: string; album?: string; thumbnail?: string}

/** Spotify oEmbed response shape. */
type SpotifyOEmbed = {
  title?: string
  thumbnail_url?: string
  provider_name?: string
}

/** Fetch Spotify track/episode metadata via oEmbed (public, no auth). */
async function fetchSpotifyMetadata(url: string, signal?: AbortSignal): Promise<MusicMeta | undefined> {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl, {signal})
    if (!response.ok) return undefined
    const data = await response.json() as SpotifyOEmbed
    if (!data.title) return undefined
    return {title: data.title, thumbnail: data.thumbnail_url}
  } catch {
    return undefined
  }
}

/** iTunes Search API response item. */
type ITunesResult = {
  trackName?: string
  artistName?: string
  collectionName?: string
  artworkUrl100?: string
  releaseDate?: string
}

/** Fetch Apple Music metadata via iTunes Search API (public, no auth).
 *  Extracts the track ID from the URL and looks it up. */
async function fetchAppleMusicMetadata(url: string, signal?: AbortSignal): Promise<MusicMeta | undefined> {
  try {
    // Apple Music URLs look like https://music.apple.com/us/album/album-name/123456789?i=987654321
    const idMatch = /[?&]i=(\d+)/.exec(url) ?? /\/album\/[^/]+\/(\d+)/.exec(url)
    if (!idMatch) return undefined
    const lookupUrl = `https://itunes.apple.com/lookup?id=${idMatch[1]}&entity=song`
    const response = await fetch(lookupUrl, {signal})
    if (!response.ok) return undefined
    const data = await response.json() as {results?: ITunesResult[]}
    const item = data.results?.[0]
    if (!item?.trackName) return undefined
    return {
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      thumbnail: item.artworkUrl100?.replace('100x100', '600x600'),
    }
  } catch {
    return undefined
  }
}

/** Deezer API response shape. */
type DeezerTrack = {
  title?: string
  artist?: {name?: string}
  album?: {title?: string; cover_big?: string}
}

/** Fetch Deezer metadata via public API (no auth). */
async function fetchDeezerMetadata(url: string, signal?: AbortSignal): Promise<MusicMeta | undefined> {
  try {
    // Deezer URLs look like https://www.deezer.com/track/123456
    const idMatch = /\/track\/(\d+)/.exec(url)
    if (!idMatch) return undefined
    const response = await fetch(`https://api.deezer.com/track/${idMatch[1]}`, {signal})
    if (!response.ok) return undefined
    const data = await response.json() as DeezerTrack
    if (!data.title) return undefined
    return {
      title: data.title,
      artist: data.artist?.name,
      album: data.album?.title,
      thumbnail: data.album?.cover_big,
    }
  } catch {
    return undefined
  }
}

/** Detect music streaming service URLs that use DRM and need YouTube Music fallback.
 *  These services are known to use DRM protection, so we skip probing them
 *  entirely and go straight to YouTube Music search.
 *  NOTE: music.youtube.com is NOT included here — yt-dlp handles it natively. */
function isDrmMusicService(url: string): boolean {
  return /open\.spotify\.com|spotify:|music\.apple\.com|deezer\.com|tidal\.com|music\.amazon\.|amazon\.com\/music/i.test(url)
}

/** Extract a search query from URL path slugs as last-resort fallback.
 *  Works for Tidal, Amazon Music, and any service where we can't fetch metadata
 *  via API. Example: tidal.com/browse/track/123456/album/some-track-name */
function queryFromUrlSlug(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    // Look for the last meaningful text segment (skip numeric IDs and short tokens)
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = decodeURIComponent(segments[i] ?? '')
      // Skip pure numbers, very short segments, and common path keywords
      if (/^\d+$/.test(seg)) continue
      if (seg.length < 3) continue
      if (/^(browse|track|album|playlist|artist|listen|watch|music|us|gb|id)$/i.test(seg)) continue
      // Convert dashes/underscores to spaces
      return seg.replace(/[-_]+/g, ' ').trim()
    }
  } catch {
    // invalid URL
  }
  return undefined
}

/** Fetch metadata for a music service URL (tries the appropriate public API). */
async function fetchMusicMetadata(url: string, signal?: AbortSignal): Promise<MusicMeta | undefined> {
  if (/open\.spotify\.com|spotify:/i.test(url)) return fetchSpotifyMetadata(url, signal)
  if (/music\.apple\.com/i.test(url)) return fetchAppleMusicMetadata(url, signal)
  if (/deezer\.com/i.test(url)) return fetchDeezerMetadata(url, signal)
  // Tidal / Amazon Music / others: no easy public API — return undefined
  return undefined
}

function decodeHtmlEntities(s: string): string {
  const named: Record<string, string> = {
    quot: '"',
    amp: '&',
    lt: '<',
    gt: '>',
    apos: "'",
    nbsp: ' ',
  }
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    const c = String(code)
    if (/^#x/i.test(c)) return String.fromCodePoint(parseInt(c.slice(2), 16))
    if (c.startsWith('#')) return String.fromCodePoint(parseInt(c.slice(1), 10))
    return named[c.toLowerCase()] ?? match
  })
}

/** Open Graph metadata scraped from any webpage. */
type OgMetadata = {title?: string; description?: string; image?: string; type?: string}

/** Fetch Open Graph metadata from an arbitrary webpage.
 *  Used for sites yt-dlp has no extractor for (e.g. rythm.fm): if the page
 *  declares music.* og tags we can still build a YouTube Music search query
 *  and download the track from there. */
async function fetchPageOgMetadata(url: string, signal?: AbortSignal): Promise<OgMetadata | undefined> {
  try {
    const response = await fetch(url, {signal, headers: {'user-agent': BROWSER_UA}})
    if (!response.ok) return undefined
    const html = await response.text()
    const og = (prop: string): string | undefined => {
      const m =
        new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html) ??
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i').exec(html)
      return m?.[1] ? decodeHtmlEntities(m[1]) : undefined
    }
    const meta: OgMetadata = {
      title: og('og:title'),
      description: og('og:description'),
      image: og('og:image'),
      type: og('og:type'),
    }
    return meta.title || meta.description ? meta : undefined
  } catch {
    return undefined
  }
}

/** Search YouTube Music for a track and return the best match URL.
 *  Uses the YouTube Music InnerTube API directly (WEB_REMIX client) for
 *  reliable search results — no dependency on yt-dlp's ytmsearch extractor. */
async function searchYouTubeMusic(_ytdlp: string, query: string, signal?: AbortSignal): Promise<string | undefined> {
  const track = await searchYtMusic(query, signal)
  if (!track) return undefined
  return ytmTrackUrl(track)
}

/** Realistic desktop browser User-Agent. Many platforms (TikTok, Instagram, X)
 *  throttle or block the default yt-dlp/python UA, so we present a normal
 *  Chrome UA to look like regular web traffic. */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/** Strong restriction-bypass args for YouTube, used ONLY on retry.
 *  These alternative player clients can circumvent PO-token / DRM blocks, but
 *  they often serve LOWER-quality streams (android is frequently capped at
 *  360p/720p). That's why they are NOT used by default — the standard client
 *  returns the full-quality format list (e.g. 1080p60). We only reach for
 *  these when a normal download fails. */
const YOUTUBE_RETRY_ARGS = [
  '--extractor-args', 'youtube:player_client=android,tv,web_embedded,web;player_skip=configs;formats=missing_pot',
]

/** TikTok API hostnames used to dodge per-IP blocks. yt-dlp's TikTok extractor
 *  accepts `api_hostname`; pointing it at a regional mobile API host bypasses
 *  the "Unable to extract universal data for rehydration" / IP-block errors
 *  that the default web extraction hits. Ordered by reliability — `api16` is
 *  verified working, the others are fallbacks tried in sequence. */
const TIKTOK_API_HOSTS = [
  'api16-normal-c-useast1a.tiktokv.com',
  'api22-normal-c-useast2a.tiktokv.com',
  'api19-normal-c-useast2a.tiktokv.com',
]

/** Generic args safe for all sites. */
const GENERIC_BYPASS_ARGS = [
  '--no-check-certificates',
  // Present a normal browser UA to avoid bot-throttling on TikTok/IG/X/etc.
  '--user-agent', BROWSER_UA,
  // Bypass geo-restrictions where the extractor supports it.
  '--geo-bypass',
]

/** Check if URL is a YouTube link. */
function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url)
}

/** Check if URL is a TikTok link. */
function isTikTokUrl(url: string): boolean {
  return /tiktok\.com/i.test(url)
}

/** Get bypass args for a URL.
 *  By default we only add safe generic args (browser UA + geo-bypass) so
 *  yt-dlp uses its standard client and returns the highest-quality streams.
 *  Per-site behaviour:
 *   - TikTok  → ALWAYS uses a rotated regional API hostname. The default web
 *     extraction frequently fails with "Unable to extract universal data for
 *     rehydration" / IP blocks, while the mobile API host reliably returns
 *     the full-quality stream (verified: 1920p).
 *   - YouTube → alternative player clients ONLY on retry (`strong`), because
 *     the standard client gives the best quality on the first attempt. */
function bypassArgsFor(url: string, strong = false, tiktokHostIndex = -1): string[] {
  if (strong && isYouTubeUrl(url)) return [...YOUTUBE_RETRY_ARGS, ...GENERIC_BYPASS_ARGS]
  if (isTikTokUrl(url)) {
    // TikTok blocks API hosts dynamically per IP, so no single host is always
    // reliable. Strategy (mirrors NodeLink's proxy rotation):
    //  - First attempt: pick a host via a stable hash of the URL, spreading
    //    load across regional endpoints between different videos.
    //  - Retries: walk through the remaining hosts sequentially.
    const index = tiktokHostIndex < 0 ? Math.abs(hashCode(url)) : tiktokHostIndex
    const host = TIKTOK_API_HOSTS[index % TIKTOK_API_HOSTS.length]!
    return [
      '--extractor-args', `tiktok:api_hostname=${host}`,
      ...GENERIC_BYPASS_ARGS,
    ]
  }
  return GENERIC_BYPASS_ARGS
}

/** Simple stable string hash for rotating TikTok API hosts. */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

/** Detect available browser for cookies extraction.
 *  Cookies can bypass age restrictions and some DRM requirements. */
async function detectBrowser(): Promise<string | undefined> {
  const browsers = process.platform === 'win32'
    ? ['chrome', 'edge', 'firefox', 'brave']
    : process.platform === 'darwin'
      ? ['chrome', 'safari', 'firefox', 'brave']
      : ['chrome', 'firefox', 'chromium', 'brave']

  for (const browser of browsers) {
    if (await commandWorks('yt-dlp', ['--cookies-from-browser', browser, '--simulate', 'https://www.youtube.com/watch?v=jNQXAC9IVRw'])) {
      return browser
    }
  }
  return undefined
}

let cachedBrowser: string | undefined | null = null

/** Get browser for cookies (cached after first detection). */
export async function getBrowserForCookies(): Promise<string | undefined> {
  if (cachedBrowser === null) {
    cachedBrowser = await detectBrowser()
  }
  return cachedBrowser ?? undefined
}

export async function probe(ytdlp: string, url: string, signal?: AbortSignal, useCookies = false): Promise<ProbeResult> {
  const doProbe = async (targetUrl: string, strong = false, withCookies = false, tiktokHostIndex = 0): Promise<VideoInfo> => {
    const browser = withCookies ? await getBrowserForCookies() : undefined
    const cookies = browser ? ['--cookies-from-browser', browser] : []
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(ytdlp, ['-J', '--no-playlist', '--no-warnings', ...bypassArgsFor(targetUrl, strong, tiktokHostIndex), ...cookies, targetUrl], {signal})
      let out = ''
      let stderr = ''
      child.stdout.on('data', chunk => (out += chunk))
      child.stderr.on('data', chunk => (stderr += chunk))
      child.on('error', reject)
      child.on('close', code => {
        if (code !== 0) {
          reject(new Error(cleanYtDlpError(stderr) || `yt-dlp exited with code ${code}`))
        } else {
          resolve(out)
        }
      })
    })

    try {
      return JSON.parse(stdout) as VideoInfo
    } catch {
      throw new Error('Could not parse video info from yt-dlp.')
    }
  }

  /** Probe using yt-dlp's generic extractor (--force-generic-extractor).
   *  This handles sites without dedicated extractors: direct video links,
   *  HTML5 video embeds, and pages with embedded players. */
  const doProbeGeneric = async (targetUrl: string): Promise<VideoInfo> => {
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(
        ytdlp,
        ['-J', '--no-playlist', '--no-warnings', '--force-generic-extractor', ...GENERIC_BYPASS_ARGS, targetUrl],
        {signal},
      )
      let out = ''
      let stderr = ''
      child.stdout.on('data', chunk => (out += chunk))
      child.stderr.on('data', chunk => (stderr += chunk))
      child.on('error', reject)
      child.on('close', code => {
        if (code !== 0) {
          reject(new Error(cleanYtDlpError(stderr) || `yt-dlp exited with code ${code}`))
        } else {
          resolve(out)
        }
      })
    })

    try {
      return JSON.parse(stdout) as VideoInfo
    } catch {
      throw new Error('Could not parse video info from yt-dlp generic extractor.')
    }
  }

  // STRATEGY: Always try a direct yt-dlp probe first. yt-dlp natively supports
  // 1800+ sites (YouTube, music.youtube.com, TikTok, Instagram, Facebook, X,
  // Twitch, SoundCloud, Deezer, etc.) and returns the FULL quality format list
  // (e.g. 1080p60). Only when the direct probe fails do we:
  // 1. Retry with browser cookies (for login-required content)
  // 2. Fall back to YouTube Music search (for DRM music services)
  try {
    const info = await doProbe(url)
    return {info}
  } catch (directError) {
    if (signal?.aborted) throw directError

    const errMsg = directError instanceof Error ? directError.message : String(directError)

    // STEP 0: Retry with generic extractor for "Unsupported URL" errors.
    // yt-dlp's generic extractor can handle many sites that don't have
    // dedicated extractors (direct video links, embeds, etc.)
    const needsGeneric =
      /unsupported url|no video extractor|no extractor|unable to extract|generic extractor/i.test(errMsg)

    if (needsGeneric) {
      try {
        const info = await doProbeGeneric(url)
        return {info}
      } catch {
        // Generic extractor failed too, continue to other fallbacks
      }
    }

    // STEP 1: Retry with strong bypass args (alternative player clients / API hosts).
    // This handles TikTok IP blocks, YouTube PO-token blocks, etc.
    const needsBypass =
      /blocked|restricted|age|private|cookies|log.?in|sign.?in|authentication|403|429|unavailable|rehydration/i.test(errMsg)

    if (needsBypass) {
      // TikTok: walk through the remaining regional API hosts until one works.
      if (isTikTokUrl(url)) {
        const startIndex = Math.abs(hashCode(url)) % TIKTOK_API_HOSTS.length
        for (let attempt = 1; attempt < TIKTOK_API_HOSTS.length; attempt++) {
          if (signal?.aborted) throw directError
          const hostIndex = (startIndex + attempt) % TIKTOK_API_HOSTS.length
          try {
            const info = await doProbe(url, false, false, hostIndex)
            return {info}
          } catch {
            // This host is blocked too, try the next one
          }
        }
      } else {
        try {
          const info = await doProbe(url, true, false)
          return {info}
        } catch {
          // Strong bypass failed, continue to cookies
        }
      }
    }

    // STEP 2: Retry with browser cookies if the error suggests login/auth is needed.
    // This handles Instagram, Vimeo, age-restricted content, etc.
    const needsCookies =
      /cookies|log.?in|sign.?in|logged.?in|authentication|blocked|restricted|age|private/i.test(errMsg) &&
      !useCookies // Don't retry if we already used cookies

    if (needsCookies) {
      try {
        const browser = await getBrowserForCookies()
        if (browser) {
          const info = await doProbe(url, true, true)
          return {info}
        }
      } catch {
        // Cookie retry failed, continue to music fallback
      }
    }

    // STEP 3: For unknown/unsupported URLs, try scraping Open Graph metadata.
    // If the page declares music.* og tags (e.g. rythm.fm), we can build a
    // YouTube Music search query and download from there.
    const ogMeta = await fetchPageOgMetadata(url, signal)
    const looksLikeMusicPage = ogMeta?.type?.startsWith('music.') || /music|song|track|listen/i.test(ogMeta?.title ?? '')

    // STEP 4: Decide whether a YouTube Music fallback even makes sense. We fall
    // back for music-service URLs, DRM errors, or pages with music OG tags.
    const looksLikeMusicDrm =
      isDrmMusicService(url) ||
      /soundcloud\.com|bandcamp\.com|audiomack\.com/i.test(url) ||
      /\bdrm\b|premium|subscription required/i.test(errMsg) ||
      looksLikeMusicPage

    if (!looksLikeMusicDrm) throw directError

    // Build a search query: prefer API metadata, then OG title, then URL slug.
    const metadata = await fetchMusicMetadata(url, signal)
    let searchQuery: string | undefined
    if (metadata?.title) {
      searchQuery = metadata.artist ? `${metadata.artist} - ${metadata.title}` : metadata.title
    } else if (ogMeta?.title) {
      // OG title often contains "Track - Artist · Site" or "Track by Artist"
      searchQuery = ogMeta.title.replace(/\s*[·|]\s*\w+$/, '').trim()
    } else {
      searchQuery = queryFromUrlSlug(url)
    }

    if (searchQuery) {
      const youtubeUrl = await searchYouTubeMusic(ytdlp, searchQuery, signal)
      if (youtubeUrl) {
        try {
          const info = await doProbe(youtubeUrl)
          // Preserve original service metadata (album, artist, etc.)
          if (metadata?.title && !info.title) info.title = metadata.title
          if (metadata?.artist && !info.artist) info.artist = metadata.artist
          if (metadata?.album && !info.album) info.album = metadata.album
          return {info, spotifyFallback: true, originalUrl: url}
        } catch {
          // The YouTube Music result also failed to probe — fall through.
        }
      }
    }

    // All fallbacks exhausted — surface the original yt-dlp error (most informative).
    throw directError
  }
}

/** Highest video height the source offers, used to filter resolution list. */
export function maxHeight(info: VideoInfo): number {
  const videos = (info.formats ?? []).filter(f => f.vcodec && f.vcodec !== 'none' && f.height)
  return videos.reduce((max, f) => Math.max(max, f.height ?? 0), 0)
}

/** Distinct frame rates the source offers, descending. */
export function availableFps(info: VideoInfo): number[] {
  const videos = (info.formats ?? []).filter(f => f.vcodec && f.vcodec !== 'none' && f.fps)
  const set = new Set(videos.map(f => Math.round(f.fps ?? 0)).filter(f => f > 0))
  return [...set].sort((a, b) => b - a)
}

/** Whether the source has any audio stream. */
export function hasAudio(info: VideoInfo): boolean {
  return (info.formats ?? []).some(f => f.acodec && f.acodec !== 'none')
}

/** Estimated audio-only size in bytes, if known. */
export function audioSize(info: VideoInfo): number | undefined {
  const audioOnly = (info.formats ?? []).filter(
    f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'),
  )
  const best = [...audioOnly].sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0))[0]
  return best?.filesize ?? best?.filesize_approx
}

export type DownloadChoice = {
  label: string
  kind: 'video' | 'audio'
  args: string[]
  detail: string
}

/** Build yt-dlp args for a video download with chosen container, resolution and fps. */
export function buildVideoArgs(format: VideoFormat, resolution: number, fps: number): string[] {
  const heightFilter = resolution > 0 ? `[height<=${resolution}]` : ''
  const fpsFilter = fps > 0 ? `[fps<=${fps}]` : ''
  const selector = `bv*${heightFilter}${fpsFilter}+ba/b${heightFilter}${fpsFilter}/bv*${heightFilter}+ba/b`
  return ['-f', selector, '--merge-output-format', format.ext]
}

/** Build yt-dlp args for an audio-only extraction.
 *  bitrateKbps: 0 = best quality (lossless-grade), otherwise target bitrate. */
export function buildAudioArgs(format: AudioFormat, bitrateKbps = 0): string[] {
  const args = ['-f', 'ba/b', '-x', '--audio-format', format.id]
  if (bitrateKbps > 0) {
    args.push('--audio-quality', `${bitrateKbps}K`)
  } else {
    args.push('--audio-quality', '0')
  }
  return args
}

export type DownloadProgress = {
  downloadedBytes: number
  totalBytes?: number
  speed?: number
  eta?: number
  part: number
  totalParts: number
}

export type DownloadHandlers = {
  onProgress: (progress: DownloadProgress) => void
  onProcessing: () => void
}

const PROGRESS_PREFIX = 'CARBON|'
const PROGRESS_TEMPLATE = `${PROGRESS_PREFIX}%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s`

let activeChild: ChildProcess | undefined
process.on('exit', () => activeChild?.kill('SIGTERM'))

export async function download(
  opts: {
    ytdlp: string
    ffmpegLocation?: string
    url: string
    choice: DownloadChoice
    outDir: string
    useCookies?: boolean
    /** Use strong bypass args (alternative player clients) — only for retry */
    strongBypass?: boolean
  },
  handlers: DownloadHandlers,
  signal?: AbortSignal,
): Promise<string> {
  const browser = opts.useCookies ? await getBrowserForCookies() : undefined
  const cookieArgs = browser ? ['--cookies-from-browser', browser] : []
  const args = [
    opts.url,
    ...opts.choice.args,
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '--no-quiet',
    '--progress',
    '--progress-template',
    `download:${PROGRESS_TEMPLATE}`,
    '--print',
    'after_move:filepath',
    '--no-simulate',
    // DRM/restriction bypass (strong args only on retry to preserve quality)
    ...bypassArgsFor(opts.url, opts.strongBypass),
    // Cookies for age restriction / DRM bypass
    ...cookieArgs,
    // Embed metadata (title, artist, album, date…) and cover art into the
    // final file so media players can display them during playback.
    '--embed-metadata',
    '--embed-thumbnail',
    '-o',
    path.join(opts.outDir, '%(title).80s.%(ext)s'),
  ]
  if (opts.ffmpegLocation) args.push('--ffmpeg-location', opts.ffmpegLocation)

  return new Promise((resolve, reject) => {
    const child = spawn(opts.ytdlp, args, {signal})
    activeChild = child

    let stderr = ''
    let filepath = ''
    let part = 0
    let totalParts = 1
    let lastDownloaded = 0
    let buffer = ''
    const destinations: string[] = []

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) continue
        if (line.startsWith(PROGRESS_PREFIX)) {
          const [downloaded, total, totalEstimate, speed, eta] = line.slice(PROGRESS_PREFIX.length).split('|')
          const downloadedBytes = toNumber(downloaded) ?? 0
          if (downloadedBytes < lastDownloaded) part++
          lastDownloaded = downloadedBytes
          handlers.onProgress({
            downloadedBytes,
            totalBytes: toNumber(total) ?? toNumber(totalEstimate),
            speed: toNumber(speed),
            eta: toNumber(eta),
            part,
            totalParts,
          })
        } else if (line.includes('Downloading 1 format(s):')) {
          totalParts = (line.split('format(s):')[1] ?? '').trim().split('+').length
        } else if (line.includes('[Merger]') || line.includes('[ExtractAudio]') || line.includes('[VideoConvert]')) {
          const merging = /^\[Merger\] Merging formats into "(.+)"$/.exec(line)?.[1]
          const extracting = /^\[ExtractAudio\] Destination: (.+)$/.exec(line)?.[1]
          const target = merging ?? extracting
          if (target) destinations.push(target)
          handlers.onProcessing()
        } else if (line.startsWith('[download] Destination: ')) {
          destinations.push(line.slice('[download] Destination: '.length))
        } else if (path.isAbsolute(line)) {
          filepath = line
        }
      }
    })
    child.stderr.on('data', chunk => (stderr += chunk))
    child.on('error', reject)
    child.on('close', code => {
      activeChild = undefined
      if (signal?.aborted) {
        void removePartials(destinations)
        reject(new Error('Download cancelled.'))
        return
      }
      if (code === 0 && filepath) {
        resolve(filepath)
      } else {
        reject(new Error(cleanYtDlpError(stderr) || `Download failed (yt-dlp exit code ${code}).`))
      }
    })
  })
}

function removePartials(destinations: string[]): Promise<unknown> {
  return Promise.allSettled(
    destinations
      .flatMap(dest => [dest, `${dest}.part`, `${dest}.ytdl`])
      .map(file => fs.rm(file, {force: true})),
  )
}

function toNumber(value: string | undefined): number | undefined {
  if (!value || value === 'NA' || value === 'None') return undefined
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : undefined
}

function cleanYtDlpError(stderr: string): string {
  const lines = stderr
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('ERROR:'))
  const last = lines.at(-1)
  return last ? last.replace(/^ERROR:\s*(\[[^\]]+\]\s*)?/, '') : ''
}

export {formatBytes}
