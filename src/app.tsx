import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import os from 'node:os'
import path from 'node:path'
import {Box, Text, useApp, useInput, useStdout} from 'ink'
import SelectInput, {type IndicatorProps, type ItemProps} from 'ink-select-input'
import Spinner from 'ink-spinner'
import {Logo} from './components/logo.js'
import {Panel} from './components/panel.js'
import {Shortcuts} from './components/shortcuts.js'
import {TextInput} from './components/text-input.js'
import {formatBytes, formatDuration, formatEta, formatSpeed, shortenPath, truncate, wrapText} from './lib/format.js'
import {AUDIO_FORMATS, FPS_OPTIONS, RESOLUTIONS, VIDEO_FORMATS, bitrateItems, fmtDesc, hasBitrateOptions, type AudioFormat, type VideoFormat} from './lib/formats.js'
import {addToHistory, loadHistory} from './lib/history.js'
import {detectPlatform, isProbablyUrl, type Platform} from './lib/platforms.js'
import {nextThemeMode, ThemeProvider, type ThemeMode, useTheme} from './theme.js'
import {getLanguage, languageDisplayName, setLanguage, supportedLanguages, t, useT} from './lib/i18n.js'
import {nextTip, randomTip, TIP_INTERVAL_MS} from './lib/tips.js'
import {checkForUpdate, type UpdateInfo} from './lib/update-check.js'
import {
  thumbnailCandidates,
  buildAudioArgs,
  buildVideoArgs,
  download,
  embedSquareCover,
  ensureYtDlp,
  ensureFfmpeg,
  hasAudio,
  hasCompleteMusicMeta,
  maxHeight,
  probe,
  artistOf,
  formatReleaseDate,
  type DownloadChoice,
  type DownloadProgress,
  type ThumbnailInfo,
  type VideoInfo,
} from './lib/ytdlp.js'
import {Thumbnail} from './components/thumbnail.js'
import {fetchThumbnail, type ThumbResult} from './lib/thumbnail.js'
import {detectProtocol, getCellPixelSize} from './lib/image-protocol.js'
import fs from 'node:fs'

const OUT_DIR = path.join(os.homedir(), 'Downloads')

const DEBUG = process.env.CARBON_DEBUG === '1' || process.env.CARBON_DEBUG === 'true'
const DEBUG_LOG = path.join(os.tmpdir(), 'carbon-debug.log')
function debugLog(msg: string): void {
  if (!DEBUG) return
  const line = `[app] ${new Date().toISOString()} ${msg}\n`
  process.stderr.write(line)
  try { fs.appendFileSync(DEBUG_LOG, line) } catch { /* ignore */ }
}

function UpdateBadge({info}: {info: UpdateInfo | null}) {
  const theme = useTheme()
  const s = useT()
  if (!info?.hasUpdate) return null
  return (
    <Box position="absolute" top={0} right={1}>
      <Text color={theme.warning ?? theme.accent ?? theme.primary} bold>
        ↑ {s.updateAvailable ?? 'Update Carbon available'}: v{info.latestVersion}
      </Text>
    </Box>
  )
}

const Gap = ({lines = 1}: {lines?: number}) => (
  <Box flexDirection="column" flexShrink={0}>
    {Array.from({length: lines}, (_, i) => (
      <Text key={i}> </Text>
    ))}
  </Box>
)

/**
 * Compact brand line: "◈ CARBON · tagline".
 * Shown during probing, wizard, and downloading phases so the identity
 * is always visible above the active content.
 */
function BrandLine() {
  const theme = useTheme()
  const s = useT()
  return (
    <Box flexDirection="row" flexShrink={0}>
      <Text color={theme.accent ?? theme.primary} bold>◈ CARBON</Text>
      <Text color={theme.gray} dimColor>  ·  </Text>
      <Text color={theme.gray}>{s.tagline}</Text>
    </Box>
  )
}

function ChoiceIndicator({isSelected}: IndicatorProps) {
  const theme = useTheme()
  return (
    <Box marginRight={1}>
      <Text color={theme.accent ?? theme.primary}>{isSelected ? '▶' : ' '}</Text>
    </Box>
  )
}

function ChoiceItem({isSelected, label}: ItemProps) {
  const theme = useTheme()
  return (
    <Text color={isSelected ? (theme.accent ?? theme.primary) : theme.primary} bold={isSelected}>
      {label}
    </Text>
  )
}

/**
 * Language picker overlay — opens with ctrl+l from any phase, paused over the
 * previous phase so it resumes seamlessly when the user picks or cancels.
 * Searchable list of 80+ supported languages. Selecting one calls
 * setLanguage() which broadcasts to every useT() subscriber and re-renders
 * the entire UI in the new language instantly.
 */
function LanguagePicker({onPick, onCancel, boxWidth}: {onPick: (code: string) => void; onCancel: () => void; boxWidth: number}) {
  const {stdout} = useStdout()
  const theme = useTheme()
  const s = useT()
  const [query, setQuery] = useState('')
  const all = supportedLanguages()
  const q = query.trim().toLowerCase()
  const items = q
    ? all.filter(code => {
        const name = languageDisplayName(code).toLowerCase()
        return name.includes(q) || code.toLowerCase().includes(q)
      })
    : all
  // If the filter narrows to nothing, fall back to the full list so the user
  // can always reach a selection (and clear the query).
  const visible = items.length > 0 ? items : all
  const current = getLanguage()
  const listLimit = Math.max(8, Math.min(14, (stdout?.rows ? stdout.rows - 14 : 12)))

  return (
    <Box flexDirection="column" alignItems="center">
      <BrandLine />
      <Gap />
      <Panel title={s.langPickerTitle ?? 'Choose language'} width={boxWidth}>
        <Box flexDirection="column">
          <Box flexDirection="row">
            <Text color={theme.accent ?? theme.primary}>⌕ </Text>
            <TextInput
              value={query}
              onChange={setQuery}
              placeholder={s.langPickerSearch ?? 'search…'}
              width={boxWidth - 12}
            />
          </Box>
          <Gap />
          <SelectInput
            indicatorComponent={ChoiceIndicator}
            itemComponent={ChoiceItem}
            limit={listLimit}
            items={visible.map(code => {
              const isCurrent = code === current
              const label = `${languageDisplayName(code)}  · ${code}${isCurrent ? '  ✓' : ''}`
              return {key: code, label, value: code}
            })}
            onSelect={item => onPick(item.value)}
          />
          {items.length === 0 ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>{s.langPickerHint ?? 'type to filter'}</Text>
          ) : null}
        </Box>
      </Panel>
      <Gap />
      <Text color={theme.gray} dimColor={theme.dimSecondary}>^l {s.langPickerHint ?? 'type to filter'} · esc {s.back}</Text>
    </Box>
  )
}

/**
 * Media metadata block — Title / Artist / Album / Release / Time / Source.
 * All fields always shown; missing values display "-".
 */
function MetadataBlock({info, platform, maxWidth}: {info: VideoInfo; platform?: Platform; maxWidth: number}) {
  const theme = useTheme()
  const s = useT()
  const artist = artistOf(info)
  const release = formatReleaseDate(info.release_date)
  const labelW = 9
  const valueW = Math.max(10, maxWidth - labelW - 4)

  const rows: Array<[string, string]> = [
    [s.lblTitle, info.title ?? '-'],
    [s.lblArtist, artist ?? '-'],
    [s.lblAlbum, info.album ?? '-'],
    [s.lblRelease, release ?? '-'],
    [s.lblTime, info.duration ? formatDuration(info.duration) : '-'],
    [s.lblSource, platform?.label ?? '-'],
  ]

  return (
    <Box flexDirection="column">
      {rows.map(([label, value]) => (
        <Box key={label} flexDirection="row">
          <Text color={theme.accent ?? theme.gray} bold>
            {label.padEnd(labelW)}
          </Text>
          <Text color={theme.primary}>{truncate(value, valueW)}</Text>
        </Box>
      ))}
    </Box>
  )
}

/**
 * Cover art for the current item, rendered with the best terminal image
 * protocol (Kitty / iTerm2 / Sixel, half-block fallback). Tries each
 * thumbnail candidate in order (largest first) until one downloads
 * successfully, so the cover appears consistently even when the top URL
 * 403/404s. Reserves its area while loading so the layout doesn't jump.
 */
function CoverArt({candidates, cols, square}: {candidates: ThumbnailInfo[]; cols: number; square: boolean}) {
  const protocol = detectProtocol()
  const cell = getCellPixelSize()
  // Use the first candidate's dimensions for aspect ratio calculation.
  const first = candidates[0]
  const aspect = square ? 1 : (first?.width && first?.height ? first.width / first.height : 1)
  const rows = Math.max(4, Math.min(18, Math.round((cols * cell.width) / (aspect * cell.height))))

  const [thumb, setThumb] = useState<ThumbResult | undefined>(undefined)
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    // Try candidates sequentially until one succeeds.
    void (async () => {
      for (const candidate of candidates) {
        if (cancelled || controller.signal.aborted) return
        debugLog(`CoverArt: trying url=${candidate.url} cols=${cols} rows=${rows} protocol=${protocol} square=${square}`)
        const result = await fetchThumbnail(candidate.url, cols, rows, protocol, controller.signal, square)
        if (result) {
          debugLog(`CoverArt: fetchThumbnail OK for ${candidate.url}`)
          if (!cancelled) setThumb(result)
          return
        }
        debugLog(`CoverArt: fetchThumbnail FAILED for ${candidate.url}, trying next`)
      }
      debugLog('CoverArt: all candidates failed')
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [candidates, cols, rows, protocol, square])

  if (!thumb) {
    // Reserve the exact area so layout is stable while the art downloads.
    return <Box width={cols} height={rows} flexShrink={0} />
  }
  return (
    <Box flexShrink={0}>
      <Thumbnail grid={thumb.grid} png={thumb.png} rgba={thumb.rgba} cols={cols} rows={rows} />
    </Box>
  )
}

/**
 * Metadata header row: cover art on the left (when the terminal is wide
 * enough and artwork exists) + the metadata block on the right.
 * In Audio mode with complete music metadata (title + artist + album), the
 * cover is center-cropped to a square to look like album art.
 */
function MediaHeader({info, platform, contentWidth, audioMode}: {info: VideoInfo; platform?: Platform; contentWidth: number; audioMode?: boolean}) {
  const candidates = useMemo(() => thumbnailCandidates(info), [info])
  const gap = 2
  const minMeta = 24
  // Square crop only for Audio mode with complete metadata (title + artist + album).
  const square = Boolean(audioMode && hasCompleteMusicMeta(info))
  // Size the cover to match the metadata block height (6 rows) so it never
  // towers over the metadata. In square mode the width is derived from the
  // cell aspect ratio so the result is a true visual square:
  //   cols = metaRows * cellHeight / cellWidth  (e.g. 6 * 20/10 = 12)
  const cell = getCellPixelSize()
  const metaRows = 6
  const coverCols = square
    ? Math.max(8, Math.round((metaRows * cell.height) / cell.width))
    : 24
  const showCover = candidates.length > 0 && contentWidth >= coverCols + gap + minMeta
  // Cap metadata width so the cover+metadata group stays compact and
  // justifyContent="center" can visually center it. Without the cap the
  // metadata box fills all remaining space, pushing cover and text apart.
  const maxMeta = 42
  const metaWidth = showCover
    ? Math.min(maxMeta, Math.max(minMeta, contentWidth - coverCols - gap))
    : Math.min(maxMeta, contentWidth)
  debugLog(`MediaHeader: candidates=${candidates.length} contentWidth=${contentWidth} showCover=${showCover} square=${square} coverCols=${coverCols}`)

  // Inner row auto-sizes to cover+metadata so the outer justifyContent="center"
  // can actually center the group (a full-width child would defeat centering).
  return (
    <Box flexDirection="row" width={contentWidth} justifyContent="center">
      <Box flexDirection="row">
        {showCover ? (
          <>
            <CoverArt candidates={candidates} cols={coverCols} square={square} />
            <Box width={gap} flexShrink={0} />
          </>
        ) : null}
        <Box flexDirection="column" width={metaWidth}>
          <MetadataBlock info={info} platform={platform} maxWidth={metaWidth} />
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Modern progress bar with percentage, filled/empty segments, and stats.
 */
function ModernProgressBar({percent, width = 40}: {percent: number; width?: number}) {
  const theme = useTheme()
  const clamped = Math.max(0, Math.min(1, percent))
  const filled = Math.round(clamped * width)
  const empty = width - filled
  const pct = Math.round(clamped * 100)

  return (
    <Box flexDirection="column" alignItems="center">
      <Text>
        <Text color={theme.accent ?? theme.primary} bold>
          {'█'.repeat(filled)}
        </Text>
        <Text color={theme.gray} dimColor>
          {'░'.repeat(empty)}
        </Text>
        <Text color={theme.primary} bold>
          {' '}{pct}%
        </Text>
      </Text>
    </Box>
  )
}

/**
 * Rotating tip display — changes every TIP_INTERVAL_MS.
 */
function TipDisplay({maxWidth}: {maxWidth: number}) {
  const theme = useTheme()
  const s = useT()
  const [tip, setTip] = useState(randomTip)

  useEffect(() => {
    const interval = setInterval(() => {
      setTip(nextTip())
    }, TIP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const wrapped = wrapText(`${s.tip}: ${tip}`, maxWidth)

  return (
    <Box flexDirection="column" alignItems="center">
      {wrapped.slice(0, 2).map((line, i) => (
        <Text key={i} color={theme.gray} dimColor={theme.dimSecondary} italic>
          {i === 0 ? '💡 ' : '   '}{line}
        </Text>
      ))}
    </Box>
  )
}

export type Outcome = {filepath?: string}

type Step = 'type' | 'format' | 'resolution' | 'fps' | 'bitrate'

type Phase =
  | {name: 'input'; warning?: string}
  | {name: 'probing'; status: string}
  | {name: 'wizard'; step: Step}
  | {
      name: 'downloading'
      choice: DownloadChoice
      progress?: DownloadProgress
      processing: boolean
      refreshing?: boolean
    }
  | {name: 'done'; filepath: string}
  | {name: 'error'; message: string}
  | {name: 'language-picker'; previousPhase: Phase}

type WizardState = {
  kind: 'video' | 'audio' | null
  videoFormat: VideoFormat | null
  audioFormat: AudioFormat | null
  resolution: number
  fps: number
  bitrate: number
}

type AppProps = {
  initialUrl?: string
  initialThemeMode?: ThemeMode
  onOutcome: (outcome: Outcome) => void
}

export function App({initialThemeMode = 'system', ...props}: AppProps) {
  const [themeMode, setThemeMode] = useState(initialThemeMode)
  const cycleTheme = useCallback(() => {
    setThemeMode(nextThemeMode)
  }, [])

  return (
    <ThemeProvider mode={themeMode}>
      <AppContent {...props} cycleTheme={cycleTheme} />
    </ThemeProvider>
  )
}

function AppContent({
  initialUrl,
  onOutcome,
  cycleTheme,
}: {
  initialUrl?: string
  onOutcome: (outcome: Outcome) => void
  cycleTheme: () => void
}) {
  const theme = useTheme()
  const s = useT()
  const {exit} = useApp()
  const {stdout} = useStdout()
  const [url, setUrl] = useState(initialUrl ?? '')
  const [urlInput, setUrlInput] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const [platform, setPlatform] = useState<Platform>()
  const [info, setInfo] = useState<VideoInfo>()
  /** Actual URL to download (may differ from `url` when Spotify fallback is used) */
  const downloadUrlRef = useRef<string>('')
  const [wizard, setWizard] = useState<WizardState>({kind: null, videoFormat: null, audioFormat: null, resolution: 0, fps: 0, bitrate: 0})
  const ytdlpRef = useRef('')
  const abortRef = useRef<AbortController | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>(initialUrl ? {name: 'probing', status: s.warmingUp} : {name: 'input'})
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    void checkForUpdate().then(info => {
      if (!cancelled) setUpdateInfo(info)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80
  const rows = stdout?.rows && stdout.rows > 0 ? stdout.rows : 24
  const boxWidth = Math.max(14, Math.min(64, columns - 6))
  const contentWidth = Math.max(10, Math.min(columns - 4, 78))

  const startProbe = useCallback(async (targetUrl: string) => {
    const controller = new AbortController()
    abortRef.current = controller
    setPlatform(detectPlatform(targetUrl))
    setPhase({name: 'probing', status: t().warmingUp})
    try {
      const ytdlp =
        ytdlpRef.current ||
        (await ensureYtDlp(status => setPhase({name: 'probing', status}), controller.signal))
      ytdlpRef.current = ytdlp
      if (controller.signal.aborted) return
      setPhase({name: 'probing', status: t().fetchingInfo})
      let videoInfo
      let downloadUrl = targetUrl
      try {
        // First attempt without cookies
        const result = await probe(ytdlp, targetUrl, controller.signal)
        videoInfo = result.info
        // If Spotify fallback was used, download from the YouTube URL instead
        if (result.spotifyFallback && videoInfo.webpage_url) {
          downloadUrl = videoInfo.webpage_url
        }
      } catch (firstError) {
        if (controller.signal.aborted) return
        // If DRM error, retry with browser cookies
        const errMsg = firstError instanceof Error ? firstError.message : String(firstError)
        if (errMsg.toLowerCase().includes('drm') || errMsg.toLowerCase().includes('sign in') || errMsg.toLowerCase().includes('age')) {
          setPhase({name: 'probing', status: t().fetchingInfo})
          const result = await probe(ytdlp, targetUrl, controller.signal, true)
          videoInfo = result.info
          if (result.spotifyFallback && videoInfo.webpage_url) {
            downloadUrl = videoInfo.webpage_url
          }
        } else {
          throw firstError
        }
      }
      downloadUrlRef.current = downloadUrl
      if (controller.signal.aborted) return
      setInfo(videoInfo)
      setWizard({kind: null, videoFormat: null, audioFormat: null, resolution: 0, fps: 0, bitrate: 0})
      setPhase({name: 'wizard', step: 'type'})
    } catch (error) {
      if (controller.signal.aborted) return
      setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
    }
  }, [])

  useEffect(() => {
    if (initialUrl) void startProbe(initialUrl)
  }, [initialUrl, startProbe])

  const resetToInput = useCallback(() => {
    setUrl('')
    setUrlInput('')
    setPlatform(undefined)
    setInfo(undefined)
    setWizard({kind: null, videoFormat: null, audioFormat: null, resolution: 0, fps: 0, bitrate: 0})
    setPhase({name: 'input'})
  }, [])

  const cancelRun = useCallback(() => {
    abortRef.current?.abort()
    resetToInput()
    setUrlInput(url)
  }, [resetToInput, url])

  useInput(
    (input, key) => {
      if (key.ctrl && input === 't') {
        cycleTheme()
        return
      }
      if (key.ctrl && input === 'l' && phase.name !== 'language-picker') {
        setPhase({name: 'language-picker', previousPhase: phase})
        return
      }
      if (key.escape && phase.name === 'language-picker') {
        setPhase(phase.previousPhase)
        return
      }
      if (key.escape && phase.name === 'wizard') {
        if (phase.step === 'type') resetToInput()
        else if (phase.step === 'format') setPhase({name: 'wizard', step: 'type'})
        else if (phase.step === 'resolution') setPhase({name: 'wizard', step: 'format'})
        else if (phase.step === 'fps') setPhase({name: 'wizard', step: 'resolution'})
        else if (phase.step === 'bitrate') setPhase({name: 'wizard', step: 'format'})
        return
      }
      if (key.escape && (phase.name === 'error' || phase.name === 'done')) resetToInput()
      if (key.escape && (phase.name === 'probing' || phase.name === 'downloading')) cancelRun()
      if (key.return && (phase.name === 'error' || phase.name === 'done')) resetToInput()
    },
    {isActive: Boolean(process.stdin.isTTY)},
  )

  const handleUrlSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!isProbablyUrl(trimmed)) {
      setPhase({name: 'input', warning: t().notUrl})
      return
    }
    setUrl(trimmed)
    void startProbe(trimmed)
  }

  const startDownload = useCallback(
    (choice: DownloadChoice) => {
      const controller = new AbortController()
      abortRef.current = controller
      setPhase({name: 'downloading', choice, processing: false})
      void (async () => {
        const handlers = {
          onProgress: (progress: DownloadProgress) =>
            setPhase(prev => (prev.name === 'downloading' ? {...prev, progress, processing: false} : prev)),
          onProcessing: () =>
            setPhase(prev => (prev.name === 'downloading' ? {...prev, processing: true} : prev)),
        }
        try {
          const ffmpegLocation = await ensureFfmpeg(status => setPhase({name: 'downloading', choice, processing: false}), controller.signal)
          const actualUrl = downloadUrlRef.current || url
          const base = {ytdlp: ytdlpRef.current, ffmpegLocation, url: actualUrl, choice, outDir: OUT_DIR}
          let filepath: string
          try {
            filepath = await download(base, handlers, controller.signal)
          } catch (error) {
            if (controller.signal.aborted) throw error
            const errMsg = error instanceof Error ? error.message : String(error)
            const isDrm = errMsg.toLowerCase().includes('drm') || errMsg.toLowerCase().includes('sign in') || errMsg.toLowerCase().includes('age')
            setPhase(prev =>
              prev.name === 'downloading' ? {...prev, progress: undefined, refreshing: true} : prev,
            )
            // Retry with browser cookies if DRM/auth related, else plain retry.
            // strongBypass uses alternative player clients (may lower quality),
            // so it's only used here as a last resort after the normal attempt.
            filepath = await download({...base, useCookies: isDrm, strongBypass: true}, handlers, controller.signal)
          }
          // Audio mode → embed cover art into the file so media players can
          // display it during playback. We do this ourselves (instead of
          // yt-dlp's --embed-thumbnail) because yt-dlp's internal embedding
          // can corrupt the audio stream for certain videos.
          // Square crop is used when complete music metadata is available.
          // Skip when ffmpeg is unavailable (ffmpegLocation === null).
          if (choice.kind === 'audio' && info && ffmpegLocation !== null) {
            setPhase(prev => (prev.name === 'downloading' ? {...prev, processing: true} : prev))
            const square = hasCompleteMusicMeta(info)
            await embedSquareCover(filepath, thumbnailCandidates(info), ffmpegLocation ?? undefined, controller.signal, square)
          }
          onOutcome({filepath})
          setHistory(addToHistory(url))
          setPhase({name: 'done', filepath})
        } catch (error) {
          if (controller.signal.aborted) return
          setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
        }
      })()
    },
    [url, onOutcome, info],
  )

  const handleTypePick = (item: {value: string}) => {
    const kind = item.value as 'video' | 'audio'
    setWizard(w => ({...w, kind}))
    setPhase({name: 'wizard', step: 'format'})
  }

  const handleFormatPick = (item: {value: string}) => {
    if (wizard.kind === 'video') {
      const fmt = VIDEO_FORMATS.find(f => f.id === item.value)
      if (!fmt) return
      setWizard(w => ({...w, videoFormat: fmt}))
      setPhase({name: 'wizard', step: 'resolution'})
    } else {
      const fmt = AUDIO_FORMATS.find(f => f.id === item.value)
      if (!fmt) return
      setWizard(w => ({...w, audioFormat: fmt}))
      if (hasBitrateOptions(fmt)) {
        setPhase({name: 'wizard', step: 'bitrate'})
      } else {
        const choice: DownloadChoice = {
          kind: 'audio',
          label: `audio · ${fmt.label}`,
          detail: fmtDesc(fmt.descKey),
          args: buildAudioArgs(fmt),
        }
        startDownload(choice)
      }
    }
  }

  const handleBitratePick = (item: {value: number}) => {
    const fmt = wizard.audioFormat
    if (!fmt) return
    setWizard(w => ({...w, bitrate: item.value}))
    const choice: DownloadChoice = {
      kind: 'audio',
      label: `audio · ${fmt.label} · ${item.value} kbps`,
      detail: fmtDesc(fmt.descKey),
      args: buildAudioArgs(fmt, item.value),
    }
    startDownload(choice)
  }

  const handleResolutionPick = (item: {value: number}) => {
    setWizard(w => ({...w, resolution: item.value}))
    setPhase({name: 'wizard', step: 'fps'})
  }

  const handleFpsPick = (item: {value: number}) => {
    const fmt = wizard.videoFormat
    if (!fmt) return
    setWizard(w => ({...w, fps: item.value}))
    const resLabel = wizard.resolution > 0 ? `${wizard.resolution}p` : 'best'
    const fpsLabel = item.value > 0 ? `${item.value}fps` : t().sourceFps
    const choice: DownloadChoice = {
      kind: 'video',
      label: `video · ${fmt.label} · ${resLabel} · ${fpsLabel}`,
      detail: fmtDesc(fmt.descKey),
      args: buildVideoArgs(fmt, wizard.resolution, item.value),
    }
    startDownload(choice)
  }

  const sourceHasVideo = info ? maxHeight(info) > 0 : true
  const sourceHasAudio = info ? hasAudio(info) : true
  // Always show both options; if detection fails, default to showing both.
  const typeItems = [
    ...(sourceHasVideo || !sourceHasAudio ? [{key: 'video', label: `▶  ${t().videoOption}`, value: 'video'}] : []),
    ...(sourceHasAudio || !sourceHasVideo ? [{key: 'audio', label: `♪  ${t().audioOption}`, value: 'audio'}] : []),
  ]

  // Always show ALL resolution options — let yt-dlp handle what's actually available.
  // Filtering by source maxHeight was too aggressive and hid valid options.
  const resolutionItems = RESOLUTIONS.map(r => ({
    key: String(r.value),
    label: `${r.label}  ${fmtDesc(r.descKey)}`,
    value: r.value,
  }))

  // Always show ALL FPS options — let yt-dlp handle what's actually available.
  const fpsItems = FPS_OPTIONS.map(f => ({
    key: String(f.value),
    label: `${f.label}  ${fmtDesc(f.descKey)}`,
    value: f.value,
  }))

  const videoFormatItems = VIDEO_FORMATS.map(f => ({
    key: f.id,
    label: `${f.label}${f.recommended ? `  ★ ${t().recommended}` : ''}  ${fmtDesc(f.descKey)}`,
    value: f.id,
  }))

  const audioFormatItems = AUDIO_FORMATS.map(f => ({
    key: f.id,
    label: `${f.label}${f.recommended ? `  ★ ${t().recommended}` : ''}  ${fmtDesc(f.descKey)}`,
    value: f.id,
  }))

  const hints: Array<[string, string]> = (() => {
    const base: Array<[string, string]> =
      phase.name === 'input'
        ? [['↵', s.grab], ['^c', s.quit]]
        : phase.name === 'probing'
          ? [['esc', s.cancel], ['^c', s.quit]]
          : phase.name === 'wizard'
            ? [['↑↓', s.choose], ['↵', s.select], ['esc', s.back], ['^c', s.quit]]
            : phase.name === 'downloading'
              ? [['esc', s.cancel], ['^c', s.quit]]
              : phase.name === 'done'
                ? [['^c', s.quit]]
                : phase.name === 'language-picker'
                  ? [['esc', s.back], ['^c', s.quit]]
                  : [['↵', s.tryAgain], ['^c', s.quit]]
    const extras: Array<[string, string]> = phase.name === 'language-picker'
      ? []
      : [['^t', `${s.theme}:${theme.mode}`], ['^l', s.lang ?? 'language']]
    const withTheme: Array<[string, string]> = [...base, ...extras]
    if (phase.name === 'input' && history.length > 0) {
      return [withTheme[0]!, ['↑', s.history], ...withTheme.slice(1)]
    }
    return withTheme
  })()

  const partLabel = (progress: DownloadProgress): string =>
    progress.totalParts > 1 ? `${s.part} ${progress.part + 1}/${progress.totalParts}  ` : ''

  const downloadMeta = (progress: DownloadProgress): string => {
    const speed = progress.speed ? formatSpeed(progress.speed) : ''
    const eta = progress.eta ? `${formatEta(progress.eta)} ${s.left}` : ''
    return `${partLabel(progress)}${speed.padStart(10)}  ${eta.padEnd(12)}`
  }

  const indeterminateMeta = (progress: DownloadProgress): string => {
    const bytes = formatBytes(progress.downloadedBytes)
    const speed = progress.speed ? formatSpeed(progress.speed) : ''
    return `${partLabel(progress)}${bytes.padStart(8)}  ${speed.padEnd(10)}`
  }

  const stepTitle = (step: Step): string => {
    if (step === 'type') return s.stepType
    if (step === 'format') return wizard.kind === 'video' ? s.stepVideoFormat : s.stepAudioFormat
    if (step === 'resolution') return s.stepResolution
    if (step === 'fps') return s.stepFps
    return s.stepBitrate
  }

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={columns}
      height={rows}
      backgroundColor={theme.background}
    >
      <UpdateBadge info={updateInfo} />

      {phase.name === 'input' && (
        <Box flexDirection="column" alignItems="center">
          <Logo />
          <Text color={theme.primary}>
            {s.tagline}
          </Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            {s.sitesLine}
          </Text>
          <Gap lines={2} />
          <Box flexDirection="column" alignItems="center" width={boxWidth}>
            <Panel title={s.pasteLink} width={boxWidth}>
              <TextInput
                value={urlInput}
                onChange={setUrlInput}
                onSubmit={handleUrlSubmit}
                placeholder={s.placeholder}
                width={boxWidth - 8}
                history={history}
                submitOnPaste={isProbablyUrl}
              />
            </Panel>
          </Box>
          {phase.warning ? (
            <Text color={theme.danger ?? theme.primary}>✗ {phase.warning}</Text>
          ) : null}
        </Box>
      )}

      {phase.name === 'probing' && (
        <Box flexDirection="column" alignItems="center">
          <BrandLine />
          <Gap />
          <Panel title={platform ? platform.label : s.analyzing} width={boxWidth}>
            <Text color={theme.gray} dimColor={theme.dimSecondary}>
              {url.length > boxWidth - 10 ? `${url.slice(0, boxWidth - 11)}…` : url}
            </Text>
          </Panel>
        </Box>
      )}

      {phase.name === 'wizard' && info && (
        <Box width={contentWidth} flexDirection="column" alignItems="center">
          <BrandLine />
          <Gap />
          <MediaHeader info={info} platform={platform} contentWidth={contentWidth} audioMode={wizard.kind === 'audio'} />
          <Gap />
          <Panel title={stepTitle(phase.step)} width={Math.max(48, Math.round(contentWidth * 0.8))}>
            {phase.step === 'type' && (
              <SelectInput
                indicatorComponent={ChoiceIndicator}
                itemComponent={ChoiceItem}
                items={typeItems}
                onSelect={handleTypePick}
              />
            )}
            {phase.step === 'format' && wizard.kind === 'video' && (
              <SelectInput
                indicatorComponent={ChoiceIndicator}
                itemComponent={ChoiceItem}
                items={videoFormatItems}
                onSelect={handleFormatPick}
              />
            )}
            {phase.step === 'format' && wizard.kind === 'audio' && (
              <SelectInput
                indicatorComponent={ChoiceIndicator}
                itemComponent={ChoiceItem}
                items={audioFormatItems}
                onSelect={handleFormatPick}
              />
            )}
            {phase.step === 'resolution' && (
              <SelectInput
                indicatorComponent={ChoiceIndicator}
                itemComponent={ChoiceItem}
                items={resolutionItems}
                onSelect={handleResolutionPick}
              />
            )}
            {phase.step === 'fps' && (
              <SelectInput
                indicatorComponent={ChoiceIndicator}
                itemComponent={ChoiceItem}
                items={fpsItems}
                onSelect={handleFpsPick}
              />
            )}
            {phase.step === 'bitrate' && wizard.audioFormat && (
              <SelectInput
                indicatorComponent={ChoiceIndicator}
                itemComponent={ChoiceItem}
                items={bitrateItems(wizard.audioFormat)}
                onSelect={handleBitratePick}
              />
            )}
          </Panel>
        </Box>
      )}

      {phase.name === 'downloading' && (
        <Box flexDirection="column" alignItems="center" width={contentWidth}>
          <BrandLine />
          <Gap />
          {info ? <MediaHeader info={info} platform={platform} contentWidth={contentWidth} audioMode={phase.choice.kind === 'audio'} /> : null}
          <Gap />
          <Text color={theme.accent ?? theme.primary} bold>
            ▸ {phase.choice.label}
          </Text>
          <Gap />
          {phase.processing ? (
            <>
              <ModernProgressBar percent={1} width={Math.min(40, contentWidth - 10)} />
              <Gap />
              <Text>
                <Text color={theme.accent ?? theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> {s.processing}</Text>
              </Text>
            </>
          ) : phase.progress?.totalBytes ? (
            <>
              <ModernProgressBar
                percent={phase.progress.downloadedBytes / phase.progress.totalBytes}
                width={Math.min(40, contentWidth - 10)}
              />
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>{downloadMeta(phase.progress)}</Text>
            </>
          ) : phase.progress ? (
            <>
              <Text>
                <Text color={theme.accent ?? theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> {s.downloading}</Text>
              </Text>
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>{indeterminateMeta(phase.progress)}</Text>
            </>
          ) : (
            <>
              <ModernProgressBar percent={0} width={Math.min(40, contentWidth - 10)} />
              <Gap />
              <Text>
                <Text color={theme.accent ?? theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}>
                  {phase.refreshing ? ` ${s.linkExpired}` : ` ${s.starting}`}
                </Text>
              </Text>
            </>
          )}
          <Gap />
          <TipDisplay maxWidth={contentWidth} />
        </Box>
      )}

      {phase.name === 'done' && (
        <Box flexDirection="column" alignItems="center">
          <Text>
            <Text bold color={theme.success ?? theme.primary}>✓ {s.grabbed} </Text>
            <Text color={theme.primary}>{s.savedTo}</Text>
          </Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}>{shortenPath(phase.filepath, os.homedir(), 60)}</Text>
          <Gap />
          <Box
            borderStyle="double"
            borderColor={theme.accent ?? theme.gray}
            paddingX={3}
          >
            <Text bold color={theme.primary}>{s.grabAnother}</Text>
          </Box>
        </Box>
      )}

      {phase.name === 'error' && (
        <Box flexDirection="column" alignItems="center" width={Math.max(10, Math.min(columns - 6, 72))}>
          <Text bold color={theme.danger ?? theme.primary}>✗ {phase.message}</Text>
        </Box>
      )}

      {phase.name === 'language-picker' && (
        <LanguagePicker
          onPick={code => {
            setLanguage(code)
            const prev = phase.previousPhase
            // Preserve object identity where possible so React doesn't unmount
            // the underlying phase; for object-typed phases, refresh status
            // strings so they re-render in the new language.
            if (prev.name === 'probing') setPhase({...prev})
            else if (prev.name === 'wizard') setPhase({...prev})
            else if (prev.name === 'downloading') setPhase({...prev})
            else setPhase(prev)
          }}
          onCancel={() => setPhase(phase.previousPhase)}
          boxWidth={boxWidth}
        />
      )}

      {hints.length > 0 ? (
        <>
          <Gap lines={2} />
          <Shortcuts
            items={hints}
            leading={
              phase.name === 'probing' ? (
                <Text>
                  <Text color={theme.accent ?? theme.primary}>
                    <Spinner type="dots" />
                  </Text>
                  <Text color={theme.gray} dimColor={theme.dimSecondary}> {phase.status}</Text>
                </Text>
              ) : undefined
            }
          />
        </>
      ) : null}
    </Box>
  )
}