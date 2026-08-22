import React, {createContext, type ReactNode, useContext} from 'react'

export const THEME_MODES = ['system', 'dark', 'light'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export type Theme = {
  mode: ThemeMode
  /** Accent / primary color. Undefined = terminal default. */
  primary?: string
  /** Secondary / muted text. */
  gray?: string
  /** Highlight for selections. */
  accent?: string
  /** Success color. */
  success?: string
  /** Error color. */
  danger?: string
  /** Warning color. */
  warning?: string
  /** Background hint for inverse elements. */
  background?: string
  dimSecondary: boolean
}

/** Carbon signature dark navy background. */
const CARBON_DARK_BG = '#1F2544'
/** Pure white background for light mode. */
const CARBON_LIGHT_BG = '#FFFFFF'

const darkTheme: Theme = {
  mode: 'dark',
  primary: '#e4e4e7',
  gray: '#a1a1aa',
  accent: '#22d3ee',
  success: '#4ade80',
  danger: '#f87171',
  warning: '#facc15',
  background: CARBON_DARK_BG,
  dimSecondary: false,
}

const lightTheme: Theme = {
  mode: 'light',
  primary: '#18181b',
  gray: '#52525b',
  accent: '#0e7490',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#b45309',
  background: CARBON_LIGHT_BG,
  dimSecondary: false,
}

/**
 * Detect whether the user's terminal / OS is using a light or dark appearance.
 *
 * Terminals rarely expose this directly, so we try a few common heuristics:
 *  1. `COLORFGBG` — set by many terminals as "fg;bg". A high background value
 *     (>= 8) usually means a light background.
 *  2. `TERMINAL_EMULATOR` / `TERM_PROGRAM` hints.
 *  3. Windows Terminal `WT_SESSION` — no reliable light/dark signal, so we
 *     fall back to dark (Carbon's signature look).
 */
function detectSystemIsLight(): boolean {
  const env = process.env

  // COLORFGBG="default;default" or "15;0" (fg;bg). bg index >= 8 → light bg.
  const colorfgbg = env.COLORFGBG
  if (colorfgbg) {
    const bg = colorfgbg.split(';').pop()
    const bgNum = Number.parseInt(bg ?? '', 10)
    if (Number.isFinite(bgNum)) return bgNum >= 8 && bgNum !== 8
  }

  // Some terminals set an explicit hint
  if (/light/i.test(env.TERMINAL_THEME ?? '') || /light/i.test(env.TERM_THEME ?? '')) return true
  if (/dark/i.test(env.TERMINAL_THEME ?? '') || /dark/i.test(env.TERM_THEME ?? '')) return false

  // Default: dark (Carbon signature look)
  return false
}

function systemTheme(): Theme {
  const light = detectSystemIsLight()
  return {...(light ? lightTheme : darkTheme), mode: 'system'}
}

const themes: Record<ThemeMode, () => Theme> = {
  system: systemTheme,
  dark: () => darkTheme,
  light: () => lightTheme,
}

const ThemeContext = createContext<Theme>(darkTheme)

export function themeFor(mode: ThemeMode): Theme {
  return themes[mode]()
}

export function ThemeProvider({mode, children}: {mode: ThemeMode; children: ReactNode}) {
  return React.createElement(ThemeContext.Provider, {value: themeFor(mode)}, children)
}

export function useTheme(): Theme {
  return useContext(ThemeContext)
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  return THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length]!
}