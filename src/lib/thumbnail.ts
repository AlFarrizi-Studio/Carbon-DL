import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {getCellPixelSize, type ImageProtocol} from './image-protocol.js'

const DEBUG = process.env.CARBON_DEBUG === '1' || process.env.CARBON_DEBUG === 'true'
const DEBUG_LOG = path.join(os.tmpdir(), 'carbon-debug.log')

function debugLog(msg: string): void {
  if (!DEBUG) return
  const line = `[thumb] ${new Date().toISOString()} ${msg}\n`
  process.stderr.write(line)
  try { fs.appendFileSync(DEBUG_LOG, line) } catch { /* ignore */ }
}

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

/* --------------------------------------------------------------------------
 * Imaging backend abstraction.
 *
 * sharp is a native module and is marked `external` in the bundler, so it is
 * NOT available in the single-file installed build (the installer only ships
 * dist/cli.js, no node_modules). To guarantee thumbnails always render, we
 * try sharp first (fast, high quality) and transparently fall back to jimp,
 * a pure-JS decoder/resizer that bundles into cli.js.
 * ------------------------------------------------------------------------ */

type SharpFn = (input: Buffer) => import('sharp').Sharp

let sharpPromise: Promise<SharpFn | undefined> | undefined
function loadSharp(): Promise<SharpFn | undefined> {
  if (!sharpPromise) {
    sharpPromise = import('sharp')
      .then(mod => (mod.default ?? mod) as unknown as SharpFn)
      .catch(() => {
        debugLog('sharp unavailable — using pure-JS (jimp) backend')
        return undefined
      })
  }
  return sharpPromise
}

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
  /** Center-crop the artwork to a 1:1 square before rendering. Used for
   *  Audio mode with complete music metadata so the cover looks like a real
   *  square album cover instead of a 16:9 video frame. */
  square = false,
): Promise<ThumbResult | undefined> {
  const key = `${url}|${cols}|${rows}|${protocol}|sq=${square ? 1 : 0}`
  const cached = thumbCache.get(key)
  if (cached) return cached

  debugLog(`fetchThumbnail: url=${url} cols=${cols} rows=${rows} protocol=${protocol} square=${square}`)
  try {
    const response = await fetch(url, {signal})
    if (!response.ok || !response.body) {
      debugLog(`fetchThumbnail: fetch failed — status=${response.status}`)
      return undefined
    }
    let buffer: Buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length === 0) {
      debugLog('fetchThumbnail: empty response body')
      return undefined
    }
    debugLog(`fetchThumbnail: downloaded ${buffer.length} bytes`)

    // Audio-mode album art → center-crop the source to a square first so every
    // render path (grid / png / rgba) starts from a 1:1 image.
    if (square) {
      buffer = await cropSquare(buffer)
      debugLog(`fetchThumbnail: cropped to square (${buffer.length} bytes)`)
    }

    // Grid is ALWAYS built — universal fallback, never blank.
    const grid = await buildGrid(buffer, cols, rows)
    debugLog(`fetchThumbnail: grid built ${grid.length} rows`)

    let png: Buffer | undefined
    let rgba: {data: Buffer; width: number; height: number} | undefined
    if (protocol === 'kitty' || protocol === 'iterm2') {
      png = await buildHighResPng(buffer)
      debugLog(`fetchThumbnail: png=${png ? `${png.length} bytes` : 'FAILED'}`)
    } else if (protocol === 'sixel') {
      rgba = await buildSixelRgba(buffer, cols, rows)
      debugLog(`fetchThumbnail: rgba=${rgba ? `${rgba.width}x${rgba.height}` : 'FAILED'}`)
    }

    const result: ThumbResult = {grid, png, rgba}
    thumbCache.set(key, result)
    if (thumbCache.size > MAX_CACHED) {
      const oldest = thumbCache.keys().next().value
      if (oldest !== undefined) thumbCache.delete(oldest)
    }
    return result
  } catch (err) {
    debugLog(`fetchThumbnail: ERROR — ${err instanceof Error ? err.message : String(err)}`)
    return undefined
  }
}

/* ---------------------------- square crop ------------------------------ */

/** Center-crop an image buffer to a 1:1 square.
 *  Tries sharp first, falls back to jimp. On total failure the original
 *  buffer is returned unchanged (cover still renders, just not cropped). */
async function cropSquare(buffer: Buffer): Promise<Buffer> {
  const sharpFn = await loadSharp()
  if (sharpFn) {
    try {
      const meta = await sharpFn(buffer).metadata()
      const w = meta.width ?? 0
      const h = meta.height ?? 0
      if (w > 0 && h > 0 && w !== h) {
        const side = Math.min(w, h)
        const left = Math.floor((w - side) / 2)
        const top = Math.floor((h - side) / 2)
        return await sharpFn(buffer)
          .extract({left, top, width: side, height: side})
          .toBuffer()
      }
      return buffer
    } catch (err) {
      debugLog(`cropSquare: sharp failed (${err instanceof Error ? err.message : String(err)}), trying jimp`)
    }
  }
  try {
    const {Jimp} = await import('jimp')
    const image = await Jimp.read(buffer)
    const w = image.width
    const h = image.height
    if (w > 0 && h > 0 && w !== h) {
      const side = Math.min(w, h)
      const x = Math.floor((w - side) / 2)
      const y = Math.floor((h - side) / 2)
      image.crop({x, y, w: side, h: side})
      return await image.getBuffer('image/png')
    }
    return buffer
  } catch (err) {
    debugLog(`cropSquare: jimp failed (${err instanceof Error ? err.message : String(err)})`)
    return buffer
  }
}

/* ------------------------------- grid ---------------------------------- */

async function buildGrid(buffer: Buffer, cols: number, rows: number): Promise<ThumbGrid> {
  const sharpFn = await loadSharp()
  if (sharpFn) {
    try {
      return await buildGridSharp(sharpFn, buffer, cols, rows)
    } catch (err) {
      debugLog(`buildGrid: sharp failed (${err instanceof Error ? err.message : String(err)}), trying jimp`)
    }
  }
  return buildGridJimp(buffer, cols, rows)
}

/** Half-block colour grid via sharp — 2 vertical pixels per terminal cell. */
async function buildGridSharp(
  sharpFn: SharpFn,
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

/** Half-block colour grid via jimp (pure JS fallback). */
async function buildGridJimp(buffer: Buffer, cols: number, rows: number): Promise<ThumbGrid> {
  const {Jimp} = await import('jimp')
  const width = Math.max(1, cols)
  const height = Math.max(2, rows * 2)
  const image = await Jimp.read(buffer)
  image.cover({w: width, h: height})

  const grid: ThumbGrid = []
  for (let row = 0; row < rows; row++) {
    const line: ThumbCell[] = []
    for (let col = 0; col < cols; col++) {
      const topC = image.getPixelColor(col, row * 2)
      const botC = image.getPixelColor(col, row * 2 + 1)
      line.push({top: intToHex(topC), bottom: intToHex(botC)})
    }
    grid.push(line)
  }
  return grid
}

/* --------------------------- high-res PNG ------------------------------ */

async function buildHighResPng(buffer: Buffer): Promise<Buffer | undefined> {
  const sharpFn = await loadSharp()
  if (sharpFn) {
    try {
      return await buildHighResPngSharp(sharpFn, buffer)
    } catch (err) {
      debugLog(`buildHighResPng: sharp failed (${err instanceof Error ? err.message : String(err)}), trying jimp`)
    }
  }
  return buildHighResPngJimp(buffer)
}

/** High-resolution PNG for Kitty / iTerm2 via sharp — passthrough, capped. */
async function buildHighResPngSharp(sharpFn: SharpFn, buffer: Buffer): Promise<Buffer | undefined> {
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
}

/** High-resolution PNG for Kitty / iTerm2 via jimp (pure JS fallback). */
async function buildHighResPngJimp(buffer: Buffer): Promise<Buffer | undefined> {
  try {
    const {Jimp} = await import('jimp')
    const image = await Jimp.read(buffer)
    if (image.width > MAX_NATIVE_WIDTH || image.height > MAX_NATIVE_HEIGHT) {
      image.scaleToFit({w: MAX_NATIVE_WIDTH, h: MAX_NATIVE_HEIGHT})
    }
    return await image.getBuffer('image/png')
  } catch (err) {
    debugLog(`buildHighResPngJimp: ERROR — ${err instanceof Error ? err.message : String(err)}`)
    return undefined
  }
}

/* ---------------------------- sixel RGBA ------------------------------- */

async function buildSixelRgba(
  buffer: Buffer,
  cols: number,
  rows: number,
): Promise<{data: Buffer; width: number; height: number} | undefined> {
  const sharpFn = await loadSharp()
  if (sharpFn) {
    try {
      return await buildSixelRgbaSharp(sharpFn, buffer, cols, rows)
    } catch (err) {
      debugLog(`buildSixelRgba: sharp failed (${err instanceof Error ? err.message : String(err)}), trying jimp`)
    }
  }
  return buildSixelRgbaJimp(buffer, cols, rows)
}

/** Raw RGBA at the true display pixel size for Sixel encoding via sharp. */
async function buildSixelRgbaSharp(
  sharpFn: SharpFn,
  buffer: Buffer,
  cols: number,
  rows: number,
): Promise<{data: Buffer; width: number; height: number} | undefined> {
  const cell = getCellPixelSize()
  const targetWidth = Math.max(64, cols * cell.width)
  const targetHeight = Math.max(64, rows * cell.height)
  const {data, info} = await sharpFn(buffer)
    .resize(targetWidth, targetHeight, {fit: 'cover', kernel: 'lanczos3'})
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})
  return {data, width: info.width, height: info.height}
}

/** Raw RGBA at the true display pixel size for Sixel encoding via jimp. */
async function buildSixelRgbaJimp(
  buffer: Buffer,
  cols: number,
  rows: number,
): Promise<{data: Buffer; width: number; height: number} | undefined> {
  try {
    const {Jimp} = await import('jimp')
    const cell = getCellPixelSize()
    const targetWidth = Math.max(64, cols * cell.width)
    const targetHeight = Math.max(64, rows * cell.height)
    const image = await Jimp.read(buffer)
    image.cover({w: targetWidth, h: targetHeight})
    const w = image.width
    const h = image.height
    const data = Buffer.alloc(w * h * 4)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = image.getPixelColor(x, y)
        const idx = (y * w + x) * 4
        data[idx] = (c >>> 24) & 0xff
        data[idx + 1] = (c >>> 16) & 0xff
        data[idx + 2] = (c >>> 8) & 0xff
        data[idx + 3] = c & 0xff
      }
    }
    return {data, width: w, height: h}
  } catch (err) {
    debugLog(`buildSixelRgbaJimp: ERROR — ${err instanceof Error ? err.message : String(err)}`)
    return undefined
  }
}

/* ------------------------------ helpers -------------------------------- */

function toHex(data: Buffer, idx: number): string {
  const r = data[idx] ?? 0
  const g = data[idx + 1] ?? 0
  const b = data[idx + 2] ?? 0
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** Convert a jimp RGBA pixel int (0xRRGGBBAA) to a #rrggbb hex string. */
function intToHex(c: number): string {
  const r = (c >>> 24) & 0xff
  const g = (c >>> 16) & 0xff
  const b = (c >>> 8) & 0xff
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}