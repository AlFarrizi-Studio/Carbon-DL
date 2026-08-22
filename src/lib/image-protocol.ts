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
  if (!process.stdout.isTTY || !process.stdin.isTTY) return {}

  // Kitty graphics query: i=31 arbitrary id, a=q means "query".
  const kittyQuery = '\x1b_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1b\\'
  // Report character-cell size in pixels → response: CSI 6 ; height ; width t
  const cellQuery = '\x1b[16t'

  return new Promise<TerminalCaps>(resolve => {
    let resolved = false
    let buffer = ''
    let sawKittyReply = false
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

      // Once we have both answers there is no need to wait any longer.
      if (sawKittyReply && caps.cellPixelSize) finish()
    }

    const timer = setTimeout(finish, timeoutMs)

    try {
      if (process.stdin.setRawMode) process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onData)
      process.stdout.write(kittyQuery + cellQuery)
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
  if (cachedProtocol) return cachedProtocol

  const termProgram = (process.env.TERM_PROGRAM ?? '').toLowerCase()
  const lcTerminal = (process.env.LC_TERMINAL ?? '').toLowerCase()
  const term = (process.env.TERM ?? '').toLowerCase()

  // Kitty terminal — native graphics protocol
  if (
    termProgram === 'kitty' ||
    process.env.KITTY_WINDOW_ID !== undefined ||
    term.includes('kitty')
  ) {
    cachedProtocol = 'kitty'
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
    return cachedProtocol
  }

  // Sixel-capable terminals (mlterm, xterm with sixel, foot, RLogin)
  if (term.includes('sixel') || termProgram === 'foot' || termProgram === 'mlterm' || termProgram === 'rlogin') {
    cachedProtocol = 'sixel'
    return cachedProtocol
  }

  cachedProtocol = 'halfblock'
  return cachedProtocol
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