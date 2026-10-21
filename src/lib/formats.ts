import {t} from './i18n.js'

export type VideoFormat = {
  id: string
  label: string
  ext: string
  recommended?: boolean
  /** i18n key for description */
  descKey: string
}

export type AudioFormat = {
  id: string
  label: string
  ext: string
  recommended?: boolean
  /** i18n key for description */
  descKey: string
  /** Supported bitrates in kbps. Empty/undefined = lossless, no bitrate choice. */
  bitrates?: number[]
}

export const VIDEO_FORMATS: VideoFormat[] = [
  {id: 'mp4', label: 'MP4', ext: 'mp4', recommended: true, descKey: 'fmtMp4'},
  {id: 'mkv', label: 'MKV', ext: 'mkv', descKey: 'fmtMkv'},
  {id: 'webm', label: 'WEBM', ext: 'webm', descKey: 'fmtWebm'},
  {id: 'mov', label: 'MOV', ext: 'mov', descKey: 'fmtMov'},
  {id: 'avi', label: 'AVI', ext: 'avi', descKey: 'fmtAvi'},
]

export const AUDIO_FORMATS: AudioFormat[] = [
  {id: 'mp3', label: 'MP3', ext: 'mp3', recommended: true, descKey: 'fmtMp3', bitrates: [8, 16, 24, 32, 48, 64, 96, 112, 128, 160, 192, 224, 256, 320]},
  {id: 'aac', label: 'AAC', ext: 'm4a', descKey: 'fmtAac', bitrates: [8, 16, 24, 32, 48, 64, 96, 112, 128, 160, 192, 224, 256, 320, 384, 512]},
  {id: 'm4a', label: 'M4A', ext: 'm4a', descKey: 'fmtM4a', bitrates: [8, 16, 24, 32, 48, 64, 96, 112, 128, 160, 192, 224, 256, 320, 384, 512]},
  {id: 'flac', label: 'FLAC', ext: 'flac', descKey: 'fmtFlac'},
  {id: 'wav', label: 'WAV', ext: 'wav', descKey: 'fmtWav'},
]

/** Get translated description for a format. */
export function fmtDesc(descKey: string): string {
  const s = t() as Record<string, string>
  return s[descKey] ?? descKey
}

/** Whether an audio format supports bitrate selection. */
export function hasBitrateOptions(format: AudioFormat): boolean {
  return Boolean(format.bitrates && format.bitrates.length > 0)
}

/** Build bitrate select items for a given audio format, highest first. */
export function bitrateItems(format: AudioFormat): Array<{key: string; label: string; value: number}> {
  const rates = [...(format.bitrates ?? [])].sort((a, b) => b - a)
  return rates.map(kbps => ({
    key: String(kbps),
    label: `${kbps} kbps`,
    value: kbps,
  }))
}

export const FPS_OPTIONS = [
  {value: 0, label: 'Source FPS', descKey: 'fpsSource'},
  {value: 24, label: '24 FPS', descKey: 'fps24'},
  {value: 30, label: '30 FPS', descKey: 'fps30'},
  {value: 60, label: '60 FPS', descKey: 'fps60'},
] as const

export type FpsOption = (typeof FPS_OPTIONS)[number]

/** A frame rate the user can pick. */
export type FpsChoice = {
  value: number
  /** The source really has this frame rate → picking it forces it. */
  exact: boolean
  /** The source has this frame rate or slightly below → closest is used. */
  reachable: boolean
}

/**
 * Build the frame-rate list for a source.
 *
 * The standard rates are always offered, but the ones the source actually
 * provides are marked as **exact** — picking those forces that frame rate
 * instead of quietly taking the next best one. Rates the source has but that
 * are not in the standard set (50, 120, …) are added as well.
 */
export function fpsChoices(sourceFps: number[]): FpsChoice[] {
  const choices: FpsChoice[] = []

  for (const opt of FPS_OPTIONS) {
    if (opt.value === 0) continue
    choices.push({
      value: opt.value,
      exact: sourceFps.includes(opt.value),
      reachable: sourceFps.some(f => f > opt.value * 0.75 && f <= opt.value),
    })
  }

  const extras = sourceFps
    .filter(f => !FPS_OPTIONS.some(o => o.value === f))
    .sort((a, b) => b - a)
  for (const f of extras) choices.push({value: f, exact: true, reachable: true})

  // Highest frame rate first — reads better than ascending.
  choices.sort((a, b) => b.value - a.value)
  return choices
}

export const RESOLUTIONS = [
  {value: 0, label: 'Best available', descKey: 'resBest'},
  {value: 2160, label: '2160p (4K)', descKey: 'res2160'},
  {value: 1440, label: '1440p (2K)', descKey: 'res1440'},
  {value: 1080, label: '1080p', descKey: 'res1080'},
  {value: 720, label: '720p', descKey: 'res720'},
  {value: 480, label: '480p', descKey: 'res480'},
  {value: 360, label: '360p', descKey: 'res360'},
] as const

export type ResolutionOption = (typeof RESOLUTIONS)[number]

/** The standard resolution ladder, highest first. */
export const STANDARD_HEIGHTS = [2160, 1440, 1080, 720, 480, 360] as const

/** Friendly tag for well-known pixel heights. */
const HEIGHT_TAGS: Record<number, string> = {
  4320: '8K',
  2160: '4K',
  1440: '2K',
  1080: 'Full HD',
  720: 'HD',
}

/** Label for a raw pixel height, e.g. 2160 → "2160p (4K)". */
export function heightLabel(height: number): string {
  const tag = HEIGHT_TAGS[height]
  return tag ? `${height}p (${tag})` : `${height}p`
}

/** i18n description key for a raw pixel height. */
export function heightDescKey(height: number): string {
  const map: Record<number, string> = {
    2160: 'res2160',
    1440: 'res1440',
    1080: 'res1080',
    720: 'res720',
    480: 'res480',
    360: 'res360',
  }
  return map[height] ?? 'resBest'
}

/** A resolution the user can pick. */
export type ResolutionChoice = {
  /** Pixel height. */
  value: number
  /** The source really has this exact height → picking it forces it. */
  exact: boolean
  /** The source has this height or slightly below → picking it gets the closest. */
  reachable: boolean
}

/**
 * Build the resolution list for a source.
 *
 * Every standard step is offered (so you can still ask for a downscale), but
 * the ones the source actually provides are marked as **exact** — picking
 * those forces that very height instead of silently taking the next best one.
 * Heights beyond the standard ladder (8K and up) are added when the source
 * offers them.
 */
export function resolutionChoices(sourceHeights: number[]): ResolutionChoice[] {
  const choices: ResolutionChoice[] = []

  for (const step of STANDARD_HEIGHTS) {
    choices.push({
      value: step,
      exact: sourceHeights.includes(step),
      // A source height counts as "reachable" when it is at least 75% of the
      // step — a 1080p source still offers a usable 1080p, a 240p-only
      // source does not.
      reachable: sourceHeights.some(h => h > step * 0.75 && h <= step),
    })
  }

  // Anything above the standard ladder (8K, 12K, …) is offered verbatim.
  const extras = sourceHeights.filter(h => h > STANDARD_HEIGHTS[0]).sort((a, b) => b - a)
  for (const h of extras) choices.unshift({value: h, exact: true, reachable: true})

  // Sources that never reach the lowest ladder step (a 240p-only clip, for
  // instance) would otherwise have no selectable height at all — list their
  // real heights instead.
  const sourceMax = sourceHeights[0] ?? 0
  if (sourceMax > 0 && sourceMax < STANDARD_HEIGHTS[STANDARD_HEIGHTS.length - 1]) {
    for (const h of sourceHeights) {
      if (choices.some(c => c.value === h)) continue
      choices.push({value: h, exact: true, reachable: true})
    }
    choices.sort((a, b) => b.value - a.value)
  }

  return choices
}
