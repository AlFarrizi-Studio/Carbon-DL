import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Text, useStdout} from 'ink'
import type {ThumbGrid} from '../lib/thumbnail.js'
import {
  CPR_QUERY,
  attachCprListener,
  detectProtocol,
  iterm2Sequence,
  kittyDeleteById,
  kittyPlaceholderGrid,
  kittyTransmitQuiet,
  kittyVirtualPlacement,
  sixelSequence,
  subscribeCpr,
} from '../lib/image-protocol.js'

type ThumbnailProps = {
  grid: ThumbGrid
  /** PNG buffer for native terminal image protocols. */
  png?: Buffer
  /** Raw RGBA pixel data + dimensions for Sixel encoding. */
  rgba?: {data: Buffer; width: number; height: number}
  /** Width in terminal cells (used for native protocols). */
  cols: number
  /** Height in terminal rows (used for native protocols). */
  rows: number
}

/**
 * Render a thumbnail using the best available terminal image protocol.
 *
 * - Kitty / WezTerm: Kitty graphics protocol with UNICODE PLACEHOLDERS
 *   (U+10EEEE). The PNG is transmitted once *quietly* directly to stdout
 *   (bypassing Ink, so wrap-ansi can never corrupt the base64 payload),
 *   then displayed through plain placeholder text characters. Placeholders
 *   are ordinary text → Ink can redraw freely, the image never smears and
 *   stays crisp.
 * - Sixel (VSCode / Windows Terminal ≥1.22 / xterm): the raw DCS stream is
 *   written DIRECTLY to stdout, anchored to the exact cover cell via a CPR
 *   sentinel (CSI 6 n) rendered by Ink at the area's top-left. The terminal
 *   replies with that cell's absolute position; we move the cursor there and
 *   emit the stream — never through Ink, so it cannot be wrapped/corrupted.
 *   The half-block grid stays underneath as a visible fallback.
 * - iTerm2 / Mintty: iTerm2 inline images, re-emitted every render.
 * - Everything else: half-block characters (▀), 2 pixels per cell — always
 *   available since the grid is built unconditionally.
 */

// Kitty image ids live in the 256-colour id space (1..255) because the
// placeholder encodes the id in the foreground colour (38;5;id).
let nextImageId = 0

const DEBUG = process.env.CARBON_DEBUG === '1' || process.env.CARBON_DEBUG === 'true'
// Log the chosen renderer only once per protocol to avoid spamming on redraws.
let loggedRenderer: string | undefined
function logRenderer(protocol: string, hasPng: boolean, hasRgba: boolean, hasGrid: boolean): void {
  if (!DEBUG) return
  const key = `${protocol}|png=${hasPng}|rgba=${hasRgba}|grid=${hasGrid}`
  if (loggedRenderer === key) return
  loggedRenderer = key
  let renderer = 'halfblock-fallback'
  if (protocol === 'kitty' && hasPng) renderer = 'kitty-native(placeholder)'
  else if (protocol === 'iterm2' && hasPng) renderer = 'iterm2-native'
  else if (protocol === 'sixel' && hasRgba) renderer = 'sixel-native(cpr-anchored)'
  else if (protocol === 'kitty' || protocol === 'iterm2' || protocol === 'sixel') renderer = `${protocol}-DEGRADED(missing data)`
  process.stderr.write(`[image] renderer: ${renderer} (protocol=${protocol} png=${hasPng} rgba=${hasRgba} grid=${hasGrid})\n`)
}

// Cache encoded Sixel sequences keyed by the RGBA buffer. Sixel encoding is
// expensive, so we only do it once per image. Capped to keep memory bounded.
const MAX_SIXEL_CACHED = 12
const sixelCache = new Map<Buffer, string>()

export function Thumbnail({grid, png, rgba, cols, rows}: ThumbnailProps) {
  const {stdout} = useStdout()
  const protocol = detectProtocol()

  // Build the spacer that reserves the image area so surrounding layout is
  // correct while a native transmit is in flight / when falling back.
  const spacer = useMemo(() => {
    const lines: string[] = []
    for (let r = 0; r < rows; r++) {
      lines.push(' '.repeat(cols))
    }
    return lines.join('\n')
  }, [cols, rows])

  // --- Kitty placeholder path -------------------------------------------------
  const [kittyId, setKittyId] = useState<number | undefined>(undefined)
  const kittyPngRef = useRef<Buffer | undefined>(undefined)
  const kittyIdRef = useRef<number | undefined>(undefined)
  kittyIdRef.current = kittyId

  // Transmit + virtual placement: written DIRECTLY to stdout, outside Ink,
  // so the base64 payload is never wrapped/corrupted by wrap-ansi.
  useEffect(() => {
    if (protocol !== 'kitty' || !png || !stdout) return
    if (kittyPngRef.current === png) return
    const id = (nextImageId++ % 254) + 1 // id 1..254 (256-color id space)
    stdout.write(kittyTransmitQuiet(png, id) + kittyVirtualPlacement(id, cols, rows))
    kittyPngRef.current = png
    setKittyId(id)
  }, [protocol, png, cols, rows, stdout])

  // Unmount → delete the stored image; the placeholder text disappears with
  // Ink's next redraw. Only ever deletes this mount's own image id.
  useEffect(() => {
    return () => {
      const id = kittyIdRef.current
      if (protocol === 'kitty' && id !== undefined && stdout) stdout.write(kittyDeleteById(id))
      kittyPngRef.current = undefined
    }
  }, [protocol, stdout])

  // --- Sixel CPR-anchored path -------------------------------------------------
  // Sixel encoding is async — encode once and cache, then trigger a re-render.
  const [sixelSeq, setSixelSeq] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (protocol !== 'sixel' || !rgba) return
    const cached = sixelCache.get(rgba.data)
    if (cached !== undefined) {
      setSixelSeq(cached)
      return
    }
    let cancelled = false
    void sixelSequence(rgba.data, rgba.width, rgba.height).then(seq => {
      if (cancelled) return
      sixelCache.set(rgba.data, seq)
      if (sixelCache.size > MAX_SIXEL_CACHED) {
        const oldest = sixelCache.keys().next().value
        if (oldest !== undefined) sixelCache.delete(oldest)
      }
      setSixelSeq(seq)
    })
    return () => {
      cancelled = true
    }
  }, [protocol, rgba])

  // Anchor: the absolute terminal cell of the cover's top-left corner,
  // reported by the terminal in reply to the CPR sentinel rendered below.
  const [anchor, setAnchor] = useState<{row: number; col: number} | undefined>(undefined)
  useEffect(() => {
    if (protocol !== 'sixel') return
    attachCprListener()
    return subscribeCpr(setAnchor)
  }, [protocol])

  // Once the Sixel stream is ready AND the anchor is known → write it RAW to
  // stdout at the exact cover position. Bypasses Ink → no wrapping → no
  // corruption. The half-block grid rendered underneath stays as fallback in
  // case the terminal ignores the stream.
  useEffect(() => {
    if (protocol !== 'sixel' || !sixelSeq || !anchor || !stdout) return
    stdout.write(`\x1b[${anchor.row};${anchor.col}H${sixelSeq}`)
  }, [protocol, sixelSeq, anchor, stdout])

  logRenderer(protocol, Boolean(png), Boolean(rgba), grid.length > 0)

  if (protocol === 'kitty' && png) {
    // Placeholders are plain text → Ink can redraw freely; the image stays
    // crisp and anchored. Until the transmit completes, reserve the area.
    return <Text>{kittyId !== undefined ? kittyPlaceholderGrid(kittyId, cols, rows) : spacer}</Text>
  }

  if (protocol === 'iterm2' && png) {
    // Inline images are wiped on redraw, so re-emit every render.
    return <Text>{iterm2Sequence(png, cols) + spacer}</Text>
  }

  if (protocol === 'sixel') {
    // CPR sentinel (zero-width, recognised as ANSI by wrap-ansi) at the
    // top-left of the cover area → terminal replies with this cell's
    // position → the effect above paints the raw Sixel stream right here.
    // The grid underneath is the visible fallback.
    return (
      <Text>
        {CPR_QUERY}
        {grid.map((row, i) => (
          <Text key={i}>
            {row.map((cell, j) => (
              <Text key={j} color={cell.top} backgroundColor={cell.bottom}>
                ▀
              </Text>
            ))}
            {i < grid.length - 1 ? '\n' : ''}
          </Text>
        ))}
      </Text>
    )
  }

  // Half-block fallback (universal).
  return (
    <Text>
      {grid.map((row, i) => (
        <Text key={i}>
          {row.map((cell, j) => (
            <Text key={j} color={cell.top} backgroundColor={cell.bottom}>
              ▀
            </Text>
          ))}
          {i < grid.length - 1 ? '\n' : ''}
        </Text>
      ))}
    </Text>
  )
}