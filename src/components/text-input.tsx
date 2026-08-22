import React, {useRef, useState} from 'react'
import {Text, useInput} from 'ink'
import {useTheme} from '../theme.js'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  width?: number
  history?: string[]
  submitOnPaste?: (value: string) => boolean
}

/**
 * Carbon text input — single-line editor with history recall and paste auto-submit.
 * Simpler than yoinks' version but covers the core needs.
 */
export function TextInput({value, onChange, onSubmit, placeholder = '', width = 40, history = [], submitOnPaste}: Props) {
  const theme = useTheme()
  const [cursorState, setCursorState] = useState(value.length)
  const [historyPos, setHistoryPos] = useState<number | null>(null)
  const draftRef = useRef('')

  const cursor = Math.min(cursorState, value.length)

  const edit = (next: string, position: number) => {
    setCursorState(Math.max(0, Math.min(next.length, position)))
    setHistoryPos(null)
    onChange(next)
  }

  const recall = (text: string) => {
    setCursorState(text.length)
    onChange(text)
  }

  useInput((input, key) => {
    if (key.return) {
      onSubmit?.(value)
      return
    }
    if (key.escape) return

    if (key.upArrow || key.downArrow) {
      if (history.length === 0) return
      if (key.upArrow) {
        if (historyPos === null) draftRef.current = value
        const next = historyPos === null ? 0 : Math.min(historyPos + 1, history.length - 1)
        if (next === historyPos) return
        setHistoryPos(next)
        recall(history[next]!)
      } else if (historyPos !== null) {
        const next = historyPos - 1
        setHistoryPos(next < 0 ? null : next)
        recall(next < 0 ? draftRef.current : history[next]!)
      }
      return
    }

    if (key.leftArrow) return setCursorState(Math.max(0, cursor - 1))
    if (key.rightArrow) return setCursorState(Math.min(value.length, cursor + 1))
    if (key.home || (key.ctrl && input === 'a')) return setCursorState(0)
    if (key.end || (key.ctrl && input === 'e')) return setCursorState(value.length)

    if (key.backspace) {
      if (cursor === 0) return
      edit(value.slice(0, cursor - 1) + value.slice(cursor), cursor - 1)
      return
    }
    if (key.delete) {
      if (cursor >= value.length) return
      edit(value.slice(0, cursor) + value.slice(cursor + 1), cursor)
      return
    }
    if (key.ctrl && input === 'u') {
      edit(value.slice(cursor), 0)
      return
    }
    if (key.ctrl && input === 'k') {
      edit(value.slice(0, cursor), cursor)
      return
    }

    if (!input || key.ctrl || key.meta) return
    // strip control chars and newlines from pasted text
    // eslint-disable-next-line no-control-regex
    const clean = input.replace(/[\x00-\x1f\x7f]/g, '')
    if (!clean) return
    const next = value.slice(0, cursor) + clean + value.slice(cursor)
    edit(next, cursor + clean.length)
    if (clean.length > 1 && value === '' && submitOnPaste?.(next.trim())) onSubmit?.(next)
  })

  // scroll window so cursor stays visible
  const span = Math.max(8, width)
  let offset = 0
  if (cursor > span - 1) offset = cursor - span + 1

  if (!value) {
    return (
      <Text>
        <Text inverse> </Text>
        <Text color={theme.gray} dimColor={theme.dimSecondary}>{placeholder.slice(0, span - 1)}</Text>
      </Text>
    )
  }

  const visible = value.slice(offset, offset + span)
  const cursorIndex = cursor - offset
  return (
    <Text>
      {Array.from(visible).map((ch, i) => (
        <Text key={i} color={theme.primary} inverse={i === cursorIndex}>
          {ch}
        </Text>
      ))}
      {cursorIndex >= visible.length && <Text inverse> </Text>}
    </Text>
  )
}
