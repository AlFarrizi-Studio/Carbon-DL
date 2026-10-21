import React from 'react'
import {Box, Text} from 'ink'

/** A blank spacer of `lines` terminal rows. */
export function Gap({lines = 1}: {lines?: number}) {
  return (
    <Box flexDirection="column" flexShrink={0}>
      {Array.from({length: lines}, (_, i) => (
        <Text key={i}> </Text>
      ))}
    </Box>
  )
}
