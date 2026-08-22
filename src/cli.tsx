import React from 'react'
import {render} from 'ink'
import {App, type Outcome} from './app.js'
import {parseArgs} from './lib/args.js'
import {queryTerminal, setProtocol, setCellPixelSize} from './lib/image-protocol.js'
import {CURRENT_VERSION as VERSION} from './lib/update-check.js'

const HELP = `
  ◈ Carbon — grab any video or music. pick. download. done.

  Usage
    $ carbon [url]

  Examples
    $ carbon https://youtu.be/dQw4w9WgXcQ
    $ carbon https://tiktok.com/@user/video/123456
    $ carbon https://soundcloud.com/artist/track
    $ carbon                 (prompts for a url)

  Options
    --theme <mode>  use system, dark, or light for this run
    -h, --help      show this help
    -v, --version   show version

  Downloads are saved to ~/Downloads.
  Powered by yt-dlp — YouTube, TikTok, Instagram, X, SoundCloud & 1800+ sites.
`

const args = parseArgs(process.argv.slice(2))

if (args.error) {
  console.error(`carbon: ${args.error}\nTry "carbon --help" for usage.`)
  process.exit(1)
}

if (args.help) {
  console.log(HELP)
  process.exit(0)
}

if (args.version) {
  console.log(VERSION)
  process.exit(0)
}

const initialUrl = args.initialUrl
const initialThemeMode = args.themeMode ?? 'system'

const isTTY = Boolean(process.stdout.isTTY)

// Ink requires raw mode on stdin. Guard before rendering so we fail with a
// clear message instead of crashing when stdin is not an interactive terminal
// (e.g. piped input, some IDE terminals, CI environments).
if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  console.error(
    'carbon: interactive terminal required.\n' +
      'Carbon needs a real TTY terminal to run its UI.\n' +
      'Run it from a normal terminal (Windows Terminal, cmd, PowerShell, iTerm2, etc.).',
  )
  process.exit(1)
}

const enterAltScreen = () => process.stdout.write('\x1b[?1049h\x1b[H')
const leaveAltScreen = () => process.stdout.write('\x1b[?1049l')

// MovieBox-Tui-style: query the terminal for graphics capabilities BEFORE
// entering the alt screen / starting Ink. We learn (a) whether the Kitty
// protocol is supported and (b) the character-cell pixel size, so images
// can be rendered at the true display resolution instead of a tiny bitmap
// that the terminal upscales into a pixelated mess.
const DEBUG = process.env.CARBON_DEBUG === '1' || process.env.CARBON_DEBUG === 'true'
if (isTTY) {
  const caps = await queryTerminal(350)
  if (DEBUG) {
    process.stderr.write(`[image] queryTerminal: protocol=${caps.protocol ?? '(none)'} cell=${caps.cellPixelSize ? `${caps.cellPixelSize.width}x${caps.cellPixelSize.height}` : '(unknown)'}\n`)
  }
  if (caps.protocol) setProtocol(caps.protocol)
  if (caps.cellPixelSize) setCellPixelSize(caps.cellPixelSize)
}

if (isTTY) {
  enterAltScreen()
  process.on('exit', leaveAltScreen)
  for (const event of ['uncaughtException', 'unhandledRejection'] as const) {
    process.on(event, (error: unknown) => {
      leaveAltScreen()
      console.error(error)
      process.exit(1)
    })
  }
}

let outcome: Outcome = {}
const {waitUntilExit} = render(
  <App
    initialUrl={initialUrl}
    initialThemeMode={initialThemeMode}
    onOutcome={result => (outcome = result)}
  />,
)

await waitUntilExit()

if (isTTY) leaveAltScreen()
if (outcome.filepath) {
  console.log(`✓ grabbed → ${outcome.filepath}`)
}