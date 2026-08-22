import React from 'react'
import {Box, Text} from 'ink'
import {useTheme} from '../theme.js'

// Carbon logo — clean block style, different from yoinks
const LOGO_LINES = [
  ' ██████╗ █████╗ ██████╗ ██████╗  ██████╗ ███╗   ██╗',
  '██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔═══██╗████╗  ██║',
  '██║     ███████║██████╔╝██████╔╝██║   ██║██╔██╗ ██║',
  '██║     ██╔══██║██╔══██╗██╔══██╗██║   ██║██║╚██╗██║',
  '╚██████╗██║  ██║██║  ██║██████╔╝╚██████╔╝██║ ╚████║',
  ' ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═══╝',
]

export function Logo() {
  const theme = useTheme()
  return (
    <Box flexDirection="column" flexShrink={0} alignItems="center">
      {LOGO_LINES.map((line, i) => (
        <Text key={i} color={theme.accent ?? theme.primary} bold>
          {line}
        </Text>
      ))}
    </Box>
  )
}

export function LogoCompact() {
  const theme = useTheme()
  return (
    <Text color={theme.accent ?? theme.primary} bold>◈ CARBON</Text>
  )
}
