/**
 * GitHub update checker — fetches the latest release version from GitHub API
 * and compares it with the current installed version.
 */

const GITHUB_REPO = 'AlFarrizi-Studio/Carbon-DL'
const CURRENT_VERSION = '1.0.7'

export type UpdateInfo = {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
}

/**
 * Compare semver strings. Returns true if `a` > `b`.
 */
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na > nb) return true
    if (na < nb) return false
  }
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