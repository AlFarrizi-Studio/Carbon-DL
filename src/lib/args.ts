import {isThemeMode, type ThemeMode} from '../theme.js'

export type ParsedArgs = {
  help: boolean
  version: boolean
  update: boolean
  uninstall: boolean
  force: boolean
  initialUrl?: string
  themeMode?: ThemeMode
  /** Whether notification sounds are enabled (default true). */
  sound: boolean
  /** True when --sound / --no-sound was passed explicitly. */
  soundExplicit: boolean
  /** Play the three notification clips and exit (for testing). */
  testSound: boolean
  error?: string
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {help: false, version: false, update: false, uninstall: false, force: false, sound: true, soundExplicit: false, testSound: false}
  const rest: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '-h' || arg === '--help') {
      result.help = true
    } else if (arg === '-v' || arg === '--version') {
      result.version = true
    } else if (arg === 'update') {
      result.update = true
    } else if (arg === 'uninstall') {
      result.uninstall = true
    } else if (arg === '--force' || arg === '-f') {
      result.force = true
    } else if (arg === '--test-sound' || arg === '--test-sounds') {
      result.testSound = true
    } else if (arg === '--no-sound' || arg === '--no-sounds') {
      result.sound = false
      result.soundExplicit = true
    } else if (arg === '--sound' || arg === '--sounds') {
      result.sound = true
      result.soundExplicit = true
    } else if (arg === '--theme') {
      const value = argv[++i]
      if (!value || value.startsWith('-')) {
        result.error = '--theme needs a value: system, dark, or light'
        return result
      }
      if (!isThemeMode(value)) {
        result.error = `unknown theme "${value}" — use system, dark, or light`
        return result
      }
      result.themeMode = value
    } else if (arg.startsWith('-') && arg !== '-') {
      result.error = `unknown option "${arg}"`
      return result
    } else {
      rest.push(arg)
    }
  }

  if (rest.length > 1) {
    result.error = 'only one url is supported'
    return result
  }
  result.initialUrl = rest[0]
  return result
}