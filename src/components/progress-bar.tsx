import React from 'react'
import {Text} from 'ink'
import {useTheme} from '../theme.js'

/**
 * Carbon progress bar — uses ━ and ─ with a percentage badge.
 * Different visual from yoinks' █/░ blocks.
 */
export function ProgressBar({percent, width = 32}: {percent: number; width?: number}) {
  const theme = useTheme()
  const clamped = Math.max(0, Math.min(1, percent))
  const filled = Math.round(clamped * width)
  const pct = `${Math.round(clamped * 100)}%`.padStart(4)
  return (
    <Text>
      <Text color={theme.accent ?? theme.primary}>{'┃'}</Text>
      <Text color={theme.success ?? theme.primary} bold>{'━'.repeat(filled)}</Text>
      <Text color={theme.gray} dimColor={theme.dimSecondary}>{'─'.repeat(Math.max(0, width - filled))}</Text>
      <Text color={theme.accent ?? theme.primary}>{'┃'}</Text>
      <Text color={theme.primary}> {pct}</Text>
    </Text>
  )
}