import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Text, useStdout} from 'ink'
import type {ThumbGrid} from '../lib/thumbnail.js'
import {
  detectProtocol,
  iterm2Sequence,
  kittyClear,
  kittyDisplayById,
  kittySequence,
  sixelSequence,
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
 * - Kitty / WezTerm: Kitty graphics protocol. The image lives in the
 *   terminal's separate image layer, so it is NOT erased by Ink's
 *   full-screen redraws. We transmit the pixels once (with an image id),
 *   then only re-place it by id on subsequent renders — very cheap.
 * - iTerm2 / Mintty: iTerm2 inline images. These are inline with the text
 *   and get wiped on redraw, so the sequence is re-emitted every render.
 * - Everything else: half-block characters (▀), 2 pixels per cell.
 *
 * The escape sequence is emitted inline as zero-width text: Ink measures it
 * as width 0 (string-width strips ANSI codes) so layout is unaffected, while
 * the raw bytes pass straight through to the terminal.
 */

// Track which PNG buffers have already been transmitted to the terminal and
// the image id they were assigned. Keyed by the Buffer instance.
const transmittedIds = new Map<Buffer, number>()
let nextImageId = 1

// Cache encoded Sixel sequences keyed by the RGBA buffer. Sixel encoding is
// expensive, so we only do it once per image.
const sixelCache = new Map<Buffer, string>()

export function Thumbnail({grid, png, rgba, cols, rows}: ThumbnailProps) {
  const {stdout} = useStdout()
  const protocol = detectProtocol()

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
      setSixelSeq(seq)
    })
    return () => {
      cancelled = true
    }
  }, [protocol, rgba])

  // Build the spacer that reserves the image area so surrounding layout is
  // correct regardless of protocol.
  const spacer = useMemo(() => {
    const lines: string[] = []
    for (let r = 0; r < rows; r++) {
      lines.push(' '.repeat(cols))
    }
    return lines.join('\n')
  }, [cols, rows])

  // For Kitty, clear the image when the thumbnail unmounts so it doesn't
  // linger on screen after we navigate away.
  const kittyIdRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (protocol !== 'kitty') return
    return () => {
      if (kittyIdRef.current !== undefined && stdout) {
        stdout.write(kittyClear())
      }
    }
  }, [protocol, stdout])

  if (protocol === 'kitty' && png) {
    let sequence: string
    let id = transmittedIds.get(png)
    if (id === undefined) {
      id = nextImageId++
      transmittedIds.set(png, id)
      kittyIdRef.current = id
      // Transmit pixels + display at the current cursor position (top-left of
      // this text node) and register the image id.
      sequence = kittySequence(png, cols, rows, id)
    } else {
      kittyIdRef.current = id
      // Already loaded — just re-place it by id (tiny escape sequence).
      sequence = kittyDisplayById(id, cols, rows)
    }
    return <Text>{sequence + spacer}</Text>
  }

  if (protocol === 'iterm2' && png) {
    // Inline images are wiped on redraw, so re-emit every render.
    return <Text>{iterm2Sequence(png, cols) + spacer}</Text>
  }

  if (protocol === 'sixel' && sixelSeq) {
    // Sixel is inline — wiped on redraw, so re-emit the cached sequence.
    return <Text>{sixelSeq + spacer}</Text>
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