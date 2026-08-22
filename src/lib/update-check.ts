/**
 * GitHub update checker — fetches the latest release version from GitHub API
 * and compares it with the current installed version.
 */

const GITHUB_REPO = 'AlFarrizi-Studio/Carbon-DL'
const CURRENT_VERSION = '1.0.8-beta'

export type UpdateInfo = {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
}

/**
 * Compare semver strings. Returns true if `a` > `b`.
 * Handles pre-release suffixes (-beta, -alpha, -rc): a pre-release version
 * is considered older than the same version without a suffix.
 */
export function isNewerVersion(a: string, b: string): boolean {
  const parse = (v: string) => {
    const clean = v.replace(/^v/, '')
    const [core, pre] = clean.split('-', 2)
    const parts = (core ?? '').split('.').map(Number)
    return {parts, pre: pre ?? ''}
  }
  const va = parse(a)
  const vb = parse(b)
  for (let i = 0; i < 3; i++) {
    const na = va.parts[i] ?? 0
    const nb = vb.parts[i] ?? 0
    if (na > nb) return true
    if (na < nb) return false
  }
  // Same numeric version: release > pre-release
  if (va.pre && !vb.pre) return false
  if (!va.pre && vb.pre) return true
  return false
}

/**
 * Check GitHub for the latest release. Non-blocking; returns null on any failure.
 */
export async function checkForUpdate(signal?: AbortSignal): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'carbon-dl-update-checker',
      },
      signal: combinedSignal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = (await res.json()) as {tag_name?: string; html_url?: string}
    const latest = data.tag_name?.replace(/^v/, '') ?? ''
    if (!latest) return null

    return {
      hasUpdate: isNewerVersion(latest, CURRENT_VERSION),
      currentVersion: CURRENT_VERSION,
      latestVersion: latest,
      releaseUrl: data.html_url ?? `https://github.com/${GITHUB_REPO}/releases`,
    }
  } catch {
    return null
  }
}

export {CURRENT_VERSION}