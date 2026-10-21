import React from 'react'
import {render} from 'ink'
import {App, type Outcome} from './app.js'
import {parseArgs} from './lib/args.js'
import {queryTerminal, setProtocol, setCellPixelSize} from './lib/image-protocol.js'
import {resolveDownloadDir} from './lib/paths.js'
import {CURRENT_VERSION as VERSION, BUILD_ID} from './lib/update-check.js'
import {selfUpdate} from './lib/self-update.js'
import {selfUninstall} from './lib/self-uninstall.js'
import {playSound, setSoundEnabled, setSoundVolume, findSoundDir, type SoundKind} from './lib/sound.js'
import {loadSettings} from './lib/settings.js'

const HELP = `
  ◈ Carbon — grab any video or music. pick. download. done.

  Usage
    $ carbon [url]

  Examples
    $ carbon https://youtu.be/dQw4w9WgXcQ
    $ carbon https://tiktok.com/@user/video/123456
    $ carbon https://soundcloud.com/artist/track
    $ carbon                 (prompts for a url)

  Commands
    update          update Carbon to the latest version
    update --force  re-download even if already on the latest version
    uninstall       remove Carbon completely from this system

  Options
    --theme <mode>  use system, dark, or light for this run
    --no-sound      disable notification sounds
    --test-sound    play the notification clips and exit
    -h, --help      show this help
    -v, --version   show version

  Downloads are saved to ${resolveDownloadDir()}.
  Powered by yt-dlp — YouTube, TikTok, Instagram, X, SoundCloud & 1800+ sites.
`

const args = parseArgs(process.argv.slice(2))

// Notification sounds — precedence: CARBON_SOUND env var > CLI flag > saved
// setting. Volume always comes from the saved settings.
const saved = loadSettings()
const envSound = process.env.CARBON_SOUND
const soundOn = envSound !== undefined
  ? envSound !== '0' && envSound.toLowerCase() !== 'false' && envSound.toLowerCase() !== 'off'
  : args.soundExplicit
    ? args.sound
    : saved.sound
setSoundEnabled(soundOn)
setSoundVolume(saved.volume)

if (args.error) {
  console.error(`carbon: ${args.error}\nTry "carbon --help" for usage.`)
  process.exit(1)
}

if (args.help) {
  console.log(HELP)
  process.exit(0)
}

if (args.version) {
  console.log(`${VERSION}  (build ${BUILD_ID})`)
  process.exit(0)
}

// Self-update: `carbon-dl update [--force]`. Runs outside the TUI so it works
// in any terminal and never needs raw mode.
if (args.testSound) {
  // Smoke test for the notification clips: success → update → error.
  const dir = findSoundDir()
  console.log(dir ? `Sound folder: ${dir}` : 'Sound folder not found — run the installer to download the clips.')
  console.log(args.sound ? 'Notifications: ON' : 'Notifications: MUTED (--no-sound / CARBON_SOUND=0)')
  const clips: Array<[SoundKind, number]> = [
    ['success', 0],
    ['update', 2200],
    ['error', 3600],
  ]
  for (const [kind, delay] of clips) {
    setTimeout(() => {
      console.log(`  ▶ ${kind}`)
      playSound(kind)
    }, delay)
  }
  await new Promise(resolve => setTimeout(resolve, 6000))
  console.log('Done.')
  process.exitCode = 0
} else if (args.update) {
  console.log(`Carbon v${VERSION} — checking for updates...`)
  const result = await selfUpdate(args.force)
  console.log(result.updated ? `✓ ${result.message}` : result.message)
  playSound(result.ok ? 'success' : 'error')
  // Use exitCode (not process.exit) so pending sockets from the update fetch
  // can close cleanly — process.exit while handles are open triggers a libuv
  // assertion crash on Windows. The process exits once the loop drains.
  process.exitCode = result.ok ? 0 : 1
} else if (args.uninstall) {
  console.log(`Carbon v${VERSION} — uninstalling...`)
  const result = await selfUninstall()
  console.log(result.message)
  playSound(result.ok ? 'success' : 'error')
  process.exitCode = result.ok ? 0 : 1
} else {
  await runTui()
}

async function runTui(): Promise<void> {
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
}