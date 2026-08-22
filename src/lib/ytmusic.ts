/**
 * YouTube Music InnerTube API — direct search implementation.
 *
 * Inspired by NodeLink's Web_Remix client approach: instead of relying on
 * yt-dlp's ytmsearch extractor (which can break), we call the YouTube Music
 * InnerTube search API directly with the WEB_REMIX client context.
 *
 * This gives us reliable track search results with videoId that we can then
 * hand off to yt-dlp for the actual download.
 */

const YTMUSIC_SEARCH_URL = 'https://music.youtube.com/youtubei/v1/search?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30&prettyPrint=false'

/** WEB_REMIX client context for YouTube Music Innertube requests. */
const CLIENT_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20260302.03.01',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    hl: 'en',
    gl: 'US',
  },
  user: {lockedSafetyMode: false},
  request: {useSsl: true},
}

/** InnerTube params filter for "Tracks" only search results. */
const PARAMS_TRACKS = 'EgWKAQIIAWoSEAMQBRAEEAkQChAVEBAQDhAR'

export type YtMusicTrack = {
  videoId: string
  title: string
  artist?: string
  album?: string
  duration?: string
  thumbnail?: string
}

/**
 * Search YouTube Music for a track using the InnerTube API.
 * Returns the best matching track, or undefined if nothing found.
 */
export async function searchYtMusic(
  query: string,
  signal?: AbortSignal,
): Promise<YtMusicTrack | undefined> {
  const results = await searchYtMusicMany(query, 1, signal)
  return results[0]
}

/**
 * Search YouTube Music and return up to `limit` results.
 */
export async function searchYtMusicMany(
  query: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<YtMusicTrack[]> {
  try {
    const response = await fetch(YTMUSIC_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': CLIENT_CONTEXT.client.userAgent,
        'X-Goog-Api-Format-Version': '2',
      },
      body: JSON.stringify({
        context: CLIENT_CONTEXT,
        query,
        params: PARAMS_TRACKS,
      }),
      signal,
    })

    if (!response.ok) return []

    const data = (await response.json()) as Record<string, unknown>
    return parseSearchResults(data, limit)
  } catch {
    return []
  }
}

/** Parse the InnerTube search response into track objects. */
function parseSearchResults(data: Record<string, unknown>, limit: number): YtMusicTrack[] {
  const tracks: YtMusicTrack[] = []

  // Navigate: contents.tabbedSearchResultsRenderer.tabs[0].tabRenderer.content
  const contents = data.contents as Record<string, unknown> | undefined
  const tabbed = contents?.tabbedSearchResultsRenderer as Record<string, unknown> | undefined
  const tabs = tabbed?.tabs as Array<Record<string, unknown>> | undefined
  const tabContent = tabs?.[0]?.tabRenderer as Record<string, unknown> | undefined
  const content = tabContent?.content as Record<string, unknown> | undefined

  // Try sectionListRenderer directly, or inside musicSplitViewRenderer
  let sectionContents: unknown[] | undefined

  const sectionList = content?.sectionListRenderer as Record<string, unknown> | undefined
  if (sectionList?.contents) {
    sectionContents = sectionList.contents as unknown[]
  }

  if (!sectionContents) {
    const splitView = content?.musicSplitViewRenderer as Record<string, unknown> | undefined
    const mainContent = splitView?.mainContent as Record<string, unknown> | undefined
    const mainSectionList = mainContent?.sectionListRenderer as Record<string, unknown> | undefined
    if (mainSectionList?.contents) {
      sectionContents = mainSectionList.contents as unknown[]
    }
  }

  if (!sectionContents) return []

  // Find musicShelfRenderer contents
  const shelfContents = findShelfContents(sectionContents)
  if (!shelfContents) return []

  for (const item of shelfContents) {
    if (tracks.length >= limit) break
    const track = parseTrackItem(item as Record<string, unknown>)
    if (track) tracks.push(track)
  }

  return tracks
}

/** Find the musicShelfRenderer contents array from section list. */
function findShelfContents(sections: unknown[]): unknown[] | undefined {
  for (const section of sections) {
    const sec = section as Record<string, unknown>
    const shelf = sec.musicShelfRenderer as Record<string, unknown> | undefined
    if (shelf?.contents) {
      return shelf.contents as unknown[]
    }
  }
  return undefined
}

/** Parse a single musicResponsiveListItemRenderer into a track. */
function parseTrackItem(item: Record<string, unknown>): YtMusicTrack | undefined {
  const renderer =
    (item.musicResponsiveListItemRenderer as Record<string, unknown> | undefined) ??
    (item.musicTwoColumnItemRenderer as Record<string, unknown> | undefined)

  if (!renderer) return undefined

  // Get videoId from playlistItemData or overlay
  const playlistItemData = renderer.playlistItemData as Record<string, unknown> | undefined
  let videoId = playlistItemData?.videoId as string | undefined

  if (!videoId) {
    const overlay = renderer.overlay as Record<string, unknown> | undefined
    const overlayRenderer = overlay?.musicItemThumbnailOverlayRenderer as Record<string, unknown> | undefined
    const content2 = overlayRenderer?.content as Record<string, unknown> | undefined
    const musicPlayButton = content2?.musicPlayButtonRenderer as Record<string, unknown> | undefined
    const playNavigation = musicPlayButton?.playNavigationEndpoint as Record<string, unknown> | undefined
    const watchEndpoint = playNavigation?.watchEndpoint as Record<string, unknown> | undefined
    videoId = watchEndpoint?.videoId as string | undefined
  }

  if (!videoId) return undefined

  // Get title and artist from flexColumns
  const flexColumns = renderer.flexColumns as Array<Record<string, unknown>> | undefined
  let title: string | undefined
  let artist: string | undefined
  let album: string | undefined

  if (flexColumns && flexColumns.length > 0) {
    // First column = title
    const titleCol = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer as Record<string, unknown> | undefined
    title = extractText(titleCol?.text as Record<string, unknown> | undefined)

    // Second column = artist · album
    if (flexColumns.length > 1) {
      const artistCol = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer as Record<string, unknown> | undefined
      const artistText = extractText(artistCol?.text as Record<string, unknown> | undefined)
      if (artistText) {
        // Format is usually "Artist • Album" or just "Artist"
        const parts = artistText.split('•').map(p => p.trim())
        artist = parts[0]
        album = parts.length > 1 ? parts.slice(1).join(' • ') : undefined
      }
    }
  }

  // Get thumbnail
  const thumbnail = renderer.thumbnail as Record<string, unknown> | undefined
  const thumbRenderer = thumbnail?.musicThumbnailRenderer as Record<string, unknown> | undefined
  const thumbContent = thumbRenderer?.thumbnail as Record<string, unknown> | undefined
  const thumbSources = thumbContent?.thumbnails as Array<Record<string, unknown>> | undefined
  const bestThumb = thumbSources?.length ? (thumbSources[thumbSources.length - 1]?.url as string | undefined) : undefined

  // Get duration from fixedColumns
  const fixedColumns = renderer.fixedColumns as Array<Record<string, unknown>> | undefined
  let duration: string | undefined
  if (fixedColumns && fixedColumns.length > 0) {
    const durationCol = fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer as Record<string, unknown> | undefined
    duration = extractText(durationCol?.text as Record<string, unknown> | undefined)
  }

  if (!title) return undefined

  return {videoId, title, artist, album, duration, thumbnail: bestThumb}
}

/** Extract plain text from an InnerTube text object with runs. */
function extractText(textObj: Record<string, unknown> | undefined): string | undefined {
  if (!textObj) return undefined

  // Simple text
  if (typeof textObj.simpleText === 'string') return textObj.simpleText

  // Runs array
  const runs = textObj.runs as Array<Record<string, unknown>> | undefined
  if (runs && runs.length > 0) {
    return runs.map(r => (r.text as string) ?? '').join('')
  }

  return undefined
}

/** Build a YouTube watch URL from a videoId. */
export function ytmTrackUrl(track: YtMusicTrack): string {
  return `https://www.youtube.com/watch?v=${track.videoId}`
}