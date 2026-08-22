import React, {type ReactNode} from 'react'
import {Box, Text} from 'ink'
import {useTheme} from '../theme.js'

/**
 * Carbon panel — double-line border with title embedded on top.
 * Visually distinct from yoinks' rounded single border.
 */
export function Panel({title, width, children}: {title: string; width: number; children: ReactNode}) {
  const theme = useTheme()
  const titleText = ` ${title} `
  // Header must span the full box width: ╔═ + title + ═… + ╗
  const tail = Math.max(0, width - titleText.length - 3)
  return (
    <Box flexDirection="column" width={width}>
      <Text>
        <Text color={theme.accent ?? theme.primary}>{'╔═'}</Text>
        <Text color={theme.primary} bold>{titleText}</Text>
        <Text color={theme.accent ?? theme.primary}>{'═'.repeat(tail)}╗</Text>
      </Text>
      <Box
        width={width}
        borderStyle="double"
        borderColor={theme.accent ?? theme.gray}
        borderTop={false}
        flexDirection="column"
        paddingX={1}
      >
        {children}
      </Box>
    </Box>
  )
}

/** Simple bordered box without title. */
export function Frame({width, children}: {width?: number; children: ReactNode}) {
  const theme = useTheme()
  return (
    <Box
      width={width}
      borderStyle="double"
      borderColor={theme.accent ?? theme.gray}
      flexDirection="column"
      paddingX={1}
    >
      {children}
    </Box>
  )
}