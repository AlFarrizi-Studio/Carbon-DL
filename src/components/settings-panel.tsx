import React, {useState} from 'react'
import {Box, Text, useInput} from 'ink'
import {useTheme, type ThemeMode} from '../theme.js'
import {useT} from '../lib/i18n.js'
import {playSound} from '../lib/sound.js'
import type {CarbonSettings} from '../lib/settings.js'
import {Panel} from './panel.js'
import {Gap} from './gap.js'

export type SettingsPanelProps = {
  settings: CarbonSettings
  onChange: (next: CarbonSettings) => void
  onClose: () => void
  onPickLanguage: () => void
  onClearHistory: () => void
  themeMode: ThemeMode
  onThemeMode: (mode: ThemeMode) => void
  /** Native name of the active language. */
  languageName: string
}

const THEME_CYCLE: ThemeMode[] = ['system', 'dark', 'light']
const VOLUME_STEP = 10

/**
 * Settings overlay, opened with CTRL+S.
 *
 * ↑↓ picks a row, ←→ (or ↵) changes the value of the picked row. Changes are
 * applied and persisted immediately.
 */
export function SettingsPanel({
  settings,
  onChange,
  onClose,
  onPickLanguage,
  onClearHistory,
  themeMode,
  onThemeMode,
  languageName,
}: SettingsPanelProps) {
  const theme = useTheme()
  const s = useT()
  const [row, setRow] = useState(0)

  const rows = [
    'theme',
    'sound',
    'volume',
    'language',
    'clearHistory',
  ] as const
  type Row = (typeof rows)[number]

  const apply = (next: Partial<CarbonSettings>): void => {
    onChange({...settings, ...next})
  }

  const changeTheme = (dir: number): void => {
    const idx = THEME_CYCLE.indexOf(themeMode)
    const next = THEME_CYCLE[(idx + dir + THEME_CYCLE.length) % THEME_CYCLE.length]!
    onThemeMode(next)
    apply({themeMode: next})
  }

  const changeVolume = (dir: number): void => {
    const next = Math.min(100, Math.max(0, settings.volume + dir * VOLUME_STEP))
    apply({volume: next})
    // Preview the new level so the user hears what they picked.
    playSound('success')
  }

  const changeSound = (): void => {
    const next = !settings.sound
    apply({sound: next})
    if (next) playSound('success')
  }

  useInput(
    (input, key) => {
      if (key.escape) {
        onClose()
        return
      }
      if (key.upArrow) {
        setRow(r => (r - 1 + rows.length) % rows.length)
        return
      }
      if (key.downArrow) {
        setRow(r => (r + 1) % rows.length)
        return
      }
      if (key.leftArrow || key.rightArrow || key.return) {
        const dir = key.leftArrow ? -1 : 1
        switch (rows[row]) {
          case 'theme':
            changeTheme(dir)
            break
          case 'sound':
            changeSound()
            break
          case 'volume':
            changeVolume(dir)
            break
          case 'language':
            onPickLanguage()
            break
          case 'clearHistory':
            onClearHistory()
            break
        }
        return
      }
      void input
    },
    {isActive: true},
  )

  const themeLabel = (mode: ThemeMode): string =>
    mode === 'system' ? s.theme ?? 'system' : mode

  const values: Record<Row, string> = {
    theme: themeLabel(themeMode),
    sound: settings.sound ? `✓ ${s.settingOn ?? 'on'}` : `✗ ${s.settingOff ?? 'off'}`,
    volume: `${settings.volume}%`,
    language: languageName,
    clearHistory: '↵',
  }

  const labels: Record<Row, string> = {
    theme: s.settingTheme ?? 'Theme',
    sound: s.settingSound ?? 'Notification sound',
    volume: s.settingVolume ?? 'Volume',
    language: s.settingLanguage ?? 'Language',
    clearHistory: s.settingClearHistory ?? 'Clear history',
  }

  return (
    <Box flexDirection="column" alignItems="center">
      <Panel title={s.settings ?? 'Settings'} width={54}>
        <Box flexDirection="column">
          {rows.map((r, i) => {
            const active = i === row
            return (
              <Box key={r} flexDirection="row" justifyContent="space-between">
                <Text color={active ? (theme.accent ?? theme.primary) : theme.primary} bold={active}>
                  {active ? '▶ ' : '  '}
                  {labels[r]}
                </Text>
                <Text color={active ? (theme.accent ?? theme.primary) : theme.gray} bold={active}>
                  {values[r]}
                </Text>
              </Box>
            )
          })}
        </Box>
        <Gap />
        <Text color={theme.gray} dimColor={theme.dimSecondary}>{s.settingsHint ?? '↑↓ select · ←→ change · esc close'}</Text>
      </Panel>
    </Box>
  )
}
