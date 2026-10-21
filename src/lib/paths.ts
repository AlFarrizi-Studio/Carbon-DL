/**
 * Filesystem locations used by Carbon.
 *
 * The download folder differs per platform:
 *  - Desktop (Windows / macOS / Linux) → `~/Downloads`
 *  - Android (Termux) → the phone's shared `Download` folder
 *    (`~/storage/downloads` → `/storage/emulated/0/Download`) when
 *    `termux-setup-storage` has been run, so the files show up in the Android
 *    gallery / file manager instead of being trapped inside Termux's private
 *    app folder.
 *
 * `CARBON_OUT_DIR` overrides the location on every platform.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {isAndroid, isWritableDir} from './termux.js'

/** Directory downloads are written to. */
export function resolveDownloadDir(): string {
  const override = process.env.CARBON_OUT_DIR?.trim()
  if (override) return path.resolve(override)

  const home = os.homedir()

  if (isAndroid()) {
    const shared = path.join(home, 'storage', 'downloads')
    if (isWritableDir(shared)) return shared
  }

  return path.join(home, 'Downloads')
}

/** Make sure the download folder exists (and return it). */
export function ensureDownloadDir(dir: string = resolveDownloadDir()): string {
  try {
    fs.mkdirSync(dir, {recursive: true})
  } catch {
    // Non-fatal — yt-dlp will report a clearer error if it really can't write.
  }
  return dir
}
