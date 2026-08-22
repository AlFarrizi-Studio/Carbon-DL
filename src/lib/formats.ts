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
  const s = t()
  const rates = [...(format.bitrates ?? [])].sort((a, b) => b - a)
  return rates.map(kbps => ({
    key: String(kbps),
    label: `${kbps} kbps${kbps >= 320 ? `  ★ ${s.brHighest}` : kbps >= 192 ? `  ${s.brHigh}` : kbps >= 128 ? `  ${s.brStandard}` : `  ${s.brSmall}`}`,
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
