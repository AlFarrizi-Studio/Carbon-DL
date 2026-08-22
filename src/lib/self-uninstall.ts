/**
 * Self-uninstaller — removes all Carbon files, PATH entries, and cached data.
 * Works on Windows, Linux and macOS.
 *
 * What gets removed:
 *  - Windows: %LOCALAPPDATA%\Carbon\ (cli.js, carbon-dl.cmd) + PATH entry
 *  - Linux/macOS: ~/.carbon/ (app/, bin/, node/) + PATH line in shell profile
 *  - All platforms: ~/.carbon/bin/ (yt-dlp, ffmpeg, ffprobe)
 *  - All platforms: ~/.config/carbon/ (history.json)
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execSync} from 'node:child_process'

export type UninstallResult = {
  ok: boolean
  removed: string[]
  message: string
}

function rmDir(dir: string): boolean {
  try {
    fs.rmSync(dir, {recursive: true, force: true})
    return true
  } catch {
    return false
  }
}

function rmFile(file: string): boolean {
  try {
    fs.unlinkSync(file)
    return true
  } catch {
    return false
  }
}

/** Remove Carbon's directory from the user PATH on Windows. */
function removeFromWindowsPath(installDir: string): boolean {
  try {
    // Read current user PATH via PowerShell
    const currentPath = execSync(
      'powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable(\'Path\', \'User\')"',
      {encoding: 'utf8', timeout: 10_000},
    ).trim()

    const normalizedDir = installDir.toLowerCase().replace(/[/\\]+$/, '')
    const parts = currentPath.split(';').filter(p => {
      const normalized = p.trim().toLowerCase().replace(/[/\\]+$/, '')
      return normalized !== normalizedDir && normalized !== ''
    })

    const newPath = parts.join(';')
    if (newPath !== currentPath) {
      execSync(
        `powershell -NoProfile -Command "[Environment]::SetEnvironmentVariable('Path', '${newPath.replace(/'/g, "''")}', 'User')"`,
        {encoding: 'utf8', timeout: 10_000},
      )
      return true
    }
    return false
  } catch {
    return false
  }
}

/** Remove Carbon's PATH line from shell profile on Linux/macOS. */
function removeFromShellProfile(): string[] {
  const removed: string[] = []
  const home = os.homedir()
  const profiles = ['.bashrc', '.zshrc', '.profile', '.bash_profile']

  for (const profile of profiles) {
    const profilePath = path.join(home, profile)
    try {
      if (!fs.existsSync(profilePath)) continue
      const content = fs.readFileSync(profilePath, 'utf8')
      // Remove lines added by Carbon installer
      const lines = content.split('\n')
      const filtered = lines.filter(line => {
        const trimmed = line.trim()
        return (
          !trimmed.includes('# Added by Carbon installer') &&
          !trimmed.includes('.carbon/bin') &&
          !trimmed.includes('.carbon/node/bin')
        )
      })
      if (filtered.length !== lines.length) {
        fs.writeFileSync(profilePath, filtered.join('\n'))
        removed.push(profilePath)
      }
    } catch {
      // ignore
    }
  }
  return removed
}

export async function selfUninstall(): Promise<UninstallResult> {
  const removed: string[] = []
  const home = os.homedir()
  const platform = process.platform

  // 1. Remove install directory
  if (platform === 'win32') {
    const installDir = path.join(process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local'), 'Carbon')
    if (fs.existsSync(installDir)) {
      if (rmDir(installDir)) removed.push(installDir)
    }
    // Remove from PATH
    if (removeFromWindowsPath(installDir)) {
      removed.push('PATH entry (User)')
    }
  } else {
    // Linux / macOS
    const carbonDir = path.join(home, '.carbon')
    if (fs.existsSync(carbonDir)) {
      if (rmDir(carbonDir)) removed.push(carbonDir)
    }
    // Remove PATH lines from shell profiles
    const profileChanges = removeFromShellProfile()
    removed.push(...profileChanges)
  }

  // 2. Remove cached binaries (yt-dlp, ffmpeg) — same location on all platforms
  const binDir = path.join(home, '.carbon', 'bin')
  if (fs.existsSync(binDir)) {
    if (rmDir(binDir)) removed.push(binDir)
  }

  // 3. Remove config/history
  const configDir = path.join(home, '.config', 'carbon')
  if (fs.existsSync(configDir)) {
    if (rmDir(configDir)) removed.push(configDir)
  }

  // 4. Remove debug log if exists
  const debugLog = path.join(os.tmpdir(), 'carbon-debug.log')
  if (fs.existsSync(debugLog)) {
    if (rmFile(debugLog)) removed.push(debugLog)
  }

  if (removed.length === 0) {
    return {
      ok: true,
      removed: [],
      message: 'Carbon was not found on this system. Nothing to remove.',
    }
  }

  return {
    ok: true,
    removed,
    message: `Carbon has been uninstalled. Removed:\n${removed.map(r => `  • ${r}`).join('\n')}`,
  }
}