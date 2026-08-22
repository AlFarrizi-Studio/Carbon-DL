/**
 * Terminal image protocol detection & encoding.
 *
 * MovieBox-Tui-style approach: use the terminal's native graphics protocol
 * (Kitty / iTerm2) when available so the *actual* image is rendered at full
 * resolution. Falls back to half-block characters otherwise.
 */

export type ImageProtocol = 'kitty' | 'iterm2' | 'sixel' | 'halfblock'

let cachedProtocol: ImageProtocol | undefined
let cellPixelSize: {width: number; height: number} | undefined
/** Track where the protocol decision came from (for debug logging). */
let protocolSource: string | undefined

const DEBUG = process.env.CARBON_DEBUG === '1' || process.env.CARBON_DEBUG === 'true'

function debugLog(msg: string): void {
  if (DEBUG) process.stderr.write(`[image] ${msg}\n`)
}

export type TerminalCaps = {
  protocol?: ImageProtocol
  cellPixelSize?: {width: number; height: number}
}

/**
 * Query the terminal for graphics capabilities BEFORE Ink takes over stdio.
 *
 * MovieBox-Tui / ratatui-image approach: instead of guessing from env vars,
 * send escape-sequence queries and read the terminal's responses:
 *
 *  1. Kitty graphics query  → does the terminal support the Kitty protocol?
 *  2. `CSI 16 t` (winops)    → character-cell size in pixels, so we can render
 *     images at the *true* display resolution instead of a tiny bitmap that
 *     the terminal then upscales into a pixelated mess.
 *
 * Must be called BEFORE Ink starts.
 */
export async function queryTerminal(timeoutMs = 350): Promise<TerminalCaps> {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    debugLog('queryTerminal: skipped (not a TTY)')
    return {}
  }

  debugLog(`queryTerminal: TERM=${process.env.TERM ?? '(unset)'} TERM_PROGRAM=${process.env.TERM_PROGRAM ?? '(unset)'} LC_TERMINAL=${process.env.LC_TERMINAL ?? '(unset)'} KITTY_WINDOW_ID=${process.env.KITTY_WINDOW_ID ?? '(unset)'}`)

  // Kitty graphics query: i=31 arbitrary id, a=q means "query".
  const kittyQuery = '\x1b_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1b\\'
  // Report character-cell size in pixels → response: CSI 6 ; height ; width t
  const cellQuery = '\x1b[16t'
  // Primary Device Attributes (DA1) → response CSI ? Pn ; … c. Parameter 4 in
  // the list means the terminal advertises Sixel support. Lets us pick the
  // native Sixel path on capable terminals that env-var heuristics miss.
  const da1Query = '\x1b[c'

  return new Promise<TerminalCaps>(resolve => {
    let resolved = false
    let buffer = ''
    let sawKittyReply = false
    let sawDa1Reply = false
    const caps: TerminalCaps = {}

    const cleanup = () => {
      process.stdin.removeListener('data', onData)
      process.stdin.pause()
      if (process.stdin.setRawMode) {
        try { process.stdin.setRawMode(false) } catch { /* ignore */ }
      }
    }

    const finish = () => {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      cleanup()
      debugLog(`queryTerminal result: protocol=${caps.protocol ?? '(none)'} cell=${caps.cellPixelSize ? `${caps.cellPixelSize.width}x${caps.cellPixelSize.height}` : '(unknown)'}`)
      resolve(caps)
    }

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString()

      // Kitty protocol reply: \x1b_Gi=31;OK\x1b\\ on success, else an error code.
      if (!sawKittyReply && buffer.includes('\x1b_Gi=31;')) {
        sawKittyReply = true
        if (buffer.includes('\x1b_Gi=31;OK')) caps.protocol = 'kitty'
      }

      // Cell pixel size reply: \x1b[6;{height};{width}t
      const cellMatch = /\x1b\[6;(\d+);(\d+)t/.exec(buffer)
      if (cellMatch && !caps.cellPixelSize) {
        const height = Number.parseInt(cellMatch[1]!, 10)
        const width = Number.parseInt(cellMatch[2]!, 10)
        if (width > 0 && height > 0) caps.cellPixelSize = {width, height}
      }

      // DA1 reply: \x1b[?{p1};{p2};…c — parameter 4 ⇒ Sixel capable.
      if (!sawDa1Reply) {
        const da1Match = /\x1b\[\?([\d;]+)c/.exec(buffer)
        if (da1Match) {
          sawDa1Reply = true
          const params = da1Match[1]!.split(';').map(p => Number.parseInt(p, 10))
          if (params.includes(4) && caps.protocol !== 'kitty') caps.protocol = 'sixel'
        }
      }

      // Once we have all the answers there is no need to wait any longer.
      if (sawKittyReply && sawDa1Reply && caps.cellPixelSize) finish()
    }

    const timer = setTimeout(finish, timeoutMs)

    try {
      if (process.stdin.setRawMode) process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onData)
      process.stdout.write(kittyQuery + cellQuery + da1Query)
    } catch {
      clearTimeout(timer)
      cleanup()
      resolve(caps)
    }
  })
}

/**
 * Set the protocol explicitly (from query result). Call before detectProtocol.
 */
export function setProtocol(protocol: ImageProtocol): void {
  cachedProtocol = protocol
  protocolSource = 'queryTerminal'
  debugLog(`setProtocol: ${protocol} (from terminal query)`)
}

/** Store the measured character-cell pixel size. */
export function setCellPixelSize(size: {width: number; height: number}): void {
  cellPixelSize = size
}

/**
 * Character-cell pixel size. Falls back to a sensible estimate (~10×20 px per
 * cell) when the terminal did not report it. Used to render images at the
 * true display resolution.
 */
export function getCellPixelSize(): {width: number; height: number} {
  return cellPixelSize ?? {width: 10, height: 20}
}

/** Detect the best image protocol the current terminal supports. */
export function detectProtocol(): ImageProtocol {
  if (cachedProtocol) {
    debugLog(`detectProtocol: cached=${cachedProtocol} (source: ${protocolSource ?? 'env'})`)
    return cachedProtocol
  }

  const termProgram = (process.env.TERM_PROGRAM ?? '').toLowerCase()
  const lcTerminal = (process.env.LC_TERMINAL ?? '').toLowerCase()
  const term = (process.env.TERM ?? '').toLowerCase()

  debugLog(`detectProtocol: env scan — TERM=${term || '(empty)'} TERM_PROGRAM=${termProgram || '(empty)'} LC_TERMINAL=${lcTerminal || '(empty)'} KITTY_WINDOW_ID=${process.env.KITTY_WINDOW_ID ?? '(unset)'}`)

  // Kitty terminal — native graphics protocol
  if (
    termProgram === 'kitty' ||
    process.env.KITTY_WINDOW_ID !== undefined ||
    term.includes('kitty')
  ) {
    cachedProtocol = 'kitty'
    protocolSource = 'env'
    debugLog('detectProtocol: → kitty (env)')
    return cachedProtocol
  }

  // iTerm2, Mintty — iTerm2 inline images
  // NOTE: VSCode integrated terminal does NOT support iTerm2 images reliably.
  if (
    termProgram === 'iterm.app' ||
    lcTerminal === 'iterm2' ||
    termProgram === 'mintty'
  ) {
    cachedProtocol = 'iterm2'
    protocolSource = 'env'
    debugLog('detectProtocol: → iterm2 (env)')
    return cachedProtocol
  }

  // WezTerm supports Kitty graphics protocol
  if (termProgram === 'wezterm') {
    cachedProtocol = 'kitty'
    protocolSource = 'env'
    debugLog('detectProtocol: → kitty (wezterm env)')
    return cachedProtocol
  }

  // Sixel-capable terminals (mlterm, xterm with sixel, foot, RLogin)
  if (term.includes('sixel') || termProgram === 'foot' || termProgram === 'mlterm' || termProgram === 'rlogin') {
    cachedProtocol = 'sixel'
    protocolSource = 'env'
    debugLog('detectProtocol: → sixel (env)')
    return cachedProtocol
  }

  // DO NOT cache halfblock — it's the fallback, not a detection result.
  // If setProtocol() is called later (e.g. from a deferred query), it should
  // override this. Caching halfblock would permanently lock out native paths.
  debugLog('detectProtocol: → halfblock (fallback, NOT cached)')
  return 'halfblock'
}

/**
 * Encode raw RGBA pixel data as a Sixel escape sequence.
 * Uses the `sixel` npm package for encoding.
 * @param rgba  Raw RGBA pixel buffer (width * height * 4 bytes)
 * @param width  Image width in pixels
 * @param height  Image height in pixels
 */
export async function sixelSequence(rgba: Buffer, width: number, height: number): Promise<string> {
  try {
    const sixelMod = await import('sixel')
    const encode = sixelMod.sixelEncode
    // PALETTE_ANSI_256 is a Uint32Array; convert to number[] for the type signature
    const palette = Array.from(sixelMod.PALETTE_ANSI_256)
    if (!encode) return ''
    return encode(new Uint8Array(rgba), width, height, palette)
  } catch {
    return ''
  }
}

/**
 * Encode a PNG buffer for the Kitty graphics protocol.
 * Large payloads are split into chunks of ≤4096 bytes.
 * @param imageId  Optional image ID so the image can be referenced later
 *                 without re-transmitting data.
 */
export function kittySequence(png: Buffer, cols: number, rows: number, imageId?: number): string {
  const b64 = png.toString('base64')
  const CHUNK = 4096
  const idParam = imageId !== undefined ? `,i=${imageId}` : ''
  const parts: string[] = []
  for (let i = 0; i < b64.length; i += CHUNK) {
    const chunk = b64.slice(i, i + CHUNK)
    const more = i + CHUNK < b64.length ? ',m=1' : ',m=0'
    if (i === 0) {
      // f=100 → PNG, a=T → transmit+display, c/r → grid size in cells.
      // Default z (0) draws the image ABOVE the text layer, so it stays
      // visible over the Box background color. Kitty/WezTerm keep the image
      // until it is explicitly deleted or scrolled out of view.
      parts.push(`\x1b_Gf=100,a=T,c=${cols},r=${rows}${idParam}${more};${chunk}\x1b\\`)
    } else {
      parts.push(`\x1b_G${more};${chunk}\x1b\\`)
    }
  }
  return parts.join('')
}

/**
 * Display a previously transmitted Kitty image by its ID.
 * Very lightweight — no data re-transmission.
 */
export function kittyDisplayById(imageId: number, cols: number, rows: number): string {
  return `\x1b_Ga=p,i=${imageId},c=${cols},r=${rows}\x1b\\`
}

/**
 * Encode a PNG buffer for the iTerm2 inline-image protocol.
 * Also works in WezTerm and Mintty.
 */
export function iterm2Sequence(png: Buffer, widthCells: number): string {
  const b64 = png.toString('base64')
  return `\x1b]1337;File=inline=1;size=${png.length};width=${widthCells};preserveAspectRatio=1:${b64}\x07`
}

/** Clear any previously displayed Kitty image. */
export function kittyClear(): string {
  return '\x1b_Ga=d\x1b\\'
}

/** Delete a single Kitty image by its id (frees the terminal's image slot).
 *  Used before re-placing so a stale frame never smears across a redraw. */
export function kittyDeleteById(imageId: number): string {
  return `\x1b_Ga=d,d=i,i=${imageId}\x1b\\`
}

// ---------------------------------------------------------------------------
// Kitty Unicode Placeholders (U+10EEEE)
//
// Ink (and any TUI framework that redraws the screen) wraps / diffs text via
// string-width + wrap-ansi. Raw Kitty APC payloads (long base64) are NOT
// recognised as ANSI, so they get wrapped, truncated and corrupted → the
// terminal ignores them → blank image area.
//
// The Unicode Placeholder mode solves this: the image is transmitted once
// *quietly* (a=t, q=2 — stored but NOT placed), then displayed through plain
// text characters U+10EEEE + diacritics (row/col) + foreground colour = image
// id. Because placeholders are ordinary text, Ink can wrap / diff / redraw
// freely — the image follows the text, never smears, and stays crisp because
// the terminal scales the high-res PNG into the placeholder area.
// ---------------------------------------------------------------------------

/** Row/column diacritics per Kitty's rowcolumn-diacritics.txt (0..28 is
 *  enough for cover grids ≤ 29×29 cells). */
const ROWCOL_DIACRITICS = [
  0x305, 0x30d, 0x30e, 0x310, 0x312, 0x334, 0x335, 0x336, 0x337, 0x338,
  0x35d, 0x35e, 0x35f, 0x360, 0x361, 0x362, 0x363, 0x364, 0x365, 0x366,
  0x367, 0x368, 0x369, 0x36a, 0x36b, 0x36c, 0x36d, 0x36e, 0x36f,
]

/** Transmit a PNG into the terminal's image storage WITHOUT displaying it
 *  (a=t, q=2). Written directly to stdout (not through Ink) so the base64
 *  payload is never wrapped/corrupted by wrap-ansi. */
export function kittyTransmitQuiet(png: Buffer, imageId: number): string {
  const b64 = png.toString('base64')
  const CHUNK = 4096
  const parts: string[] = []
  for (let i = 0; i < b64.length; i += CHUNK) {
    const chunk = b64.slice(i, i + CHUNK)
    const more = i + CHUNK < b64.length ? ',m=1' : ',m=0'
    parts.push(
      i === 0
        ? `\x1b_Ga=t,f=100,i=${imageId},q=2${more};${chunk}\x1b\\`
        : `\x1b_G${more};${chunk}\x1b\\`,
    )
  }
  return parts.join('')
}

/** Virtual placement: binds the stored image to a placeholder grid of
 *  cols × rows cells. Short & position-independent → safe to write directly
 *  to stdout. */
export function kittyVirtualPlacement(imageId: number, cols: number, rows: number): string {
  return `\x1b_Ga=p,U=1,i=${imageId},c=${cols},r=${rows},q=2\x1b\\`
}

/** Build the U+10EEEE placeholder text grid (1 char = 1 image cell,
 *  row-major). The image id is encoded in the foreground colour (38;5;id),
 *  row/col in diacritics. This is PLAIN TEXT: SGR is recognised by
 *  wrap-ansi, diacritics are width-0, PUA is width-1 → Ink layout stays
 *  stable and the sequence can never be corrupted. */
export function kittyPlaceholderGrid(imageId: number, cols: number, rows: number): string {
  const d = (n: number) => String.fromCodePoint(ROWCOL_DIACRITICS[Math.max(0, Math.min(n, ROWCOL_DIACRITICS.length - 1))]!)
  const lines: string[] = []
  for (let r = 0; r < rows; r++) {
    let line = `\x1b[38;5;${imageId}m`
    for (let c = 0; c < cols; c++) line += `\u{10EEEE}${d(r)}${d(c)}`
    line += '\x1b[39m'
    lines.push(line)
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// CPR (Cursor Position Report) anchoring for Sixel
//
// Inline Sixel streams (DCS … ST) are raw bytes that Ink's wrap-ansi does
// not recognise, so emitting them through <Text> corrupts the stream. The
// workaround: Ink renders a zero-width CPR sentinel (CSI 6 n) at the exact
// top-left cell of the cover area; the terminal replies with the cursor
// position of that cell; we then write the raw Sixel stream DIRECTLY to
// stdout at that absolute position (CSI row;col H), bypassing Ink entirely.
// ---------------------------------------------------------------------------

let cprAttached = false
const cprSubscribers = new Set<(pos: {row: number; col: number}) => void>()

/** Attach the global stdin listener for CPR replies (\x1b[{row};{col}R).
 *  Safe to call multiple times; the listener is only added once. */
export function attachCprListener(): void {
  if (cprAttached) return
  cprAttached = true
  process.stdin.on('data', (chunk: Buffer) => {
    const match = /\x1b\[(\d+);(\d+)R/.exec(chunk.toString())
    if (!match) return
    const pos = {row: Number.parseInt(match[1]!, 10), col: Number.parseInt(match[2]!, 10)}
    for (const fn of cprSubscribers) fn(pos)
  })
}

/** Subscribe to CPR replies. Returns an unsubscribe function. */
export function subscribeCpr(fn: (pos: {row: number; col: number}) => void): () => void {
  cprSubscribers.add(fn)
  return () => {
    cprSubscribers.delete(fn)
  }
}

/** Cursor Position Report query — zero-width CSI sequence, safe to emit
 *  through Ink (recognised as ANSI by wrap-ansi). */
export const CPR_QUERY = '\x1b[6n'
