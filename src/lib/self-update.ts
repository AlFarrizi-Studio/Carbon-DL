/**
 * Self-updater — downloads the latest cli.js from GitHub and atomically
 * replaces the currently running file. Works on Windows, Linux and macOS.
 *
 * The installer ships a single dist/cli.js (no node_modules), so updating
 * is simply a matter of replacing that one file.
 */

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {CURRENT_VERSION, isNewerVersion} from './update-check.js'

const GITHUB_REPO = 'AlFarrizi-Studio/Carbon-DL'
const CLI_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/dist/cli.js`

export type SelfUpdateResult = {
  /** True when the operation completed without error (updated OR already up to date). */
  ok: boolean
  updated: boolean
  fromVersion: string
  toVersion?: string
  message: string
}

/**
 * Check GitHub for a newer release and, if available, replace the running
 * cli.js with the latest build. Set `force` to re-download even when the
 * versions match (useful for repairing a corrupted install).
 */
export async function selfUpdate(force = false): Promise<SelfUpdateResult> {
  // 1. Ask GitHub for the latest release tag.
  let latest = ''
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'carbon-dl-updater',
      },
    })
    if (!res.ok) {
      return {
        ok: false,
        updated: false,
        fromVersion: CURRENT_VERSION,
        message: `Could not check for updates (GitHub returned HTTP ${res.status}).`,
      }
    }
    const data = (await res.json()) as {tag_name?: string}
    latest = data.tag_name?.replace(/^v/, '') ?? ''
  } catch (err) {
    return {
      ok: false,
      updated: false,
      fromVersion: CURRENT_VERSION,
      message: `Could not reach GitHub: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  if (!latest) {
    return {ok: false, updated: false, fromVersion: CURRENT_VERSION, message: 'Could not determine the latest version.'}
  }

  if (!force && !isNewerVersion(latest, CURRENT_VERSION)) {
    return {
      ok: true,
      updated: false,
      fromVersion: CURRENT_VERSION,
      toVersion: latest,
      message: `Already up to date (v${CURRENT_VERSION}).`,
    }
  }

  // 2. Download the latest single-file build.
  let newCode: Buffer
  try {
    const cliRes = await fetch(CLI_URL, {
      headers: {'User-Agent': 'carbon-dl-updater'},
    })
    if (!cliRes.ok) {
      return {
        ok: false,
        updated: false,
        fromVersion: CURRENT_VERSION,
        message: `Failed to download the update (HTTP ${cliRes.status}).`,
      }
    }
    newCode = Buffer.from(await cliRes.arrayBuffer())
  } catch (err) {
    return {
      ok: false,
      updated: false,
      fromVersion: CURRENT_VERSION,
      message: `Failed to download the update: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // Sanity check — the bundle is always well over 1 KB and starts with the
  // node shebang injected by the bundler banner.
  if (newCode.length < 10_000 || !newCode.subarray(0, 64).toString('utf8').includes('#!/usr/bin/env node')) {
    return {
      ok: false,
      updated: false,
      fromVersion: CURRENT_VERSION,
      message: 'The downloaded update appears to be invalid. Please try again.',
    }
  }

  // 3. Locate the running cli.js and replace it atomically.
  const currentFile = process.argv[1] ? path.resolve(process.argv[1]) : fileURLToPath(import.meta.url)
  const targetDir = path.dirname(currentFile)
  const tmpFile = path.join(targetDir, `.cli.js.update-${process.pid}`)

  try {
    fs.writeFileSync(tmpFile, newCode, {mode: 0o755})
    try {
      // Atomic replace — works on all platforms because Node opens the script
      // with full share flags, so the running file can be renamed over.
      fs.renameSync(tmpFile, currentFile)
    } catch {
      // Fallback for exotic setups where rename across the running file fails.
      fs.copyFileSync(tmpFile, currentFile)
      fs.unlinkSync(tmpFile)
    }
  } catch (err) {
    try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
    return {
      ok: false,
      updated: false,
      fromVersion: CURRENT_VERSION,
      message:
        `Could not write the update to ${currentFile}: ${err instanceof Error ? err.message : String(err)}\n` +
        'Try running the installer again, or check that the install directory is writable.',
    }
  }

  return {
    ok: true,
    updated: true,
    fromVersion: CURRENT_VERSION,
    toVersion: latest,
    message: `Updated Carbon v${CURRENT_VERSION} → v${latest}. Run "carbon-dl" to use the new version.`,
  }
}