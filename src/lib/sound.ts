/**
 * Notification sounds.
 *
 * Three short clips ship with Carbon:
 *   1 — success  (a download finished)
 *   2 — update   (a newer release is available)
 *   3 — error    (something went wrong)
 *
 * The clips live in the `sound/` folder next to the app. They are looked up
 * in a few sensible places so the sounds work no matter how Carbon was
 * installed:
 *
 *   1. $CARBON_SOUND_DIR          (explicit override)
 *   2. ~/.carbon/sounds            (installer location)
 *   3. <app>/sounds, <app>/../sound (npm package layout)
 *   4. ./sound                     (running from a checkout)
 *
 * Playback is fire-and-forget: it never blocks the UI, never writes to the
 * terminal, and silently does nothing when no player is installed or the
 * clips are missing.
 *
 * Disable it with `--no-sound` or `CARBON_SOUND=0`.
 */

import {spawn} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {which} from './termux.js'

export type SoundKind = 'success' | 'update' | 'error'

/** Clip file names inside the sound folder. */
const CLIP_FILES: Record<SoundKind, string> = {
  success: '1.mp3',
  update: '2.mp3',
  error: '3.mp3',
}

let soundEnabled = true
let soundVolume = 80

/** Turn notifications on/off at runtime (used by the `--no-sound` flag). */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled
}

export function isSoundEnabled(): boolean {
  return soundEnabled
}

/** Notification volume, 0–100. */
export function setSoundVolume(volume: number): void {
  soundVolume = Math.min(100, Math.max(0, Math.round(volume)))
}

export function getSoundVolume(): number {
  return soundVolume
}

/** Directory of the running bundle (empty string when it can't be resolved). */
function appDir(): string {
  try {
    return path.dirname(fileURLToPath(import.meta.url))
  } catch {
    return ''
  }
}

/** Find the folder that holds the clips, or undefined when it's missing. */
export function findSoundDir(): string | undefined {
  const here = appDir()
  const candidates: string[] = []

  // An explicit override wins as long as the folder exists — otherwise a
  // typo would silently fall back to the default location.
  const override = process.env.CARBON_SOUND_DIR?.trim()
  if (override) {
    try {
      if (fs.statSync(override).isDirectory()) return override
    } catch {
      // folder does not exist — fall through to the normal lookup
    }
  }

  candidates.push(path.join(os.homedir(), '.carbon', 'sounds'))

  if (here) {
    candidates.push(path.join(here, 'sounds'))
    candidates.push(path.join(here, '..', 'sound'))
    candidates.push(path.join(here, '..', '..', 'sound'))
    candidates.push(path.join(here, '..', '..', '..', 'sound'))
  }

  candidates.push(path.join(process.cwd(), 'sound'))

  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, CLIP_FILES.success))) return dir
    } catch {
      // keep looking
    }
  }
  return undefined
}

/** A command that can play an mp3 file. */
type Player = {
  cmd: string
  /** Builds the argument list for a given file and volume (0–100). */
  args: (file: string, volume: number) => string[]
}

/** Convert a filesystem path into a `file://` URL (Windows needs this for MediaPlayer). */
function toFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  const encoded = withLeadingSlash
    .split('/')
    .map(segment => encodeURIComponent(segment).replace(/%3A/gi, ':'))
    .join('/')
  return `file://${encoded}`
}

/** PowerShell snippet that plays an mp3 through the built-in WPF media player. */
function windowsPowerShellPlayer(): Player {
  return {
    cmd: 'powershell',
    args: (file, volume) => {
      const uri = toFileUrl(file).replace(/'/g, "''")
      const level = (volume / 100).toFixed(2)
      // The player has to stay alive for the whole clip — when PowerShell
      // exits, the WPF media player stops with it. So wait for the media to
      // end (with a safety timeout) before closing it.
      const script = [
        "$ErrorActionPreference = 'SilentlyContinue'",
        'Add-Type -AssemblyName PresentationCore',
        '$p = New-Object System.Windows.Media.MediaPlayer',
        `$p.Volume = ${level}`,
        `$p.Open((New-Object System.Uri('${uri}')))`,
        '$p.Play()',
        '$deadline = (Get-Date).AddSeconds(15)',
        'while ((Get-Date) -lt $deadline) {',
        '  Start-Sleep -Milliseconds 100',
        '  try {',
        '    $st = $p.PlaybackSession.PlaybackState',
        '    if ($st -eq [System.Windows.Media.MediaPlayerState]::Ended) { break }',
        '    if ($st -eq [System.Windows.Media.MediaPlayerState]::Stopped) { break }',
        '  } catch { break }',
        '}',
        '$p.Close()',
      ].join('; ')
      return ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script]
    },
  }
}

/**
 * Find a player for the current platform.
 *
 * Order matters: dedicated console players come first (fast, no window),
 * the Windows PowerShell fallback comes last because it is the slowest.
 */
function detectPlayer(): Player | undefined {
  const has = (cmd: string): boolean => which(cmd) !== undefined

  // Android / Termux — termux-media-player is the natural choice.
  if (process.platform === 'android') {
    if (has('termux-media-player')) {
      return {cmd: 'termux-media-player', args: file => ['--play', file]}
    }
    if (has('mpv')) return {cmd: 'mpv', args: (file, vol) => ['--no-video', '--really-quiet', `--volume=${vol}`, '--', file]}
    if (has('ffplay')) return {cmd: 'ffplay', args: (file, vol) => ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-volume', String(vol), file]}
    if (has('cmd')) return {cmd: 'cmd', args: file => ['player', 'play', file]}
    return undefined
  }

  // macOS — afplay ships with the OS.
  if (process.platform === 'darwin') {
    if (has('afplay')) return {cmd: 'afplay', args: (file, vol) => ['-v', (vol / 100).toFixed(2), file]}
    if (has('mpv')) return {cmd: 'mpv', args: (file, vol) => ['--no-video', '--really-quiet', `--volume=${vol}`, '--', file]}
    if (has('ffplay')) return {cmd: 'ffplay', args: (file, vol) => ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-volume', String(vol), file]}
    return undefined
  }

  // Windows
  if (process.platform === 'win32') {
    if (has('mpv')) return {cmd: 'mpv', args: (file, vol) => ['--no-video', '--really-quiet', `--volume=${vol}`, '--', file]}
    if (has('ffplay')) return {cmd: 'ffplay', args: (file, vol) => ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-volume', String(vol), file]}
    if (has('powershell') || has('pwsh')) return windowsPowerShellPlayer()
    return undefined
  }

  // Linux / BSD
  if (has('paplay')) return {cmd: 'paplay', args: (file, vol) => [`--volume=${Math.round((vol / 100) * 65536)}`, file]}
  if (has('mpv')) return {cmd: 'mpv', args: (file, vol) => ['--no-video', '--really-quiet', `--volume=${vol}`, '--', file]}
  if (has('ffplay')) return {cmd: 'ffplay', args: (file, vol) => ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-volume', String(vol), file]}
  if (has('mpg123')) return {cmd: 'mpg123', args: file => ['-q', file]}
  if (has('cvlc')) return {cmd: 'cvlc', args: (file, vol) => ['--intf', 'dummy', '--play-and-exit', `--gain=${(vol / 100).toFixed(2)}`, file]}
  if (has('gst-play-1.0')) return {cmd: 'gst-play-1.0', args: file => [file]}
  return undefined
}

/**
 * Play a notification sound.
 *
 * Never throws and never blocks — the player runs detached so Carbon keeps
 * full control of the terminal.
 */
export function playSound(kind: SoundKind): void {
  if (!soundEnabled) return
  if (soundVolume <= 0) return

  try {
    const player = detectPlayer()
    if (!player) return

    const dir = findSoundDir()
    if (!dir) return

    const file = path.join(dir, CLIP_FILES[kind])
    if (!fs.existsSync(file)) return

    const child = spawn(player.cmd, player.args(file, soundVolume), {
      stdio: 'ignore',
      detached: true,
    })
    // Ignore "player not found" / exit-code noise — notifications are optional.
    child.on('error', () => {})
    child.unref()
  } catch {
    // Notifications must never break the app.
  }
}
