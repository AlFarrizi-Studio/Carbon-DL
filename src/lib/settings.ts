/**
 * Persisted user settings.
 *
 * Stored as JSON in `~/.config/carbon/settings.json` so the preferences
 * survive restarts and updates.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {THEME_MODES, type ThemeMode} from '../theme.js'

export type CarbonSettings = {
  /** Notification sounds on/off. */
  sound: boolean
  /** Notification volume, 0–100. */
  volume: number
  /** Colour theme. */
  themeMode: ThemeMode
  /** Preferred UI language (BCP-47-ish code). */
  language?: string
}

export const DEFAULT_SETTINGS: CarbonSettings = {
  sound: true,
  volume: 80,
  themeMode: 'system',
}

const SETTINGS_FILE = path.join(os.homedir(), '.config', 'carbon', 'settings.json')

function clampVolume(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.volume
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Read the settings file, falling back to the defaults for anything odd. */
export function loadSettings(): CarbonSettings {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as Partial<CarbonSettings>
    const themeMode = (THEME_MODES as readonly string[]).includes(raw.themeMode ?? '')
      ? (raw.themeMode as ThemeMode)
      : DEFAULT_SETTINGS.themeMode
    return {
      sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULT_SETTINGS.sound,
      volume: clampVolume(raw.volume),
      themeMode,
      language: typeof raw.language === 'string' && raw.language ? raw.language : undefined,
    }
  } catch {
    return {...DEFAULT_SETTINGS}
  }
}

/** Write the settings file. Silently ignores write errors. */
export function saveSettings(settings: CarbonSettings): void {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), {recursive: true})
    fs.writeFileSync(SETTINGS_FILE, `${JSON.stringify(settings, null, 2)}\n`)
  } catch {
    // settings are a nicety — never break the app over them
  }
}
