import {getCellPixelSize, type ImageProtocol} from './image-protocol.js'

export type ThumbCell = {top: string; bottom: string}
export type ThumbGrid = ThumbCell[][]

export type ThumbResult = {
  /** Half-block grid — ALWAYS generated as the universal fallback, so the
   *  cover area is never blank even when a native path fails. */
  grid: ThumbGrid
  /** PNG buffer for native terminal image protocols (Kitty / iTerm2). */
  png?: Buffer
  /** Raw RGBA pixel data + dimensions for Sixel encoding. */
  rgba?: {data: Buffer; width: number; height: number}
}

/**
 * Maximum dimensions for native-protocol images. Kitty and iTerm2 scale the
 * image to the target cell area themselves (via c/r or width params), so we
 * send a high-resolution source and let the terminal downscale smoothly.
 * We only cap to avoid excessive memory/bandwidth on very large sources.
 */
const MAX_NATIVE_WIDTH = 1920
const MAX_NATIVE_HEIGHT = 1080

/**
 * Result cache keyed by url|cols|rows|protocol. The same artwork is shown in
 * several screens (wizard → downloading), and the Kitty path keys its
 * transmit-once optimisation on the Buffer instance — so reusing the exact
 * same ThumbResult across mounts avoids both a re-download and a re-transmit.
 * Only successful results are cached; failures/aborts stay retryable.
 */
const MAX_CACHED = 12
const thumbCache = new Map<string, ThumbResult>()

/**
 * Download an image and prepare it for terminal display.
 *
 *  - The half-block grid is ALWAYS built — it is the universal fallback and
 *    guarantees the cover area is never blank, even when a native protocol
 *    path fails or the terminal turns out not to support graphics.
 *  - kitty / iterm2 → additionally a high-resolution PNG (source is NOT
 *    downscaled to the display cell area; the terminal scales it into the
 *    placeholder/width target). Only capped at MAX_NATIVE_WIDTH/HEIGHT.
 *  - sixel → additionally raw RGBA at the true display pixel size. The Sixel
 *    stream is written directly to stdout by the renderer (CPR-anchored),
 *    never through Ink, so it cannot be corrupted by text wrapping. The
 *    grid stays underneath as a visible fallback.
 *
 * Returns undefined on any failure so the UI can simply skip the cover art.
 */
export async function fetchThumbnail(
  url: string,
  cols: number,
  rows: number,
  protocol: ImageProtocol,
  signal?: AbortSignal,
): Promise<ThumbResult | undefined> {
  const key = `${url}|${cols}|${rows}|${protocol}`
  const cached = thumbCache.get(key)
  if (cached) return cached

  try {
    const response = await fetch(url, {signal})
    if (!response.ok || !response.body) return undefined
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length === 0) return undefined

    const sharpMod = await import('sharp')
    const sharpFn = (sharpMod.default ?? sharpMod) as unknown as (input: Buffer) => import('sharp').Sharp

    // Grid is ALWAYS built — universal fallback, never blank.
    const grid = await buildGrid(sharpFn, buffer, cols, rows)

    let png: Buffer | undefined
    let rgba: {data: Buffer; width: number; height: number} | undefined
    if (protocol === 'kitty' || protocol === 'iterm2') {
      // Native protocols: send a high-resolution source. The terminal scales
      // it into the target cell rectangle (Kitty placeholders, iTerm2 width
      // param), which produces smoother results than pre-downscaling.
      png = await buildHighResPng(sharpFn, buffer)
    } else if (protocol === 'sixel') {
      // Sixel has no placement/scaling parameters — pixels map 1:1 to the
      // screen, so resize to the true display pixel size before encoding.
      rgba = await buildSixelRgba(sharpFn, buffer, cols, rows)
    }

    const result: ThumbResult = {grid, png, rgba}
    thumbCache.set(key, result)
    if (thumbCache.size > MAX_CACHED) {
      const oldest = thumbCache.keys().next().value
      if (oldest !== undefined) thumbCache.delete(oldest)
    }
    return result
  } catch {
    return undefined
  }
}

/** High-resolution PNG for Kitty / iTerm2 — passthrough, capped. */
async function buildHighResPng(
  sharpFn: (input: Buffer) => import('sharp').Sharp,
  buffer: Buffer,
): Promise<Buffer | undefined> {
  try {
    let pipeline = sharpFn(buffer)
    const meta = await pipeline.clone().metadata()
    const srcW = meta.width ?? 0
    const srcH = meta.height ?? 0
    // Only downscale when the source exceeds the cap; otherwise passthrough.
    if (srcW > MAX_NATIVE_WIDTH || srcH > MAX_NATIVE_HEIGHT) {
      pipeline = pipeline.resize(MAX_NATIVE_WIDTH, MAX_NATIVE_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3',
      })
    }
    return await pipeline.png({quality: 95}).toBuffer()
  } catch {
    return undefined
  }
}

/** Raw RGBA at the true display pixel size for Sixel encoding. */
async function buildSixelRgba(
  sharpFn: (input: Buffer) => import('sharp').Sharp,
  buffer: Buffer,
  cols: number,
  rows: number,
): Promise<{data: Buffer; width: number; height: number} | undefined> {
  try {
    const cell = getCellPixelSize()
    const targetWidth = Math.max(64, cols * cell.width)
    const targetHeight = Math.max(64, rows * cell.height)
    const {data, info} = await sharpFn(buffer)
      .resize(targetWidth, targetHeight, {fit: 'cover', kernel: 'lanczos3'})
      .ensureAlpha()
      .raw()
      .toBuffer({resolveWithObject: true})
    return {data, width: info.width, height: info.height}
  } catch {
    return undefined
  }
}

/** Half-block colour grid — 2 vertical pixels per terminal cell. */
async function buildGrid(
  sharpFn: (input: Buffer) => import('sharp').Sharp,
  buffer: Buffer,
  cols: number,
  rows: number,
): Promise<ThumbGrid> {
  const width = Math.max(1, cols)
  const height = Math.max(2, rows * 2)
  const {data, info} = await sharpFn(buffer)
    .resize(width, height, {fit: 'cover', kernel: 'lanczos3'})
    .sharpen({sigma: 0.8})
    .normalise()
    .removeAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})

  const channels = info.channels
  const grid: ThumbGrid = []
  for (let row = 0; row < rows; row++) {
    const line: ThumbCell[] = []
    for (let col = 0; col < cols; col++) {
      const topIdx = (row * 2 * info.width + col) * channels
      const botIdx = ((row * 2 + 1) * info.width + col) * channels
      line.push({top: toHex(data, topIdx), bottom: toHex(data, botIdx)})
    }
    grid.push(line)
  }
  return grid
}

function toHex(data: Buffer, idx: number): string {
  const r = data[idx] ?? 0
  const g = data[idx + 1] ?? 0
  const b = data[idx + 2] ?? 0
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}