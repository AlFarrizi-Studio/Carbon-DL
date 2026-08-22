import React, {type ReactNode} from 'react'
import {Box, Text} from 'ink'
import {useTheme} from '../theme.js'

/**
 * Bottom hint bar — key → label pairs, Carbon style with ┆ separators.
 */
export function Shortcuts({items, leading}: {items: Array<[string, string]>; leading?: ReactNode}) {
  const theme = useTheme()
  return (
    <Box flexShrink={0}>
      {leading ? (
        <Box marginRight={2}>{leading}</Box>
      ) : null}
      {items.map(([key, label], i) => (
        <Box key={`${key}-${i}`} marginRight={i < items.length - 1 ? 2 : 0}>
          <Text color={theme.accent ?? theme.primary} bold>
            {key}
          </Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}> {label}</Text>
        </Box>
      ))}
    </Box>
  )
}