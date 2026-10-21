/**
 * Android / Termux helpers.
 *
 * Termux runs a full Linux userland on top of the Android kernel, but it
 * links against Bionic (not glibc) and Node reports `process.platform` as
 * `"android"` there. The official yt-dlp / ffmpeg release binaries are
 * glibc-linked, so they cannot run on Android at all — Carbon has to fall
 * back to the packages Termux ships (`pkg install ffmpeg`,
 * `pip install yt-dlp`) and drive yt-dlp through its Python module.
 */

import {spawn, type ChildProcess} from 'node:child_process'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'

/** True when running on Android (Termux and any other Android Node build). */
export function isAndroid(): boolean {
  return process.platform === 'android'
}

/** True when running inside Termux (or a Termux-compatible environment). */
export function isTermux(): boolean {
  if (!isAndroid()) return false
  const prefix = process.env.PREFIX ?? ''
  return prefix.includes('com.termux') || prefix.includes('termux')
}

/** Termux's `$PREFIX` (e.g. /data/data/com.termux/files/usr), when set. */
export function termuxPrefix(): string | undefined {
  const prefix = process.env.PREFIX
  return prefix && prefix.length > 0 ? prefix : undefined
}

/** Locate an executable on `$PATH` (no shell involved). */
export function which(cmd: string): string | undefined {
  const pathEnv = process.env.PATH ?? ''
  const exts = process.platform === 'win32' ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : ['']
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue
    for (const ext of exts) {
      const full = path.join(dir, cmd + ext)
      try {
        fs.accessSync(full, fs.constants.X_OK)
        return full
      } catch {
        // not here — keep looking
      }
    }
  }
  return undefined
}

/** Whether a path exists and is a directory we can write into. */
export function isWritableDir(dir: string): boolean {
  try {
    if (!fs.statSync(dir).isDirectory()) return false
    fs.accessSync(dir, fs.constants.W_OK | fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

export type CommandResult = {
  code: number
  stdout: string
  stderr: string
}

/**
 * Run a command and capture its output. Never throws — a non-zero exit code
 * is reported through `code` so callers can branch on it.
 */
export function runCommand(
  cmd: string,
  args: string[],
  opts: {timeoutMs?: number} = {},
): Promise<CommandResult> {
  return new Promise<CommandResult>(resolve => {
    let child: ChildProcess
    try {
      child = spawn(cmd, args, {stdio: ['ignore', 'pipe', 'pipe']})
    } catch (err) {
      resolve({code: -1, stdout: '', stderr: err instanceof Error ? err.message : String(err)})
      return
    }

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (code: number): void => {
      if (settled) return
      settled = true
      resolve({code, stdout, stderr})
    }

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          child.kill('SIGKILL')
          finish(-1)
        }, opts.timeoutMs)
      : undefined

    child.stdout?.on('data', chunk => (stdout += chunk.toString()))
    child.stderr?.on('data', chunk => (stderr += chunk.toString()))
    child.on('error', err => {
      if (timer) clearTimeout(timer)
      stderr += err instanceof Error ? err.message : String(err)
      finish(-1)
    })
    child.on('close', code => {
      if (timer) clearTimeout(timer)
      finish(code ?? -1)
    })
  })
}

/** Whether Termux's `pkg` package manager is available. */
export async function hasPkg(): Promise<boolean> {
  if (!isTermux()) return false
  const prefix = termuxPrefix()
  if (prefix) {
    try {
      await fsPromises.access(path.join(prefix, 'bin', 'pkg'), fs.constants.X_OK)
      return true
    } catch {
      // fall through to PATH lookup
    }
  }
  return which('pkg') !== undefined
}

/**
 * Install Termux packages via `pkg install -y`.
 * Returns true when every package was installed successfully.
 */
export async function pkgInstall(packages: string[]): Promise<boolean> {
  if (packages.length === 0) return true
  const result = await runCommand('pkg', ['install', '-y', ...packages], {timeoutMs: 15 * 60_000})
  return result.code === 0
}

/** Absolute path of a Python 3 interpreter (Termux ships `python3`). */
export function findPython(): string | undefined {
  return which('python3') ?? which('python')
}

/** Whether a Python module can be imported by the given interpreter. */
export async function pythonHasModule(python: string, module: string): Promise<boolean> {
  const result = await runCommand(python, ['-c', `import ${module}`], {timeoutMs: 60_000})
  return result.code === 0
}

/**
 * Absolute path of a POSIX shell usable for shebangs on Android.
 *
 * Termux has no `/usr` at all, so `#!/usr/bin/env sh` cannot be used there.
 * Termux's own shell is preferred (it lives in the app's private prefix and is
 * always allowed by SELinux); `/system/bin/sh` is the last resort.
 */
export function shellPath(): string {
  const prefix = termuxPrefix()
  const candidates = [
    prefix ? path.join(prefix, 'bin', 'sh') : undefined,
    prefix ? path.join(prefix, 'bin', 'bash') : undefined,
    '/system/bin/sh',
    '/bin/sh',
  ].filter((c): c is string => Boolean(c))
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK)
      return candidate
    } catch {
      // try the next one
    }
  }
  return '/system/bin/sh'
}

/**
 * Write a `yt-dlp` shim that runs the Python module.
 *
 * The official yt-dlp release binaries are glibc-linked and cannot run on
 * Android, so we generate a tiny shell shim that forwards every argument to
 * `python -m yt_dlp`. The shim is also handy for the user: `~/.carbon/bin/yt-dlp`
 * behaves exactly like the real thing.
 */
export async function writeYtDlpShim(target: string, python: string): Promise<string> {
  const script = [
    `#!${shellPath()}`,
    '# yt-dlp shim for Android/Termux — generated by Carbon.',
    '# The official yt-dlp binaries are glibc-linked and cannot run on Android,',
    '# so the Python module is used instead.',
    `exec "${python}" -m yt_dlp "$@"`,
    '',
  ].join('\n')

  await fsPromises.mkdir(path.dirname(target), {recursive: true})
  await fsPromises.writeFile(target, script)
  await fsPromises.chmod(target, 0o755).catch(() => {})
  return target
}
