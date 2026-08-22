#!/usr/bin/env node

// src/cli.tsx
import { createRequire } from "module";
import { render } from "ink";

// src/app.tsx
import { useCallback, useEffect, useRef as useRef2, useState as useState2 } from "react";
import os3 from "os";
import path3 from "path";
import { Box as Box4, Text as Text5, useApp, useInput as useInput2, useStdout } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";

// src/components/logo.tsx
import { Box, Text } from "ink";

// src/theme.tsx
import React, { createContext, useContext } from "react";
var THEME_MODES = ["system", "dark", "light"];
var CARBON_DARK_BG = "#1F2544";
var CARBON_LIGHT_BG = "#FFFFFF";
var darkTheme = {
  mode: "dark",
  primary: "#e4e4e7",
  gray: "#a1a1aa",
  accent: "#22d3ee",
  success: "#4ade80",
  danger: "#f87171",
  warning: "#facc15",
  background: CARBON_DARK_BG,
  dimSecondary: false
};
var lightTheme = {
  mode: "light",
  primary: "#18181b",
  gray: "#52525b",
  accent: "#0e7490",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#b45309",
  background: CARBON_LIGHT_BG,
  dimSecondary: false
};
function detectSystemIsLight() {
  const env = process.env;
  const colorfgbg = env.COLORFGBG;
  if (colorfgbg) {
    const bg = colorfgbg.split(";").pop();
    const bgNum = Number.parseInt(bg ?? "", 10);
    if (Number.isFinite(bgNum)) return bgNum >= 8 && bgNum !== 8;
  }
  if (/light/i.test(env.TERMINAL_THEME ?? "") || /light/i.test(env.TERM_THEME ?? "")) return true;
  if (/dark/i.test(env.TERMINAL_THEME ?? "") || /dark/i.test(env.TERM_THEME ?? "")) return false;
  return false;
}
function systemTheme() {
  const light = detectSystemIsLight();
  return { ...light ? lightTheme : darkTheme, mode: "system" };
}
var themes = {
  system: systemTheme,
  dark: () => darkTheme,
  light: () => lightTheme
};
var ThemeContext = createContext(darkTheme);
function themeFor(mode) {
  return themes[mode]();
}
function ThemeProvider({ mode, children }) {
  return React.createElement(ThemeContext.Provider, { value: themeFor(mode) }, children);
}
function useTheme() {
  return useContext(ThemeContext);
}
function isThemeMode(value) {
  return typeof value === "string" && THEME_MODES.includes(value);
}
function nextThemeMode(mode) {
  return THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
}

// src/components/logo.tsx
import { jsx } from "react/jsx-runtime";
var LOGO_LINES = [
  " \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2557   \u2588\u2588\u2557",
  "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551",
  "\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551",
  "\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551\u255A\u2588\u2588\u2557\u2588\u2588\u2551",
  "\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2551",
  " \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D  \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D  \u255A\u2550\u2550\u2550\u255D"
];
function Logo() {
  const theme = useTheme();
  return /* @__PURE__ */ jsx(Box, { flexDirection: "column", flexShrink: 0, alignItems: "center", children: LOGO_LINES.map((line, i) => /* @__PURE__ */ jsx(Text, { color: theme.accent ?? theme.primary, bold: true, children: line }, i)) });
}
function LogoCompact() {
  const theme = useTheme();
  return /* @__PURE__ */ jsx(Text, { color: theme.accent ?? theme.primary, bold: true, children: "\u25C8 CARBON" });
}

// src/components/panel.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function Panel({ title, width, children }) {
  const theme = useTheme();
  const titleText = ` ${title} `;
  const tail = Math.max(0, width - titleText.length - 3);
  return /* @__PURE__ */ jsxs(Box2, { flexDirection: "column", width, children: [
    /* @__PURE__ */ jsxs(Text2, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: theme.accent ?? theme.primary, children: "\u2554\u2550" }),
      /* @__PURE__ */ jsx2(Text2, { color: theme.primary, bold: true, children: titleText }),
      /* @__PURE__ */ jsxs(Text2, { color: theme.accent ?? theme.primary, children: [
        "\u2550".repeat(tail),
        "\u2557"
      ] })
    ] }),
    /* @__PURE__ */ jsx2(
      Box2,
      {
        width,
        borderStyle: "double",
        borderColor: theme.accent ?? theme.gray,
        borderTop: false,
        flexDirection: "column",
        paddingX: 1,
        children
      }
    )
  ] });
}

// src/components/shortcuts.tsx
import { Box as Box3, Text as Text3 } from "ink";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function Shortcuts({ items, leading }) {
  const theme = useTheme();
  return /* @__PURE__ */ jsxs2(Box3, { flexShrink: 0, children: [
    leading ? /* @__PURE__ */ jsx3(Box3, { marginRight: 2, children: leading }) : null,
    items.map(([key, label], i) => /* @__PURE__ */ jsxs2(Box3, { marginRight: i < items.length - 1 ? 2 : 0, children: [
      /* @__PURE__ */ jsx3(Text3, { color: theme.accent ?? theme.primary, bold: true, children: key }),
      /* @__PURE__ */ jsxs2(Text3, { color: theme.gray, dimColor: theme.dimSecondary, children: [
        " ",
        label
      ] })
    ] }, `${key}-${i}`))
  ] });
}

// src/components/text-input.tsx
import { useRef, useState } from "react";
import { Text as Text4, useInput } from "ink";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function TextInput({ value, onChange, onSubmit, placeholder = "", width = 40, history = [], submitOnPaste }) {
  const theme = useTheme();
  const [cursorState, setCursorState] = useState(value.length);
  const [historyPos, setHistoryPos] = useState(null);
  const draftRef = useRef("");
  const cursor = Math.min(cursorState, value.length);
  const edit = (next, position) => {
    setCursorState(Math.max(0, Math.min(next.length, position)));
    setHistoryPos(null);
    onChange(next);
  };
  const recall = (text) => {
    setCursorState(text.length);
    onChange(text);
  };
  useInput((input, key) => {
    if (key.return) {
      onSubmit?.(value);
      return;
    }
    if (key.escape) return;
    if (key.upArrow || key.downArrow) {
      if (history.length === 0) return;
      if (key.upArrow) {
        if (historyPos === null) draftRef.current = value;
        const next2 = historyPos === null ? 0 : Math.min(historyPos + 1, history.length - 1);
        if (next2 === historyPos) return;
        setHistoryPos(next2);
        recall(history[next2]);
      } else if (historyPos !== null) {
        const next2 = historyPos - 1;
        setHistoryPos(next2 < 0 ? null : next2);
        recall(next2 < 0 ? draftRef.current : history[next2]);
      }
      return;
    }
    if (key.leftArrow) return setCursorState(Math.max(0, cursor - 1));
    if (key.rightArrow) return setCursorState(Math.min(value.length, cursor + 1));
    if (key.home || key.ctrl && input === "a") return setCursorState(0);
    if (key.end || key.ctrl && input === "e") return setCursorState(value.length);
    if (key.backspace) {
      if (cursor === 0) return;
      edit(value.slice(0, cursor - 1) + value.slice(cursor), cursor - 1);
      return;
    }
    if (key.delete) {
      if (cursor >= value.length) return;
      edit(value.slice(0, cursor) + value.slice(cursor + 1), cursor);
      return;
    }
    if (key.ctrl && input === "u") {
      edit(value.slice(cursor), 0);
      return;
    }
    if (key.ctrl && input === "k") {
      edit(value.slice(0, cursor), cursor);
      return;
    }
    if (!input || key.ctrl || key.meta) return;
    const clean = input.replace(/[\x00-\x1f\x7f]/g, "");
    if (!clean) return;
    const next = value.slice(0, cursor) + clean + value.slice(cursor);
    edit(next, cursor + clean.length);
    if (clean.length > 1 && value === "" && submitOnPaste?.(next.trim())) onSubmit?.(next);
  });
  const span = Math.max(8, width);
  let offset = 0;
  if (cursor > span - 1) offset = cursor - span + 1;
  if (!value) {
    return /* @__PURE__ */ jsxs3(Text4, { children: [
      /* @__PURE__ */ jsx4(Text4, { inverse: true, children: " " }),
      /* @__PURE__ */ jsx4(Text4, { color: theme.gray, dimColor: theme.dimSecondary, children: placeholder.slice(0, span - 1) })
    ] });
  }
  const visible = value.slice(offset, offset + span);
  const cursorIndex = cursor - offset;
  return /* @__PURE__ */ jsxs3(Text4, { children: [
    Array.from(visible).map((ch, i) => /* @__PURE__ */ jsx4(Text4, { color: theme.primary, inverse: i === cursorIndex, children: ch }, i)),
    cursorIndex >= visible.length && /* @__PURE__ */ jsx4(Text4, { inverse: true, children: " " })
  ] });
}

// src/lib/format.ts
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
function formatSpeed(bytesPerSecond) {
  return `${formatBytes(bytesPerSecond)}/s`;
}
function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}\u2026`;
}
function shortenPath(filepath, home, max) {
  const display = filepath.startsWith(home) ? `~${filepath.slice(home.length)}` : filepath;
  return truncate(display, max);
}
function wrapText(text, width) {
  if (width <= 0) return [text];
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

// src/lib/i18n.ts
var en = {
  tagline: "grab any video or music. pick. download. done.",
  sitesLine: "YouTube \xB7 X/Twitter \xB7 Instagram \xB7 Threads \xB7 TikTok and 1,800+ other sites",
  pasteLink: "Paste a link",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "supports video & audio from 1800+ sites",
  notUrl: "that doesn't look like a link \u2014 paste a full url",
  analyzing: "Analyzing",
  warmingUp: "warming up\u2026",
  fetchingInfo: "fetching media info\u2026",
  stepType: "Step 1/3 \xB7 What to grab?",
  stepVideoFormat: "Step 2/3 \xB7 Video format",
  stepAudioFormat: "Step 2/3 \xB7 Audio format",
  stepResolution: "Step 3/3 \xB7 Resolution",
  stepFps: "Step 3/3 \xB7 Frame rate",
  stepBitrate: "Step 3/3 \xB7 Audio bitrate",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "recommended",
  bestQuality: "best quality",
  sourceFps: "source fps",
  grab: "grab",
  history: "history",
  quit: "quit",
  cancel: "cancel",
  choose: "choose",
  select: "select",
  back: "back",
  theme: "theme",
  downloading: "downloading\u2026",
  processing: "processing\u2026",
  starting: "starting download\u2026",
  linkExpired: "link expired \u2014 grabbing a fresh one\u2026",
  grabbed: "grabbed!",
  savedTo: "saved to:",
  grabAnother: "\u21B5 grab another",
  tryAgain: "try again",
  left: "left",
  part: "part",
  tip: "Tip",
  lblTitle: "Title",
  lblArtist: "Artist",
  lblAlbum: "Album",
  lblRelease: "Release",
  lblTime: "Time",
  lblSource: "Source",
  // Format descriptions
  fmtMp4: "Best compatibility \u2014 plays everywhere",
  fmtMkv: "Matroska container \u2014 great for archiving",
  fmtWebm: "Web-optimized, open format",
  fmtMov: "QuickTime \u2014 Apple friendly",
  fmtAvi: "Legacy container, wide support",
  fmtMp3: "Best compatibility \u2014 plays everywhere",
  fmtAac: "Better quality at same bitrate",
  fmtM4a: "Apple audio container",
  fmtFlac: "Lossless \u2014 best quality, big files",
  fmtWav: "Uncompressed PCM \u2014 studio quality",
  // FPS descriptions
  fpsSource: "Keep original frame rate",
  fps24: "Cinematic look",
  fps30: "Standard video",
  fps60: "Smooth motion",
  // Resolution descriptions
  resBest: "Highest quality source offers",
  res2160: "Ultra HD",
  res1440: "Quad HD",
  res1080: "Full HD",
  res720: "HD",
  res480: "SD \u2014 smaller file",
  res360: "Low \u2014 smallest file",
  // Bitrate labels
  brHighest: "highest",
  brHigh: "high",
  brStandard: "standard",
  brSmall: "small",
  // Update notification
  updateAvailable: "Update Carbon available"
};
var id = {
  tagline: "unduh video atau musik apa pun. pilih. unduh. selesai.",
  sitesLine: "YouTube \xB7 X/Twitter \xB7 Instagram \xB7 Threads \xB7 TikTok dan 1.800+ situs lainnya",
  pasteLink: "Tempel tautan",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "mendukung video & audio dari 1800+ situs",
  notUrl: "itu bukan tautan \u2014 tempel url lengkap",
  analyzing: "Menganalisis",
  warmingUp: "memanaskan\u2026",
  fetchingInfo: "mengambil info media\u2026",
  stepType: "Langkah 1/3 \xB7 Unduh apa?",
  stepVideoFormat: "Langkah 2/3 \xB7 Format video",
  stepAudioFormat: "Langkah 2/3 \xB7 Format audio",
  stepResolution: "Langkah 3/3 \xB7 Resolusi",
  stepFps: "Langkah 3/3 \xB7 Frame rate",
  stepBitrate: "Langkah 3/3 \xB7 Bitrate audio",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "direkomendasikan",
  bestQuality: "kualitas terbaik",
  sourceFps: "fps sumber",
  grab: "unduh",
  history: "riwayat",
  quit: "keluar",
  cancel: "batal",
  choose: "pilih",
  select: "pilih",
  back: "kembali",
  theme: "tema",
  downloading: "mengunduh\u2026",
  processing: "memproses\u2026",
  starting: "memulai unduhan\u2026",
  linkExpired: "tautan kedaluwarsa \u2014 mengambil yang baru\u2026",
  grabbed: "berhasil diunduh!",
  savedTo: "disimpan di:",
  grabAnother: "\u21B5 unduh lagi",
  tryAgain: "coba lagi",
  left: "tersisa",
  part: "bagian",
  tip: "Tips",
  lblTitle: "Judul",
  lblArtist: "Artis",
  lblAlbum: "Album",
  lblRelease: "Rilis",
  lblTime: "Durasi",
  lblSource: "Sumber",
  // Format descriptions
  fmtMp4: "Kompatibilitas terbaik \u2014 bisa diputar di mana saja",
  fmtMkv: "Kontainer Matroska \u2014 cocok untuk arsip",
  fmtWebm: "Dioptimalkan untuk web, format terbuka",
  fmtMov: "QuickTime \u2014 ramah Apple",
  fmtAvi: "Kontainer lama, dukungan luas",
  fmtMp3: "Kompatibilitas terbaik \u2014 bisa diputar di mana saja",
  fmtAac: "Kualitas lebih baik di bitrate yang sama",
  fmtM4a: "Kontainer audio Apple",
  fmtFlac: "Lossless \u2014 kualitas terbaik, file besar",
  fmtWav: "PCM tanpa kompresi \u2014 kualitas studio",
  // FPS descriptions
  fpsSource: "Pertahankan frame rate asli",
  fps24: "Tampilan sinematik",
  fps30: "Video standar",
  fps60: "Gerakan halus",
  // Resolution descriptions
  resBest: "Kualitas tertinggi dari sumber",
  res2160: "Ultra HD",
  res1440: "Quad HD",
  res1080: "Full HD",
  res720: "HD",
  res480: "SD \u2014 file lebih kecil",
  res360: "Rendah \u2014 file terkecil",
  // Bitrate labels
  brHighest: "tertinggi",
  brHigh: "tinggi",
  brStandard: "standar",
  brSmall: "kecil",
  // Update notification
  updateAvailable: "Update Carbon terbaru tersedia"
};
var es = {
  tagline: "descarga cualquier video o m\xFAsica. elige. descarga. listo.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 m\xE1s",
  pasteLink: "Pega un enlace",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "soporta video y audio de 1800+ sitios",
  notUrl: "eso no parece un enlace \u2014 pega una url completa",
  analyzing: "Analizando",
  warmingUp: "calentando\u2026",
  fetchingInfo: "obteniendo info del media\u2026",
  stepType: "Paso 1/3 \xB7 \xBFQu\xE9 descargar?",
  stepVideoFormat: "Paso 2/3 \xB7 Formato de video",
  stepAudioFormat: "Paso 2/3 \xB7 Formato de audio",
  stepResolution: "Paso 3/3 \xB7 Resoluci\xF3n",
  stepFps: "Paso 3/3 \xB7 Tasa de fotogramas",
  stepBitrate: "Paso 3/3 \xB7 Bitrate de audio",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "recomendado",
  bestQuality: "mejor calidad",
  sourceFps: "fps original",
  grab: "descargar",
  history: "historial",
  quit: "salir",
  cancel: "cancelar",
  choose: "elegir",
  select: "seleccionar",
  back: "volver",
  theme: "tema",
  downloading: "descargando\u2026",
  processing: "procesando\u2026",
  starting: "iniciando descarga\u2026",
  linkExpired: "enlace expirado \u2014 obteniendo uno nuevo\u2026",
  grabbed: "\xA1descargado!",
  savedTo: "guardado en:",
  grabAnother: "\u21B5 descargar otro",
  tryAgain: "reintentar",
  left: "restante",
  part: "parte",
  tip: "Consejo",
  lblTitle: "T\xEDtulo",
  lblArtist: "Artista",
  lblAlbum: "\xC1lbum",
  lblRelease: "Lanzamiento",
  lblTime: "Duraci\xF3n",
  lblSource: "Fuente"
};
var fr = {
  tagline: "t\xE9l\xE9chargez vid\xE9os ou musique. choisissez. t\xE9l\xE9chargez. termin\xE9.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 autres",
  pasteLink: "Collez un lien",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "prend en charge vid\xE9o et audio de 1800+ sites",
  notUrl: "\xE7a ne ressemble pas \xE0 un lien \u2014 collez une url compl\xE8te",
  analyzing: "Analyse",
  warmingUp: "\xE9chauffement\u2026",
  fetchingInfo: "r\xE9cup\xE9ration des infos m\xE9dia\u2026",
  stepType: "\xC9tape 1/3 \xB7 Que t\xE9l\xE9charger ?",
  stepVideoFormat: "\xC9tape 2/3 \xB7 Format vid\xE9o",
  stepAudioFormat: "\xC9tape 2/3 \xB7 Format audio",
  stepResolution: "\xC9tape 3/3 \xB7 R\xE9solution",
  stepFps: "\xC9tape 3/3 \xB7 Fr\xE9quence d'images",
  stepBitrate: "\xC9tape 3/3 \xB7 Bitrate audio",
  videoOption: "Vid\xE9o",
  audioOption: "Audio",
  recommended: "recommand\xE9",
  bestQuality: "meilleure qualit\xE9",
  sourceFps: "fps source",
  grab: "t\xE9l\xE9charger",
  history: "historique",
  quit: "quitter",
  cancel: "annuler",
  choose: "choisir",
  select: "s\xE9lectionner",
  back: "retour",
  theme: "th\xE8me",
  downloading: "t\xE9l\xE9chargement\u2026",
  processing: "traitement\u2026",
  starting: "d\xE9marrage du t\xE9l\xE9chargement\u2026",
  linkExpired: "lien expir\xE9 \u2014 r\xE9cup\xE9ration d'un nouveau\u2026",
  grabbed: "t\xE9l\xE9charg\xE9 !",
  savedTo: "enregistr\xE9 dans :",
  grabAnother: "\u21B5 t\xE9l\xE9charger un autre",
  tryAgain: "r\xE9essayer",
  left: "restant",
  part: "partie",
  tip: "Astuce",
  lblTitle: "Titre",
  lblArtist: "Artiste",
  lblAlbum: "Album",
  lblRelease: "Sortie",
  lblTime: "Dur\xE9e",
  lblSource: "Source"
};
var de = {
  tagline: "lade videos oder musik herunter. w\xE4hle. lade. fertig.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 weitere",
  pasteLink: "Link einf\xFCgen",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "unterst\xFCtzt Video & Audio von 1800+ Seiten",
  notUrl: "das sieht nicht wie ein Link aus \u2014 f\xFCge eine vollst\xE4ndige URL ein",
  analyzing: "Analysiere",
  warmingUp: "aufw\xE4rmen\u2026",
  fetchingInfo: "Medien-Infos abrufen\u2026",
  stepType: "Schritt 1/3 \xB7 Was herunterladen?",
  stepVideoFormat: "Schritt 2/3 \xB7 Videoformat",
  stepAudioFormat: "Schritt 2/3 \xB7 Audioformat",
  stepResolution: "Schritt 3/3 \xB7 Aufl\xF6sung",
  stepFps: "Schritt 3/3 \xB7 Bildrate",
  stepBitrate: "Schritt 3/3 \xB7 Audio-Bitrate",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "empfohlen",
  bestQuality: "beste Qualit\xE4t",
  sourceFps: "Quell-FPS",
  grab: "herunterladen",
  history: "verlauf",
  quit: "beenden",
  cancel: "abbrechen",
  choose: "w\xE4hlen",
  select: "ausw\xE4hlen",
  back: "zur\xFCck",
  theme: "design",
  downloading: "l\xE4dt herunter\u2026",
  processing: "verarbeite\u2026",
  starting: "Download starten\u2026",
  linkExpired: "Link abgelaufen \u2014 hole einen neuen\u2026",
  grabbed: "heruntergeladen!",
  savedTo: "gespeichert in:",
  grabAnother: "\u21B5 weiteres herunterladen",
  tryAgain: "erneut versuchen",
  left: "\xFCbrig",
  part: "teil",
  tip: "Tipp",
  lblTitle: "Titel",
  lblArtist: "K\xFCnstler",
  lblAlbum: "Album",
  lblRelease: "Ver\xF6ffentlichung",
  lblTime: "Dauer",
  lblSource: "Quelle"
};
var pt = {
  tagline: "baixe qualquer v\xEDdeo ou m\xFAsica. escolha. baixe. pronto.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 mais",
  pasteLink: "Cole um link",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "suporta v\xEDdeo e \xE1udio de 1800+ sites",
  notUrl: "isso n\xE3o parece um link \u2014 cole uma url completa",
  analyzing: "Analisando",
  warmingUp: "aquecendo\u2026",
  fetchingInfo: "obtendo informa\xE7\xF5es da m\xEDdia\u2026",
  stepType: "Passo 1/3 \xB7 O que baixar?",
  stepVideoFormat: "Passo 2/3 \xB7 Formato de v\xEDdeo",
  stepAudioFormat: "Passo 2/3 \xB7 Formato de \xE1udio",
  stepResolution: "Passo 3/3 \xB7 Resolu\xE7\xE3o",
  stepFps: "Passo 3/3 \xB7 Taxa de quadros",
  stepBitrate: "Passo 3/3 \xB7 Bitrate de \xE1udio",
  videoOption: "V\xEDdeo",
  audioOption: "\xC1udio",
  recommended: "recomendado",
  bestQuality: "melhor qualidade",
  sourceFps: "fps original",
  grab: "baixar",
  history: "hist\xF3rico",
  quit: "sair",
  cancel: "cancelar",
  choose: "escolher",
  select: "selecionar",
  back: "voltar",
  theme: "tema",
  downloading: "baixando\u2026",
  processing: "processando\u2026",
  starting: "iniciando download\u2026",
  linkExpired: "link expirado \u2014 obtendo um novo\u2026",
  grabbed: "baixado!",
  savedTo: "salvo em:",
  grabAnother: "\u21B5 baixar outro",
  tryAgain: "tentar novamente",
  left: "restante",
  part: "parte",
  tip: "Dica",
  lblTitle: "T\xEDtulo",
  lblArtist: "Artista",
  lblAlbum: "\xC1lbum",
  lblRelease: "Lan\xE7amento",
  lblTime: "Dura\xE7\xE3o",
  lblSource: "Fonte"
};
var it = {
  tagline: "scarica qualsiasi video o musica. scegli. scarica. fatto.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 altri",
  pasteLink: "Incolla un link",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "supporta video e audio da 1800+ siti",
  notUrl: "non sembra un link \u2014 incolla un url completo",
  analyzing: "Analisi",
  warmingUp: "riscaldamento\u2026",
  fetchingInfo: "recupero info media\u2026",
  stepType: "Passo 1/3 \xB7 Cosa scaricare?",
  stepVideoFormat: "Passo 2/3 \xB7 Formato video",
  stepAudioFormat: "Passo 2/3 \xB7 Formato audio",
  stepResolution: "Passo 3/3 \xB7 Risoluzione",
  stepFps: "Passo 3/3 \xB7 Frame rate",
  stepBitrate: "Passo 3/3 \xB7 Bitrate audio",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "consigliato",
  bestQuality: "migliore qualit\xE0",
  sourceFps: "fps sorgente",
  grab: "scarica",
  history: "cronologia",
  quit: "esci",
  cancel: "annulla",
  choose: "scegli",
  select: "seleziona",
  back: "indietro",
  theme: "tema",
  downloading: "download in corso\u2026",
  processing: "elaborazione\u2026",
  starting: "avvio download\u2026",
  linkExpired: "link scaduto \u2014 ne recupero uno nuovo\u2026",
  grabbed: "scaricato!",
  savedTo: "salvato in:",
  grabAnother: "\u21B5 scarica un altro",
  tryAgain: "riprova",
  left: "rimanente",
  part: "parte",
  tip: "Suggerimento",
  lblTitle: "Titolo",
  lblArtist: "Artista",
  lblAlbum: "Album",
  lblRelease: "Uscita",
  lblTime: "Durata",
  lblSource: "Fonte"
};
var ru = {
  tagline: "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043E \u0438\u043B\u0438 \u043C\u0443\u0437\u044B\u043A\u0443. \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435. \u0441\u043A\u0430\u0447\u0430\u0439\u0442\u0435. \u0433\u043E\u0442\u043E\u0432\u043E.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 \u0434\u0440\u0443\u0433\u0438\u0445",
  pasteLink: "\u0412\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0432\u0438\u0434\u0435\u043E \u0438 \u0430\u0443\u0434\u0438\u043E \u0441 1800+ \u0441\u0430\u0439\u0442\u043E\u0432",
  notUrl: "\u044D\u0442\u043E \u043D\u0435 \u043F\u043E\u0445\u043E\u0436\u0435 \u043D\u0430 \u0441\u0441\u044B\u043B\u043A\u0443 \u2014 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u043E\u043B\u043D\u044B\u0439 url",
  analyzing: "\u0410\u043D\u0430\u043B\u0438\u0437",
  warmingUp: "\u0440\u0430\u0437\u043E\u0433\u0440\u0435\u0432\u2026",
  fetchingInfo: "\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043E \u043C\u0435\u0434\u0438\u0430\u2026",
  stepType: "\u0428\u0430\u0433 1/3 \xB7 \u0427\u0442\u043E \u0441\u043A\u0430\u0447\u0430\u0442\u044C?",
  stepVideoFormat: "\u0428\u0430\u0433 2/3 \xB7 \u0424\u043E\u0440\u043C\u0430\u0442 \u0432\u0438\u0434\u0435\u043E",
  stepAudioFormat: "\u0428\u0430\u0433 2/3 \xB7 \u0424\u043E\u0440\u043C\u0430\u0442 \u0430\u0443\u0434\u0438\u043E",
  stepResolution: "\u0428\u0430\u0433 3/3 \xB7 \u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435",
  stepFps: "\u0428\u0430\u0433 3/3 \xB7 \u0427\u0430\u0441\u0442\u043E\u0442\u0430 \u043A\u0430\u0434\u0440\u043E\u0432",
  stepBitrate: "\u0428\u0430\u0433 3/3 \xB7 \u0411\u0438\u0442\u0440\u0435\u0439\u0442 \u0430\u0443\u0434\u0438\u043E",
  videoOption: "\u0412\u0438\u0434\u0435\u043E",
  audioOption: "\u0410\u0443\u0434\u0438\u043E",
  recommended: "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F",
  bestQuality: "\u043B\u0443\u0447\u0448\u0435\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E",
  sourceFps: "fps \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430",
  grab: "\u0441\u043A\u0430\u0447\u0430\u0442\u044C",
  history: "\u0438\u0441\u0442\u043E\u0440\u0438\u044F",
  quit: "\u0432\u044B\u0445\u043E\u0434",
  cancel: "\u043E\u0442\u043C\u0435\u043D\u0430",
  choose: "\u0432\u044B\u0431\u0440\u0430\u0442\u044C",
  select: "\u0432\u044B\u0431\u0440\u0430\u0442\u044C",
  back: "\u043D\u0430\u0437\u0430\u0434",
  theme: "\u0442\u0435\u043C\u0430",
  downloading: "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435\u2026",
  processing: "\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430\u2026",
  starting: "\u043D\u0430\u0447\u0430\u043B\u043E \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438\u2026",
  linkExpired: "\u0441\u0441\u044B\u043B\u043A\u0430 \u0438\u0441\u0442\u0435\u043A\u043B\u0430 \u2014 \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u043C \u043D\u043E\u0432\u0443\u044E\u2026",
  grabbed: "\u0441\u043A\u0430\u0447\u0430\u043D\u043E!",
  savedTo: "\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u0432:",
  grabAnother: "\u21B5 \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0435\u0449\u0451",
  tryAgain: "\u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430",
  left: "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C",
  part: "\u0447\u0430\u0441\u0442\u044C",
  tip: "\u0421\u043E\u0432\u0435\u0442",
  lblTitle: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
  lblArtist: "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C",
  lblAlbum: "\u0410\u043B\u044C\u0431\u043E\u043C",
  lblRelease: "\u0420\u0435\u043B\u0438\u0437",
  lblTime: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
  lblSource: "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A"
};
var ja = {
  tagline: "\u52D5\u753B\u3084\u97F3\u697D\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3002\u9078\u629E\u3002\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3002\u5B8C\u4E86\u3002",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800\u4EE5\u4E0A",
  pasteLink: "\u30EA\u30F3\u30AF\u3092\u8CBC\u308A\u4ED8\u3051",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "1800\u4EE5\u4E0A\u306E\u30B5\u30A4\u30C8\u304B\u3089\u52D5\u753B\u30FB\u97F3\u58F0\u306B\u5BFE\u5FDC",
  notUrl: "\u30EA\u30F3\u30AF\u3067\u306F\u3042\u308A\u307E\u305B\u3093 \u2014 \u5B8C\u5168\u306AURL\u3092\u8CBC\u308A\u4ED8\u3051\u3066\u304F\u3060\u3055\u3044",
  analyzing: "\u89E3\u6790\u4E2D",
  warmingUp: "\u6E96\u5099\u4E2D\u2026",
  fetchingInfo: "\u30E1\u30C7\u30A3\u30A2\u60C5\u5831\u3092\u53D6\u5F97\u4E2D\u2026",
  stepType: "\u30B9\u30C6\u30C3\u30D7 1/3 \xB7 \u4F55\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\uFF1F",
  stepVideoFormat: "\u30B9\u30C6\u30C3\u30D7 2/3 \xB7 \u52D5\u753B\u5F62\u5F0F",
  stepAudioFormat: "\u30B9\u30C6\u30C3\u30D7 2/3 \xB7 \u97F3\u58F0\u5F62\u5F0F",
  stepResolution: "\u30B9\u30C6\u30C3\u30D7 3/3 \xB7 \u89E3\u50CF\u5EA6",
  stepFps: "\u30B9\u30C6\u30C3\u30D7 3/3 \xB7 \u30D5\u30EC\u30FC\u30E0\u30EC\u30FC\u30C8",
  stepBitrate: "\u30B9\u30C6\u30C3\u30D7 3/3 \xB7 \u97F3\u58F0\u30D3\u30C3\u30C8\u30EC\u30FC\u30C8",
  videoOption: "\u52D5\u753B",
  audioOption: "\u97F3\u58F0",
  recommended: "\u304A\u3059\u3059\u3081",
  bestQuality: "\u6700\u9AD8\u54C1\u8CEA",
  sourceFps: "\u30BD\u30FC\u30B9FPS",
  grab: "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
  history: "\u5C65\u6B74",
  quit: "\u7D42\u4E86",
  cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
  choose: "\u9078\u629E",
  select: "\u9078\u629E",
  back: "\u623B\u308B",
  theme: "\u30C6\u30FC\u30DE",
  downloading: "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D\u2026",
  processing: "\u51E6\u7406\u4E2D\u2026",
  starting: "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u958B\u59CB\u2026",
  linkExpired: "\u30EA\u30F3\u30AF\u306E\u6709\u52B9\u671F\u9650\u5207\u308C \u2014 \u65B0\u3057\u3044\u3082\u306E\u3092\u53D6\u5F97\u4E2D\u2026",
  grabbed: "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5B8C\u4E86\uFF01",
  savedTo: "\u4FDD\u5B58\u5148:",
  grabAnother: "\u21B5 \u6B21\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
  tryAgain: "\u518D\u8A66\u884C",
  left: "\u6B8B\u308A",
  part: "\u30D1\u30FC\u30C8",
  tip: "\u30D2\u30F3\u30C8",
  lblTitle: "\u30BF\u30A4\u30C8\u30EB",
  lblArtist: "\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8",
  lblAlbum: "\u30A2\u30EB\u30D0\u30E0",
  lblRelease: "\u30EA\u30EA\u30FC\u30B9",
  lblTime: "\u518D\u751F\u6642\u9593",
  lblSource: "\u30BD\u30FC\u30B9"
};
var ko = {
  tagline: "\uBAA8\uB4E0 \uBE44\uB514\uC624\uB098 \uC74C\uC545\uC744 \uB2E4\uC6B4\uB85C\uB4DC\uD558\uC138\uC694. \uC120\uD0DD. \uB2E4\uC6B4\uB85C\uB4DC. \uC644\uB8CC.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800\uAC1C \uC774\uC0C1",
  pasteLink: "\uB9C1\uD06C \uBD99\uC5EC\uB123\uAE30",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "1800\uAC1C \uC774\uC0C1\uC758 \uC0AC\uC774\uD2B8\uC5D0\uC11C \uBE44\uB514\uC624 \uBC0F \uC624\uB514\uC624 \uC9C0\uC6D0",
  notUrl: "\uB9C1\uD06C\uAC00 \uC544\uB2D9\uB2C8\uB2E4 \u2014 \uC804\uCCB4 URL\uC744 \uBD99\uC5EC\uB123\uC73C\uC138\uC694",
  analyzing: "\uBD84\uC11D \uC911",
  warmingUp: "\uC900\uBE44 \uC911\u2026",
  fetchingInfo: "\uBBF8\uB514\uC5B4 \uC815\uBCF4 \uAC00\uC838\uC624\uB294 \uC911\u2026",
  stepType: "\uB2E8\uACC4 1/3 \xB7 \uBB34\uC5C7\uC744 \uB2E4\uC6B4\uB85C\uB4DC\uD560\uAE4C\uC694?",
  stepVideoFormat: "\uB2E8\uACC4 2/3 \xB7 \uBE44\uB514\uC624 \uD615\uC2DD",
  stepAudioFormat: "\uB2E8\uACC4 2/3 \xB7 \uC624\uB514\uC624 \uD615\uC2DD",
  stepResolution: "\uB2E8\uACC4 3/3 \xB7 \uD574\uC0C1\uB3C4",
  stepFps: "\uB2E8\uACC4 3/3 \xB7 \uD504\uB808\uC784 \uC18D\uB3C4",
  stepBitrate: "\uB2E8\uACC4 3/3 \xB7 \uC624\uB514\uC624 \uBE44\uD2B8\uB808\uC774\uD2B8",
  videoOption: "\uBE44\uB514\uC624",
  audioOption: "\uC624\uB514\uC624",
  recommended: "\uCD94\uCC9C",
  bestQuality: "\uCD5C\uACE0 \uD488\uC9C8",
  sourceFps: "\uC6D0\uBCF8 FPS",
  grab: "\uB2E4\uC6B4\uB85C\uB4DC",
  history: "\uAE30\uB85D",
  quit: "\uC885\uB8CC",
  cancel: "\uCDE8\uC18C",
  choose: "\uC120\uD0DD",
  select: "\uC120\uD0DD",
  back: "\uB4A4\uB85C",
  theme: "\uD14C\uB9C8",
  downloading: "\uB2E4\uC6B4\uB85C\uB4DC \uC911\u2026",
  processing: "\uCC98\uB9AC \uC911\u2026",
  starting: "\uB2E4\uC6B4\uB85C\uB4DC \uC2DC\uC791\u2026",
  linkExpired: "\uB9C1\uD06C \uB9CC\uB8CC \u2014 \uC0C8 \uB9C1\uD06C \uAC00\uC838\uC624\uB294 \uC911\u2026",
  grabbed: "\uB2E4\uC6B4\uB85C\uB4DC \uC644\uB8CC!",
  savedTo: "\uC800\uC7A5 \uC704\uCE58:",
  grabAnother: "\u21B5 \uB2E4\uB978 \uAC83 \uB2E4\uC6B4\uB85C\uB4DC",
  tryAgain: "\uB2E4\uC2DC \uC2DC\uB3C4",
  left: "\uB0A8\uC74C",
  part: "\uBD80\uBD84",
  tip: "\uD301",
  lblTitle: "\uC81C\uBAA9",
  lblArtist: "\uC544\uD2F0\uC2A4\uD2B8",
  lblAlbum: "\uC568\uBC94",
  lblRelease: "\uBC1C\uB9E4",
  lblTime: "\uC7AC\uC0DD \uC2DC\uAC04",
  lblSource: "\uCD9C\uCC98"
};
var zh = {
  tagline: "\u4E0B\u8F7D\u4EFB\u4F55\u89C6\u9891\u6216\u97F3\u4E50\u3002\u9009\u62E9\u3002\u4E0B\u8F7D\u3002\u5B8C\u6210\u3002",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800\u66F4\u591A",
  pasteLink: "\u7C98\u8D34\u94FE\u63A5",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "\u652F\u63011800\u591A\u4E2A\u7F51\u7AD9\u7684\u89C6\u9891\u548C\u97F3\u9891",
  notUrl: "\u8FD9\u770B\u8D77\u6765\u4E0D\u50CF\u94FE\u63A5 \u2014 \u8BF7\u7C98\u8D34\u5B8C\u6574\u7684URL",
  analyzing: "\u5206\u6790\u4E2D",
  warmingUp: "\u9884\u70ED\u4E2D\u2026",
  fetchingInfo: "\u83B7\u53D6\u5A92\u4F53\u4FE1\u606F\u2026",
  stepType: "\u6B65\u9AA4 1/3 \xB7 \u4E0B\u8F7D\u4EC0\u4E48\uFF1F",
  stepVideoFormat: "\u6B65\u9AA4 2/3 \xB7 \u89C6\u9891\u683C\u5F0F",
  stepAudioFormat: "\u6B65\u9AA4 2/3 \xB7 \u97F3\u9891\u683C\u5F0F",
  stepResolution: "\u6B65\u9AA4 3/3 \xB7 \u5206\u8FA8\u7387",
  stepFps: "\u6B65\u9AA4 3/3 \xB7 \u5E27\u7387",
  stepBitrate: "\u6B65\u9AA4 3/3 \xB7 \u97F3\u9891\u6BD4\u7279\u7387",
  videoOption: "\u89C6\u9891",
  audioOption: "\u97F3\u9891",
  recommended: "\u63A8\u8350",
  bestQuality: "\u6700\u4F73\u8D28\u91CF",
  sourceFps: "\u6E90\u5E27\u7387",
  grab: "\u4E0B\u8F7D",
  history: "\u5386\u53F2",
  quit: "\u9000\u51FA",
  cancel: "\u53D6\u6D88",
  choose: "\u9009\u62E9",
  select: "\u9009\u62E9",
  back: "\u8FD4\u56DE",
  theme: "\u4E3B\u9898",
  downloading: "\u4E0B\u8F7D\u4E2D\u2026",
  processing: "\u5904\u7406\u4E2D\u2026",
  starting: "\u5F00\u59CB\u4E0B\u8F7D\u2026",
  linkExpired: "\u94FE\u63A5\u5DF2\u8FC7\u671F \u2014 \u6B63\u5728\u83B7\u53D6\u65B0\u94FE\u63A5\u2026",
  grabbed: "\u4E0B\u8F7D\u5B8C\u6210\uFF01",
  savedTo: "\u4FDD\u5B58\u5230:",
  grabAnother: "\u21B5 \u4E0B\u8F7D\u53E6\u4E00\u4E2A",
  tryAgain: "\u91CD\u8BD5",
  left: "\u5269\u4F59",
  part: "\u90E8\u5206",
  tip: "\u63D0\u793A",
  lblTitle: "\u6807\u9898",
  lblArtist: "\u827A\u672F\u5BB6",
  lblAlbum: "\u4E13\u8F91",
  lblRelease: "\u53D1\u884C",
  lblTime: "\u65F6\u957F",
  lblSource: "\u6765\u6E90"
};
var zhTW = {
  tagline: "\u4E0B\u8F09\u4EFB\u4F55\u5F71\u7247\u6216\u97F3\u6A02\u3002\u9078\u64C7\u3002\u4E0B\u8F09\u3002\u5B8C\u6210\u3002",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800\u66F4\u591A",
  pasteLink: "\u8CBC\u4E0A\u7DB2\u5740",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "\u652F\u63F41800\u591A\u500B\u7DB2\u7AD9\u7684\u5F71\u7247\u548C\u97F3\u8A0A",
  notUrl: "\u9019\u770B\u8D77\u4F86\u4E0D\u50CF\u9023\u7D50 \u2014 \u8ACB\u8CBC\u4E0A\u5B8C\u6574\u7684URL",
  analyzing: "\u5206\u6790\u4E2D",
  warmingUp: "\u9810\u71B1\u4E2D\u2026",
  fetchingInfo: "\u53D6\u5F97\u5A92\u9AD4\u8CC7\u8A0A\u2026",
  stepType: "\u6B65\u9A5F 1/3 \xB7 \u4E0B\u8F09\u4EC0\u9EBC\uFF1F",
  stepVideoFormat: "\u6B65\u9A5F 2/3 \xB7 \u5F71\u7247\u683C\u5F0F",
  stepAudioFormat: "\u6B65\u9A5F 2/3 \xB7 \u97F3\u8A0A\u683C\u5F0F",
  stepResolution: "\u6B65\u9A5F 3/3 \xB7 \u89E3\u6790\u5EA6",
  stepFps: "\u6B65\u9A5F 3/3 \xB7 \u5F71\u683C\u7387",
  stepBitrate: "\u6B65\u9A5F 3/3 \xB7 \u97F3\u8A0A\u4F4D\u5143\u7387",
  videoOption: "\u5F71\u7247",
  audioOption: "\u97F3\u8A0A",
  recommended: "\u63A8\u85A6",
  bestQuality: "\u6700\u4F73\u54C1\u8CEA",
  sourceFps: "\u4F86\u6E90\u5F71\u683C\u7387",
  grab: "\u4E0B\u8F09",
  history: "\u6B77\u53F2",
  quit: "\u7D50\u675F",
  cancel: "\u53D6\u6D88",
  choose: "\u9078\u64C7",
  select: "\u9078\u64C7",
  back: "\u8FD4\u56DE",
  theme: "\u4E3B\u984C",
  downloading: "\u4E0B\u8F09\u4E2D\u2026",
  processing: "\u8655\u7406\u4E2D\u2026",
  starting: "\u958B\u59CB\u4E0B\u8F09\u2026",
  linkExpired: "\u9023\u7D50\u5DF2\u904E\u671F \u2014 \u6B63\u5728\u53D6\u5F97\u65B0\u9023\u7D50\u2026",
  grabbed: "\u4E0B\u8F09\u5B8C\u6210\uFF01",
  savedTo: "\u5132\u5B58\u5230:",
  grabAnother: "\u21B5 \u4E0B\u8F09\u53E6\u4E00\u500B",
  tryAgain: "\u91CD\u8A66",
  left: "\u5269\u9918",
  part: "\u90E8\u5206",
  tip: "\u63D0\u793A",
  lblTitle: "\u6A19\u984C",
  lblArtist: "\u85DD\u4EBA",
  lblAlbum: "\u5C08\u8F2F",
  lblRelease: "\u767C\u884C",
  lblTime: "\u6642\u9577",
  lblSource: "\u4F86\u6E90"
};
var ar = {
  tagline: "\u062D\u0645\u0651\u0644 \u0623\u064A \u0641\u064A\u062F\u064A\u0648 \u0623\u0648 \u0645\u0648\u0633\u064A\u0642\u0649. \u0627\u062E\u062A\u0631. \u062D\u0645\u0651\u0644. \u062A\u0645.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 \u0627\u0644\u0645\u0632\u064A\u062F",
  pasteLink: "\u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637\u064B\u0627",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "\u064A\u062F\u0639\u0645 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0648\u0627\u0644\u0635\u0648\u062A \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 1800 \u0645\u0648\u0642\u0639",
  notUrl: "\u0647\u0630\u0627 \u0644\u0627 \u064A\u0628\u062F\u0648 \u0643\u0631\u0627\u0628\u0637 \u2014 \u0627\u0644\u0635\u0642 \u0639\u0646\u0648\u0627\u0646 URL \u0643\u0627\u0645\u0644",
  analyzing: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0644\u064A\u0644",
  warmingUp: "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u062D\u0645\u0627\u0621\u2026",
  fetchingInfo: "\u062C\u0627\u0631\u064A \u062C\u0644\u0628 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0648\u0633\u0627\u0626\u0637\u2026",
  stepType: "\u0627\u0644\u062E\u0637\u0648\u0629 1/3 \xB7 \u0645\u0627\u0630\u0627 \u062A\u0631\u064A\u062F \u0627\u0644\u062A\u062D\u0645\u064A\u0644\u061F",
  stepVideoFormat: "\u0627\u0644\u062E\u0637\u0648\u0629 2/3 \xB7 \u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0641\u064A\u062F\u064A\u0648",
  stepAudioFormat: "\u0627\u0644\u062E\u0637\u0648\u0629 2/3 \xB7 \u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0635\u0648\u062A",
  stepResolution: "\u0627\u0644\u062E\u0637\u0648\u0629 3/3 \xB7 \u0627\u0644\u062F\u0642\u0629",
  stepFps: "\u0627\u0644\u062E\u0637\u0648\u0629 3/3 \xB7 \u0645\u0639\u062F\u0644 \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A",
  stepBitrate: "\u0627\u0644\u062E\u0637\u0648\u0629 3/3 \xB7 \u0645\u0639\u062F\u0644 \u0628\u062A \u0627\u0644\u0635\u0648\u062A",
  videoOption: "\u0641\u064A\u062F\u064A\u0648",
  audioOption: "\u0635\u0648\u062A",
  recommended: "\u0645\u0648\u0635\u0649 \u0628\u0647",
  bestQuality: "\u0623\u0641\u0636\u0644 \u062C\u0648\u062F\u0629",
  sourceFps: "fps \u0627\u0644\u0645\u0635\u062F\u0631",
  grab: "\u062A\u062D\u0645\u064A\u0644",
  history: "\u0627\u0644\u0633\u062C\u0644",
  quit: "\u062E\u0631\u0648\u062C",
  cancel: "\u0625\u0644\u063A\u0627\u0621",
  choose: "\u0627\u062E\u062A\u0631",
  select: "\u062D\u062F\u062F",
  back: "\u0631\u062C\u0648\u0639",
  theme: "\u0627\u0644\u0633\u0645\u0629",
  downloading: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644\u2026",
  processing: "\u062C\u0627\u0631\u064A \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629\u2026",
  starting: "\u0628\u062F\u0621 \u0627\u0644\u062A\u062D\u0645\u064A\u0644\u2026",
  linkExpired: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0627\u0628\u0637 \u2014 \u062C\u0627\u0631\u064A \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u0627\u0628\u0637 \u062C\u062F\u064A\u062F\u2026",
  grabbed: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0645\u064A\u0644!",
  savedTo: "\u062D\u064F\u0641\u0638 \u0641\u064A:",
  grabAnother: "\u21B5 \u062D\u0645\u0651\u0644 \u0622\u062E\u0631",
  tryAgain: "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649",
  left: "\u0645\u062A\u0628\u0642\u064A",
  part: "\u062C\u0632\u0621",
  tip: "\u0646\u0635\u064A\u062D\u0629",
  lblTitle: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
  lblArtist: "\u0627\u0644\u0641\u0646\u0627\u0646",
  lblAlbum: "\u0627\u0644\u0623\u0644\u0628\u0648\u0645",
  lblRelease: "\u0627\u0644\u0625\u0635\u062F\u0627\u0631",
  lblTime: "\u0627\u0644\u0645\u062F\u0629",
  lblSource: "\u0627\u0644\u0645\u0635\u062F\u0631"
};
var hi = {
  tagline: "\u0915\u094B\u0908 \u092D\u0940 \u0935\u0940\u0921\u093F\u092F\u094B \u092F\u093E \u0938\u0902\u0917\u0940\u0924 \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902\u0964 \u091A\u0941\u0928\u0947\u0902\u0964 \u0921\u093E\u0909\u0928\u0932\u094B\u0921\u0964 \u0939\u094B \u0917\u092F\u093E\u0964",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 \u0914\u0930",
  pasteLink: "\u0932\u093F\u0902\u0915 \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "1800+ \u0938\u093E\u0907\u091F\u094B\u0902 \u0938\u0947 \u0935\u0940\u0921\u093F\u092F\u094B \u0914\u0930 \u0911\u0921\u093F\u092F\u094B \u0938\u092E\u0930\u094D\u0925\u093F\u0924",
  notUrl: "\u092F\u0939 \u0932\u093F\u0902\u0915 \u0928\u0939\u0940\u0902 \u0932\u0917\u0924\u093E \u2014 \u092A\u0942\u0930\u093E URL \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902",
  analyzing: "\u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0939\u094B \u0930\u0939\u093E \u0939\u0948",
  warmingUp: "\u0924\u0948\u092F\u093E\u0930\u0940 \u0939\u094B \u0930\u0939\u0940 \u0939\u0948\u2026",
  fetchingInfo: "\u092E\u0940\u0921\u093F\u092F\u093E \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B \u0930\u0939\u0940 \u0939\u0948\u2026",
  stepType: "\u091A\u0930\u0923 1/3 \xB7 \u0915\u094D\u092F\u093E \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902?",
  stepVideoFormat: "\u091A\u0930\u0923 2/3 \xB7 \u0935\u0940\u0921\u093F\u092F\u094B \u092A\u094D\u0930\u093E\u0930\u0942\u092A",
  stepAudioFormat: "\u091A\u0930\u0923 2/3 \xB7 \u0911\u0921\u093F\u092F\u094B \u092A\u094D\u0930\u093E\u0930\u0942\u092A",
  stepResolution: "\u091A\u0930\u0923 3/3 \xB7 \u0930\u093F\u091C\u093C\u0949\u0932\u094D\u092F\u0942\u0936\u0928",
  stepFps: "\u091A\u0930\u0923 3/3 \xB7 \u092B\u094D\u0930\u0947\u092E \u0926\u0930",
  stepBitrate: "\u091A\u0930\u0923 3/3 \xB7 \u0911\u0921\u093F\u092F\u094B \u092C\u093F\u091F\u0930\u0947\u091F",
  videoOption: "\u0935\u0940\u0921\u093F\u092F\u094B",
  audioOption: "\u0911\u0921\u093F\u092F\u094B",
  recommended: "\u0905\u0928\u0941\u0936\u0902\u0938\u093F\u0924",
  bestQuality: "\u0938\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u092E \u0917\u0941\u0923\u0935\u0924\u094D\u0924\u093E",
  sourceFps: "\u0938\u094D\u0930\u094B\u0924 fps",
  grab: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921",
  history: "\u0907\u0924\u093F\u0939\u093E\u0938",
  quit: "\u092C\u093E\u0939\u0930",
  cancel: "\u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902",
  choose: "\u091A\u0941\u0928\u0947\u0902",
  select: "\u091A\u0941\u0928\u0947\u0902",
  back: "\u0935\u093E\u092A\u0938",
  theme: "\u0925\u0940\u092E",
  downloading: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
  processing: "\u092A\u094D\u0930\u0938\u0902\u0938\u094D\u0915\u0930\u0923 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
  starting: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0936\u0941\u0930\u0942 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
  linkExpired: "\u0932\u093F\u0902\u0915 \u0938\u092E\u093E\u092A\u094D\u0924 \u2014 \u0928\u092F\u093E \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
  grabbed: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0939\u094B \u0917\u092F\u093E!",
  savedTo: "\u0938\u0939\u0947\u091C\u093E \u0917\u092F\u093E:",
  grabAnother: "\u21B5 \u0914\u0930 \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
  tryAgain: "\u092A\u0941\u0928\u0903 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902",
  left: "\u0936\u0947\u0937",
  part: "\u092D\u093E\u0917",
  tip: "\u0938\u0941\u091D\u093E\u0935",
  lblTitle: "\u0936\u0940\u0930\u094D\u0937\u0915",
  lblArtist: "\u0915\u0932\u093E\u0915\u093E\u0930",
  lblAlbum: "\u090F\u0932\u094D\u092C\u092E",
  lblRelease: "\u0930\u093F\u0932\u0940\u091C\u093C",
  lblTime: "\u0905\u0935\u0927\u093F",
  lblSource: "\u0938\u094D\u0930\u094B\u0924"
};
var tr = {
  tagline: "herhangi bir video veya m\xFCzik indir. se\xE7. indir. bitti.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 daha",
  pasteLink: "Ba\u011Flant\u0131 yap\u0131\u015Ft\u0131r",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "1800+ siteden video ve ses destekler",
  notUrl: "bu bir ba\u011Flant\u0131ya benzemiyor \u2014 tam bir url yap\u0131\u015Ft\u0131r\u0131n",
  analyzing: "Analiz ediliyor",
  warmingUp: "\u0131s\u0131nma\u2026",
  fetchingInfo: "medya bilgisi al\u0131n\u0131yor\u2026",
  stepType: "Ad\u0131m 1/3 \xB7 Ne indirilecek?",
  stepVideoFormat: "Ad\u0131m 2/3 \xB7 Video format\u0131",
  stepAudioFormat: "Ad\u0131m 2/3 \xB7 Ses format\u0131",
  stepResolution: "Ad\u0131m 3/3 \xB7 \xC7\xF6z\xFCn\xFCrl\xFCk",
  stepFps: "Ad\u0131m 3/3 \xB7 Kare h\u0131z\u0131",
  stepBitrate: "Ad\u0131m 3/3 \xB7 Ses bit h\u0131z\u0131",
  videoOption: "Video",
  audioOption: "Ses",
  recommended: "\xF6nerilen",
  bestQuality: "en iyi kalite",
  sourceFps: "kaynak fps",
  grab: "indir",
  history: "ge\xE7mi\u015F",
  quit: "\xE7\u0131k",
  cancel: "iptal",
  choose: "se\xE7",
  select: "se\xE7",
  back: "geri",
  theme: "tema",
  downloading: "indiriliyor\u2026",
  processing: "i\u015Fleniyor\u2026",
  starting: "indirme ba\u015Flat\u0131l\u0131yor\u2026",
  linkExpired: "ba\u011Flant\u0131 s\xFCresi doldu \u2014 yenisi al\u0131n\u0131yor\u2026",
  grabbed: "indirildi!",
  savedTo: "kaydedildi:",
  grabAnother: "\u21B5 ba\u015Fka indir",
  tryAgain: "tekrar dene",
  left: "kald\u0131",
  part: "b\xF6l\xFCm",
  tip: "\u0130pucu",
  lblTitle: "Ba\u015Fl\u0131k",
  lblArtist: "Sanat\xE7\u0131",
  lblAlbum: "Alb\xFCm",
  lblRelease: "Yay\u0131n",
  lblTime: "S\xFCre",
  lblSource: "Kaynak"
};
var vi = {
  tagline: "t\u1EA3i video ho\u1EB7c nh\u1EA1c b\u1EA5t k\u1EF3. ch\u1ECDn. t\u1EA3i. xong.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 kh\xE1c",
  pasteLink: "D\xE1n li\xEAn k\u1EBFt",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "h\u1ED7 tr\u1EE3 video v\xE0 \xE2m thanh t\u1EEB 1800+ trang web",
  notUrl: "\u0111\xF3 kh\xF4ng gi\u1ED1ng li\xEAn k\u1EBFt \u2014 d\xE1n url \u0111\u1EA7y \u0111\u1EE7",
  analyzing: "\u0110ang ph\xE2n t\xEDch",
  warmingUp: "\u0111ang kh\u1EDFi \u0111\u1ED9ng\u2026",
  fetchingInfo: "\u0111ang l\u1EA5y th\xF4ng tin media\u2026",
  stepType: "B\u01B0\u1EDBc 1/3 \xB7 T\u1EA3i g\xEC?",
  stepVideoFormat: "B\u01B0\u1EDBc 2/3 \xB7 \u0110\u1ECBnh d\u1EA1ng video",
  stepAudioFormat: "B\u01B0\u1EDBc 2/3 \xB7 \u0110\u1ECBnh d\u1EA1ng \xE2m thanh",
  stepResolution: "B\u01B0\u1EDBc 3/3 \xB7 \u0110\u1ED9 ph\xE2n gi\u1EA3i",
  stepFps: "B\u01B0\u1EDBc 3/3 \xB7 T\u1ED1c \u0111\u1ED9 khung h\xECnh",
  stepBitrate: "B\u01B0\u1EDBc 3/3 \xB7 Bitrate \xE2m thanh",
  videoOption: "Video",
  audioOption: "\xC2m thanh",
  recommended: "khuy\u1EBFn ngh\u1ECB",
  bestQuality: "ch\u1EA5t l\u01B0\u1EE3ng t\u1ED1t nh\u1EA5t",
  sourceFps: "fps ngu\u1ED3n",
  grab: "t\u1EA3i",
  history: "l\u1ECBch s\u1EED",
  quit: "tho\xE1t",
  cancel: "h\u1EE7y",
  choose: "ch\u1ECDn",
  select: "ch\u1ECDn",
  back: "quay l\u1EA1i",
  theme: "ch\u1EE7 \u0111\u1EC1",
  downloading: "\u0111ang t\u1EA3i\u2026",
  processing: "\u0111ang x\u1EED l\xFD\u2026",
  starting: "b\u1EAFt \u0111\u1EA7u t\u1EA3i\u2026",
  linkExpired: "li\xEAn k\u1EBFt h\u1EBFt h\u1EA1n \u2014 \u0111ang l\u1EA5y li\xEAn k\u1EBFt m\u1EDBi\u2026",
  grabbed: "\u0111\xE3 t\u1EA3i xong!",
  savedTo: "l\u01B0u t\u1EA1i:",
  grabAnother: "\u21B5 t\u1EA3i th\xEAm",
  tryAgain: "th\u1EED l\u1EA1i",
  left: "c\xF2n l\u1EA1i",
  part: "ph\u1EA7n",
  tip: "M\u1EB9o",
  lblTitle: "Ti\xEAu \u0111\u1EC1",
  lblArtist: "Ngh\u1EC7 s\u0129",
  lblAlbum: "Album",
  lblRelease: "Ph\xE1t h\xE0nh",
  lblTime: "Th\u1EDDi l\u01B0\u1EE3ng",
  lblSource: "Ngu\u1ED3n"
};
var th = {
  tagline: "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1E\u0E25\u0E07\u0E43\u0E14\u0E46 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 \u0E40\u0E2A\u0E23\u0E47\u0E08",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 \u0E2D\u0E37\u0E48\u0E19\u0E46",
  pasteLink: "\u0E27\u0E32\u0E07\u0E25\u0E34\u0E07\u0E01\u0E4C",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E41\u0E25\u0E30\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E08\u0E32\u0E01 1800+ \u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C",
  notUrl: "\u0E19\u0E31\u0E48\u0E19\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E25\u0E34\u0E07\u0E01\u0E4C \u2014 \u0E27\u0E32\u0E07 URL \u0E40\u0E15\u0E47\u0E21",
  analyzing: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C",
  warmingUp: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E1E\u0E23\u0E49\u0E2D\u0E21\u2026",
  fetchingInfo: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E37\u0E48\u0E2D\u2026",
  stepType: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 1/3 \xB7 \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E2D\u0E30\u0E44\u0E23?",
  stepVideoFormat: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 2/3 \xB7 \u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D",
  stepAudioFormat: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 2/3 \xB7 \u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E40\u0E2A\u0E35\u0E22\u0E07",
  stepResolution: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 3/3 \xB7 \u0E04\u0E27\u0E32\u0E21\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14",
  stepFps: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 3/3 \xB7 \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E40\u0E1F\u0E23\u0E21",
  stepBitrate: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 3/3 \xB7 \u0E1A\u0E34\u0E15\u0E40\u0E23\u0E15\u0E40\u0E2A\u0E35\u0E22\u0E07",
  videoOption: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D",
  audioOption: "\u0E40\u0E2A\u0E35\u0E22\u0E07",
  recommended: "\u0E41\u0E19\u0E30\u0E19\u0E33",
  bestQuality: "\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
  sourceFps: "fps \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A",
  grab: "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14",
  history: "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34",
  quit: "\u0E2D\u0E2D\u0E01",
  cancel: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
  choose: "\u0E40\u0E25\u0E37\u0E2D\u0E01",
  select: "\u0E40\u0E25\u0E37\u0E2D\u0E01",
  back: "\u0E01\u0E25\u0E31\u0E1A",
  theme: "\u0E18\u0E35\u0E21",
  downloading: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u2026",
  processing: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u2026",
  starting: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u2026",
  linkExpired: "\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 \u2014 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E43\u0E2B\u0E21\u0E48\u2026",
  grabbed: "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E2A\u0E23\u0E47\u0E08!",
  savedTo: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E35\u0E48:",
  grabAnother: "\u21B5 \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E2D\u0E35\u0E01",
  tryAgain: "\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
  left: "\u0E40\u0E2B\u0E25\u0E37\u0E2D",
  part: "\u0E2A\u0E48\u0E27\u0E19",
  tip: "\u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A",
  lblTitle: "\u0E0A\u0E37\u0E48\u0E2D",
  lblArtist: "\u0E28\u0E34\u0E25\u0E1B\u0E34\u0E19",
  lblAlbum: "\u0E2D\u0E31\u0E25\u0E1A\u0E31\u0E49\u0E21",
  lblRelease: "\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48",
  lblTime: "\u0E23\u0E30\u0E22\u0E30\u0E40\u0E27\u0E25\u0E32",
  lblSource: "\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E17\u0E35\u0E48\u0E21\u0E32"
};
var ms = {
  tagline: "muat turun video atau muzik. pilih. muat turun. selesai.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 lagi",
  pasteLink: "Tampal pautan",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "menyokong video & audio dari 1800+ laman",
  notUrl: "itu bukan pautan \u2014 tampal url penuh",
  analyzing: "Menganalisis",
  warmingUp: "memanaskan\u2026",
  fetchingInfo: "mendapatkan maklumat media\u2026",
  stepType: "Langkah 1/3 \xB7 Muat turun apa?",
  stepVideoFormat: "Langkah 2/3 \xB7 Format video",
  stepAudioFormat: "Langkah 2/3 \xB7 Format audio",
  stepResolution: "Langkah 3/3 \xB7 Resolusi",
  stepFps: "Langkah 3/3 \xB7 Kadar bingkai",
  stepBitrate: "Langkah 3/3 \xB7 Kadar bit audio",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "disyorkan",
  bestQuality: "kualiti terbaik",
  sourceFps: "fps sumber",
  grab: "muat turun",
  history: "sejarah",
  quit: "keluar",
  cancel: "batal",
  choose: "pilih",
  select: "pilih",
  back: "kembali",
  theme: "tema",
  downloading: "memuat turun\u2026",
  processing: "memproses\u2026",
  starting: "memulakan muat turun\u2026",
  linkExpired: "pautan tamat \u2014 mendapatkan yang baru\u2026",
  grabbed: "berjaya dimuat turun!",
  savedTo: "disimpan di:",
  grabAnother: "\u21B5 muat turun lagi",
  tryAgain: "cuba lagi",
  left: "tinggal",
  part: "bahagian",
  tip: "Petua",
  lblTitle: "Tajuk",
  lblArtist: "Artis",
  lblAlbum: "Album",
  lblRelease: "Keluaran",
  lblTime: "Tempoh",
  lblSource: "Sumber"
};
var nl = {
  tagline: "download video of muziek. kies. download. klaar.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 meer",
  pasteLink: "Plak een link",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "ondersteunt video & audio van 1800+ sites",
  notUrl: "dat lijkt geen link \u2014 plak een volledige url",
  analyzing: "Analyseren",
  warmingUp: "opwarmen\u2026",
  fetchingInfo: "media-info ophalen\u2026",
  stepType: "Stap 1/3 \xB7 Wat downloaden?",
  stepVideoFormat: "Stap 2/3 \xB7 Videoformaat",
  stepAudioFormat: "Stap 2/3 \xB7 Audioformaat",
  stepResolution: "Stap 3/3 \xB7 Resolutie",
  stepFps: "Stap 3/3 \xB7 Framesnelheid",
  stepBitrate: "Stap 3/3 \xB7 Audiobitrate",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "aanbevolen",
  bestQuality: "beste kwaliteit",
  sourceFps: "bron-fps",
  grab: "download",
  history: "geschiedenis",
  quit: "afsluiten",
  cancel: "annuleren",
  choose: "kies",
  select: "selecteer",
  back: "terug",
  theme: "thema",
  downloading: "downloaden\u2026",
  processing: "verwerken\u2026",
  starting: "download starten\u2026",
  linkExpired: "link verlopen \u2014 nieuwe ophalen\u2026",
  grabbed: "gedownload!",
  savedTo: "opgeslagen in:",
  grabAnother: "\u21B5 download nog een",
  tryAgain: "opnieuw proberen",
  left: "over",
  part: "deel",
  tip: "Tip",
  lblTitle: "Titel",
  lblArtist: "Artiest",
  lblAlbum: "Album",
  lblRelease: "Release",
  lblTime: "Duur",
  lblSource: "Bron"
};
var pl = {
  tagline: "pobieraj wideo lub muzyk\u0119. wybierz. pobierz. gotowe.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 wi\u0119cej",
  pasteLink: "Wklej link",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "obs\u0142uguje wideo i audio z 1800+ stron",
  notUrl: "to nie wygl\u0105da jak link \u2014 wklej pe\u0142ny url",
  analyzing: "Analizowanie",
  warmingUp: "rozgrzewka\u2026",
  fetchingInfo: "pobieranie informacji o mediach\u2026",
  stepType: "Krok 1/3 \xB7 Co pobra\u0107?",
  stepVideoFormat: "Krok 2/3 \xB7 Format wideo",
  stepAudioFormat: "Krok 2/3 \xB7 Format audio",
  stepResolution: "Krok 3/3 \xB7 Rozdzielczo\u015B\u0107",
  stepFps: "Krok 3/3 \xB7 Cz\u0119stotliwo\u015B\u0107 klatek",
  stepBitrate: "Krok 3/3 \xB7 Bitrate audio",
  videoOption: "Wideo",
  audioOption: "Audio",
  recommended: "zalecane",
  bestQuality: "najlepsza jako\u015B\u0107",
  sourceFps: "fps \u017Ar\xF3d\u0142owy",
  grab: "pobierz",
  history: "historia",
  quit: "wyjd\u017A",
  cancel: "anuluj",
  choose: "wybierz",
  select: "wybierz",
  back: "wstecz",
  theme: "motyw",
  downloading: "pobieranie\u2026",
  processing: "przetwarzanie\u2026",
  starting: "rozpoczynanie pobierania\u2026",
  linkExpired: "link wygas\u0142 \u2014 pobieranie nowego\u2026",
  grabbed: "pobrano!",
  savedTo: "zapisano w:",
  grabAnother: "\u21B5 pobierz kolejne",
  tryAgain: "spr\xF3buj ponownie",
  left: "pozosta\u0142o",
  part: "cz\u0119\u015B\u0107",
  tip: "Wskaz\xF3wka",
  lblTitle: "Tytu\u0142",
  lblArtist: "Artysta",
  lblAlbum: "Album",
  lblRelease: "Wydanie",
  lblTime: "Czas",
  lblSource: "\u0179r\xF3d\u0142o"
};
var uk = {
  tagline: "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0439\u0442\u0435 \u0432\u0456\u0434\u0435\u043E \u0430\u0431\u043E \u043C\u0443\u0437\u0438\u043A\u0443. \u043E\u0431\u0435\u0440\u0456\u0442\u044C. \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435. \u0433\u043E\u0442\u043E\u0432\u043E.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 \u0456\u043D\u0448\u0438\u0445",
  pasteLink: "\u0412\u0441\u0442\u0430\u0432\u0442\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "\u043F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0430 \u0432\u0456\u0434\u0435\u043E \u0442\u0430 \u0430\u0443\u0434\u0456\u043E \u0437 1800+ \u0441\u0430\u0439\u0442\u0456\u0432",
  notUrl: "\u0446\u0435 \u043D\u0435 \u0441\u0445\u043E\u0436\u0435 \u043D\u0430 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u2014 \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u043F\u043E\u0432\u043D\u0438\u0439 url",
  analyzing: "\u0410\u043D\u0430\u043B\u0456\u0437",
  warmingUp: "\u0440\u043E\u0437\u0456\u0433\u0440\u0456\u0432\u2026",
  fetchingInfo: "\u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043D\u044F \u0456\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u0457 \u043F\u0440\u043E \u043C\u0435\u0434\u0456\u0430\u2026",
  stepType: "\u041A\u0440\u043E\u043A 1/3 \xB7 \u0429\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438?",
  stepVideoFormat: "\u041A\u0440\u043E\u043A 2/3 \xB7 \u0424\u043E\u0440\u043C\u0430\u0442 \u0432\u0456\u0434\u0435\u043E",
  stepAudioFormat: "\u041A\u0440\u043E\u043A 2/3 \xB7 \u0424\u043E\u0440\u043C\u0430\u0442 \u0430\u0443\u0434\u0456\u043E",
  stepResolution: "\u041A\u0440\u043E\u043A 3/3 \xB7 \u0420\u043E\u0437\u0434\u0456\u043B\u044C\u043D\u0430 \u0437\u0434\u0430\u0442\u043D\u0456\u0441\u0442\u044C",
  stepFps: "\u041A\u0440\u043E\u043A 3/3 \xB7 \u0427\u0430\u0441\u0442\u043E\u0442\u0430 \u043A\u0430\u0434\u0440\u0456\u0432",
  stepBitrate: "\u041A\u0440\u043E\u043A 3/3 \xB7 \u0411\u0456\u0442\u0440\u0435\u0439\u0442 \u0430\u0443\u0434\u0456\u043E",
  videoOption: "\u0412\u0456\u0434\u0435\u043E",
  audioOption: "\u0410\u0443\u0434\u0456\u043E",
  recommended: "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u043E",
  bestQuality: "\u043D\u0430\u0439\u043A\u0440\u0430\u0449\u0430 \u044F\u043A\u0456\u0441\u0442\u044C",
  sourceFps: "fps \u0434\u0436\u0435\u0440\u0435\u043B\u0430",
  grab: "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
  history: "\u0456\u0441\u0442\u043E\u0440\u0456\u044F",
  quit: "\u0432\u0438\u0445\u0456\u0434",
  cancel: "\u0441\u043A\u0430\u0441\u0443\u0432\u0430\u0442\u0438",
  choose: "\u043E\u0431\u0440\u0430\u0442\u0438",
  select: "\u043E\u0431\u0440\u0430\u0442\u0438",
  back: "\u043D\u0430\u0437\u0430\u0434",
  theme: "\u0442\u0435\u043C\u0430",
  downloading: "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F\u2026",
  processing: "\u043E\u0431\u0440\u043E\u0431\u043A\u0430\u2026",
  starting: "\u043F\u043E\u0447\u0430\u0442\u043E\u043A \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F\u2026",
  linkExpired: "\u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0437\u0430\u0441\u0442\u0430\u0440\u0456\u043B\u043E \u2014 \u043E\u0442\u0440\u0438\u043C\u0443\u0454\u043C\u043E \u043D\u043E\u0432\u0435\u2026",
  grabbed: "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E!",
  savedTo: "\u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E \u0432:",
  grabAnother: "\u21B5 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u0449\u0435",
  tryAgain: "\u0441\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438 \u0437\u043D\u043E\u0432\u0443",
  left: "\u0437\u0430\u043B\u0438\u0448\u0438\u043B\u043E\u0441\u044C",
  part: "\u0447\u0430\u0441\u0442\u0438\u043D\u0430",
  tip: "\u041F\u043E\u0440\u0430\u0434\u0430",
  lblTitle: "\u041D\u0430\u0437\u0432\u0430",
  lblArtist: "\u0412\u0438\u043A\u043E\u043D\u0430\u0432\u0435\u0446\u044C",
  lblAlbum: "\u0410\u043B\u044C\u0431\u043E\u043C",
  lblRelease: "\u0420\u0435\u043B\u0456\u0437",
  lblTime: "\u0422\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C",
  lblSource: "\u0414\u0436\u0435\u0440\u0435\u043B\u043E"
};
var fil = {
  tagline: "mag-download ng video o musika. piliin. i-download. tapos na.",
  sitesLine: "youtube \xB7 tiktok \xB7 instagram \xB7 x \xB7 soundcloud \xB7 +1800 pa",
  pasteLink: "I-paste ang link",
  placeholder: "https://youtube.com/watch?v=\u2026",
  supportsLine: "sumusuporta sa video at audio mula sa 1800+ site",
  notUrl: "hindi iyon mukhang link \u2014 i-paste ang buong url",
  analyzing: "Sinusuri",
  warmingUp: "nagpapainit\u2026",
  fetchingInfo: "kinukuha ang impormasyon ng media\u2026",
  stepType: "Hakbang 1/3 \xB7 Ano ang i-download?",
  stepVideoFormat: "Hakbang 2/3 \xB7 Format ng video",
  stepAudioFormat: "Hakbang 2/3 \xB7 Format ng audio",
  stepResolution: "Hakbang 3/3 \xB7 Resolusyon",
  stepFps: "Hakbang 3/3 \xB7 Frame rate",
  stepBitrate: "Hakbang 3/3 \xB7 Bitrate ng audio",
  videoOption: "Video",
  audioOption: "Audio",
  recommended: "inirerekomenda",
  bestQuality: "pinakamahusay na kalidad",
  sourceFps: "source fps",
  grab: "i-download",
  history: "kasaysayan",
  quit: "lumabas",
  cancel: "kanselahin",
  choose: "pumili",
  select: "pumili",
  back: "bumalik",
  theme: "tema",
  downloading: "nagda-download\u2026",
  processing: "pinoproseso\u2026",
  starting: "sinisimulan ang download\u2026",
  linkExpired: "nag-expire ang link \u2014 kumukuha ng bago\u2026",
  grabbed: "na-download!",
  savedTo: "na-save sa:",
  grabAnother: "\u21B5 mag-download pa",
  tryAgain: "subukan muli",
  left: "natitira",
  part: "bahagi",
  tip: "Tip",
  lblTitle: "Pamagat",
  lblArtist: "Artista",
  lblAlbum: "Album",
  lblRelease: "Release",
  lblTime: "Tagal",
  lblSource: "Pinagmulan"
};
var partial = {
  sv: { grab: "ladda ner", quit: "avsluta", cancel: "avbryt", tip: "Tips", lblTitle: "Titel", lblArtist: "Artist", lblAlbum: "Album", lblRelease: "Sl\xE4pp", lblTime: "L\xE4ngd", lblSource: "K\xE4lla" },
  no: { grab: "last ned", quit: "avslutt", cancel: "avbryt", tip: "Tips", lblTitle: "Tittel", lblArtist: "Artist", lblAlbum: "Album", lblRelease: "Utgivelse", lblTime: "Varighet", lblSource: "Kilde" },
  da: { grab: "download", quit: "afslut", cancel: "annuller", tip: "Tip", lblTitle: "Titel", lblArtist: "Kunstner", lblAlbum: "Album", lblRelease: "Udgivelse", lblTime: "Varighed", lblSource: "Kilde" },
  fi: { grab: "lataa", quit: "poistu", cancel: "peruuta", tip: "Vinkki", lblTitle: "Otsikko", lblArtist: "Artisti", lblAlbum: "Albumi", lblRelease: "Julkaisu", lblTime: "Kesto", lblSource: "L\xE4hde" },
  cs: { grab: "st\xE1hnout", quit: "ukon\u010Dit", cancel: "zru\u0161it", tip: "Tip", lblTitle: "N\xE1zev", lblArtist: "Um\u011Blec", lblAlbum: "Album", lblRelease: "Vyd\xE1n\xED", lblTime: "D\xE9lka", lblSource: "Zdroj" },
  sk: { grab: "stiahnu\u0165", quit: "ukon\u010Di\u0165", cancel: "zru\u0161i\u0165", tip: "Tip", lblTitle: "N\xE1zov", lblArtist: "Umelec", lblAlbum: "Album", lblRelease: "Vydanie", lblTime: "Trvanie", lblSource: "Zdroj" },
  hu: { grab: "let\xF6lt\xE9s", quit: "kil\xE9p\xE9s", cancel: "m\xE9gse", tip: "Tipp", lblTitle: "C\xEDm", lblArtist: "El\u0151ad\xF3", lblAlbum: "Album", lblRelease: "Kiad\xE1s", lblTime: "Hossz", lblSource: "Forr\xE1s" },
  ro: { grab: "descarc\u0103", quit: "ie\u0219ire", cancel: "anulare", tip: "Sfat", lblTitle: "Titlu", lblArtist: "Artist", lblAlbum: "Album", lblRelease: "Lansare", lblTime: "Durat\u0103", lblSource: "Surs\u0103" },
  bg: { grab: "\u0438\u0437\u0442\u0435\u0433\u043B\u0438", quit: "\u0438\u0437\u0445\u043E\u0434", cancel: "\u043E\u0442\u043A\u0430\u0437", tip: "\u0421\u044A\u0432\u0435\u0442", lblTitle: "\u0417\u0430\u0433\u043B\u0430\u0432\u0438\u0435", lblArtist: "\u0418\u0437\u043F\u044A\u043B\u043D\u0438\u0442\u0435\u043B", lblAlbum: "\u0410\u043B\u0431\u0443\u043C", lblRelease: "\u0418\u0437\u0434\u0430\u0432\u0430\u043D\u0435", lblTime: "\u041F\u0440\u043E\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E\u0441\u0442", lblSource: "\u0418\u0437\u0442\u043E\u0447\u043D\u0438\u043A" },
  el: { grab: "\u03BB\u03AE\u03C8\u03B7", quit: "\u03AD\u03BE\u03BF\u03B4\u03BF\u03C2", cancel: "\u03B1\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7", tip: "\u03A3\u03C5\u03BC\u03B2\u03BF\u03C5\u03BB\u03AE", lblTitle: "\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2", lblArtist: "\u039A\u03B1\u03BB\u03BB\u03B9\u03C4\u03AD\u03C7\u03BD\u03B7\u03C2", lblAlbum: "\u0386\u03BB\u03BC\u03C0\u03BF\u03C5\u03BC", lblRelease: "\u039A\u03C5\u03BA\u03BB\u03BF\u03C6\u03BF\u03C1\u03AF\u03B1", lblTime: "\u0394\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1", lblSource: "\u03A0\u03B7\u03B3\u03AE" },
  hr: { grab: "preuzmi", quit: "izlaz", cancel: "odustani", tip: "Savjet", lblTitle: "Naslov", lblArtist: "Izvo\u0111a\u010D", lblAlbum: "Album", lblRelease: "Izdanje", lblTime: "Trajanje", lblSource: "Izvor" },
  sr: { grab: "preuzmi", quit: "izlaz", cancel: "otka\u017Ei", tip: "Savet", lblTitle: "Naslov", lblArtist: "Izvo\u0111a\u010D", lblAlbum: "Album", lblRelease: "Izdanje", lblTime: "Trajanje", lblSource: "Izvor" },
  sl: { grab: "prenesi", quit: "izhod", cancel: "prekli\u010Di", tip: "Nasvet", lblTitle: "Naslov", lblArtist: "Izvajalec", lblAlbum: "Album", lblRelease: "Izdaja", lblTime: "Trajanje", lblSource: "Vir" },
  lt: { grab: "atsisi\u0173sti", quit: "i\u0161eiti", cancel: "at\u0161aukti", tip: "Patarimas", lblTitle: "Pavadinimas", lblArtist: "Atlik\u0117jas", lblAlbum: "Albumas", lblRelease: "Leidimas", lblTime: "Trukm\u0117", lblSource: "\u0160altinis" },
  lv: { grab: "lejupiel\u0101d\u0113t", quit: "iziet", cancel: "atcelt", tip: "Padoms", lblTitle: "Nosaukums", lblArtist: "M\u0101kslinieks", lblAlbum: "Albums", lblRelease: "Izlaidums", lblTime: "Ilgums", lblSource: "Avots" },
  et: { grab: "laadi alla", quit: "v\xE4lju", cancel: "t\xFChista", tip: "Vihje", lblTitle: "Pealkiri", lblArtist: "Esitaja", lblAlbum: "Album", lblRelease: "V\xE4ljalase", lblTime: "Kestus", lblSource: "Allikas" },
  ca: { grab: "descarrega", quit: "surt", cancel: "cancel\xB7la", tip: "Consell", lblTitle: "T\xEDtol", lblArtist: "Artista", lblAlbum: "\xC0lbum", lblRelease: "Llan\xE7ament", lblTime: "Durada", lblSource: "Font" },
  eu: { grab: "deskargatu", quit: "irten", cancel: "utzi", tip: "Aholkua", lblTitle: "Izenburua", lblArtist: "Artista", lblAlbum: "Albuma", lblRelease: "Argitalpena", lblTime: "Iraupena", lblSource: "Iturria" },
  gl: { grab: "descargar", quit: "sa\xEDr", cancel: "cancelar", tip: "Consello", lblTitle: "T\xEDtulo", lblArtist: "Artista", lblAlbum: "\xC1lbum", lblRelease: "Lanzamento", lblTime: "Duraci\xF3n", lblSource: "Fonte" },
  is: { grab: "s\xE6kja", quit: "h\xE6tta", cancel: "h\xE6tta vi\xF0", tip: "\xC1bending", lblTitle: "Titill", lblArtist: "Listama\xF0ur", lblAlbum: "Plata", lblRelease: "\xDAtg\xE1fa", lblTime: "Lengd", lblSource: "Uppruni" },
  ga: { grab: "\xEDosl\xF3d\xE1il", quit: "scoir", cancel: "cealaigh", tip: "Leid", lblTitle: "Teideal", lblArtist: "Eala\xEDont\xF3ir", lblAlbum: "Albam", lblRelease: "Eisi\xFAint", lblTime: "Fad", lblSource: "Foinse" },
  cy: { grab: "lawrlwytho", quit: "gadael", cancel: "canslo", tip: "Awgrym", lblTitle: "Teitl", lblArtist: "Artist", lblAlbum: "Albwm", lblRelease: "Rhyddhau", lblTime: "Hyd", lblSource: "Ffynhonnell" },
  mt: { grab: "ni\u017C\u017Cel", quit: "o\u0127ro\u0121", cancel: "ikkan\u010Bella", tip: "Parir", lblTitle: "Titlu", lblArtist: "Artist", lblAlbum: "Album", lblRelease: "\u0126ru\u0121", lblTime: "Tul", lblSource: "Sors" },
  sq: { grab: "shkarko", quit: "dil", cancel: "anulo", tip: "K\xEBshill\xEB", lblTitle: "Titulli", lblArtist: "Artisti", lblAlbum: "Albumi", lblRelease: "L\xEBshimi", lblTime: "Koh\xEBzgjatja", lblSource: "Burimi" },
  mk: { grab: "\u043F\u0440\u0435\u0437\u0435\u043C\u0438", quit: "\u0438\u0437\u043B\u0435\u0437", cancel: "\u043E\u0442\u043A\u0430\u0436\u0438", tip: "\u0421\u043E\u0432\u0435\u0442", lblTitle: "\u041D\u0430\u0441\u043B\u043E\u0432", lblArtist: "\u0418\u0437\u0432\u0435\u0434\u0443\u0432\u0430\u0447", lblAlbum: "\u0410\u043B\u0431\u0443\u043C", lblRelease: "\u0418\u0437\u0434\u0430\u0432\u0430\u045A\u0435", lblTime: "\u0412\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435", lblSource: "\u0418\u0437\u0432\u043E\u0440" },
  bs: { grab: "preuzmi", quit: "izlaz", cancel: "otka\u017Ei", tip: "Savjet", lblTitle: "Naslov", lblArtist: "Izvo\u0111a\u010D", lblAlbum: "Album", lblRelease: "Izdanje", lblTime: "Trajanje", lblSource: "Izvor" },
  lb: { grab: "eroflueden", quit: "verloossen", cancel: "ofbriechen", tip: "Tipp", lblTitle: "Titel", lblArtist: "K\xEBnschtler", lblAlbum: "Album", lblRelease: "Ver\xEBffentlechung", lblTime: "Dauer", lblSource: "Quell" },
  af: { grab: "aflaai", quit: "verlaat", cancel: "kanselleer", tip: "Wenk", lblTitle: "Titel", lblArtist: "Kunstenaar", lblAlbum: "Album", lblRelease: "Vrystelling", lblTime: "Duur", lblSource: "Bron" },
  sw: { grab: "pakua", quit: "ondoka", cancel: "ghairi", tip: "Kidokezo", lblTitle: "Kichwa", lblArtist: "Msanii", lblAlbum: "Albamu", lblRelease: "Toleo", lblTime: "Muda", lblSource: "Chanzo" },
  am: { grab: "\u12A0\u12CD\u122D\u12F5", quit: "\u12CD\u1323", cancel: "\u1230\u122D\u12DD", tip: "\u121D\u12AD\u122D", lblTitle: "\u122D\u12D5\u1235", lblArtist: "\u12A0\u122D\u1272\u1235\u1275", lblAlbum: "\u12A0\u120D\u1260\u121D", lblRelease: "\u120D\u1240\u1275", lblTime: "\u1246\u12ED\u1273", lblSource: "\u121D\u1295\u132D" },
  hy: { grab: "\u0576\u0565\u0580\u0562\u0565\u057C\u0576\u0565\u056C", quit: "\u0565\u056C\u0584", cancel: "\u0579\u0565\u0572\u0561\u0580\u056F\u0565\u056C", tip: "\u053D\u0578\u0580\u0570\u0578\u0582\u0580\u0564", lblTitle: "\u054E\u0565\u0580\u0576\u0561\u0563\u056B\u0580", lblArtist: "\u0531\u0580\u057F\u056B\u057D\u057F", lblAlbum: "\u0531\u056C\u0562\u0578\u0574", lblRelease: "\u0539\u0578\u0572\u0561\u0580\u056F\u0578\u0582\u0574", lblTime: "\u054F\u0587\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576", lblSource: "\u0531\u0572\u0562\u0575\u0578\u0582\u0580" },
  ka: { grab: "\u10E9\u10D0\u10DB\u10DD\u10E2\u10D5\u10D8\u10E0\u10D7\u10D5\u10D0", quit: "\u10D2\u10D0\u10E1\u10D5\u10DA\u10D0", cancel: "\u10D2\u10D0\u10E3\u10E5\u10DB\u10D4\u10D1\u10D0", tip: "\u10E0\u10E9\u10D4\u10D5\u10D0", lblTitle: "\u10E1\u10D0\u10D7\u10D0\u10E3\u10E0\u10D8", lblArtist: "\u10E8\u10D4\u10DB\u10E1\u10E0\u10E3\u10DA\u10D4\u10D1\u10D4\u10DA\u10D8", lblAlbum: "\u10D0\u10DA\u10D1\u10DD\u10DB\u10D8", lblRelease: "\u10D2\u10D0\u10DB\u10DD\u10E8\u10D5\u10D4\u10D1\u10D0", lblTime: "\u10EE\u10D0\u10DC\u10D2\u10E0\u10EB\u10DA\u10D8\u10D5\u10DD\u10D1\u10D0", lblSource: "\u10EC\u10E7\u10D0\u10E0\u10DD" },
  az: { grab: "y\xFCkl\u0259", quit: "\xE7\u0131x\u0131\u015F", cancel: "l\u0259\u011Fv et", tip: "M\u0259sl\u0259h\u0259t", lblTitle: "Ba\u015Fl\u0131q", lblArtist: "\u0130fa\xE7\u0131", lblAlbum: "Albom", lblRelease: "Burax\u0131l\u0131\u015F", lblTime: "M\xFCdd\u0259t", lblSource: "M\u0259nb\u0259" },
  kk: { grab: "\u0436\u04AF\u043A\u0442\u0435\u0443", quit: "\u0448\u044B\u0493\u0443", cancel: "\u0431\u043E\u043B\u0434\u044B\u0440\u043C\u0430\u0443", tip: "\u041A\u0435\u04A3\u0435\u0441", lblTitle: "\u0410\u0442\u0430\u0443\u044B", lblArtist: "\u04D8\u0440\u0442\u0456\u0441", lblAlbum: "\u0410\u043B\u044C\u0431\u043E\u043C", lblRelease: "\u0428\u044B\u0493\u0430\u0440\u044B\u043B\u044B\u043C", lblTime: "\u04B0\u0437\u0430\u049B\u0442\u044B\u0493\u044B", lblSource: "\u0414\u0435\u0440\u0435\u043A\u043A\u04E9\u0437" },
  ky: { grab: "\u0436\u04AF\u043A\u0442\u04E9\u04E9", quit: "\u0447\u044B\u0433\u0443\u0443", cancel: "\u0436\u043E\u043A\u043A\u043E \u0447\u044B\u0433\u0430\u0440\u0443\u0443", tip: "\u041A\u0435\u04A3\u0435\u0448", lblTitle: "\u0410\u0442\u0430\u043B\u044B\u0448\u044B", lblArtist: "\u0410\u0440\u0442\u0438\u0441\u0442", lblAlbum: "\u0410\u043B\u044C\u0431\u043E\u043C", lblRelease: "\u0427\u044B\u0433\u0430\u0440\u044B\u043B\u044B\u0448", lblTime: "\u0423\u0437\u0430\u043A\u0442\u044B\u0433\u044B", lblSource: "\u0411\u0443\u043B\u0430\u043A" },
  uz: { grab: "yuklab olish", quit: "chiqish", cancel: "bekor qilish", tip: "Maslahat", lblTitle: "Sarlavha", lblArtist: "Ijrochi", lblAlbum: "Albom", lblRelease: "Reliz", lblTime: "Davomiyligi", lblSource: "Manba" },
  tg: { grab: "\u0431\u043E\u0440\u0433\u0438\u0440\u04E3", quit: "\u0431\u0430\u0440\u043E\u043C\u0430\u0434", cancel: "\u0431\u0435\u043A\u043E\u0440", tip: "\u041C\u0430\u0441\u043B\u0438\u04B3\u0430\u0442", lblTitle: "\u0421\u0430\u0440\u043B\u0430\u0432\u04B3\u0430", lblArtist: "\u04B2\u0443\u043D\u0430\u0440\u043C\u0430\u043D\u0434", lblAlbum: "\u0410\u043B\u0431\u043E\u043C", lblRelease: "\u041D\u0430\u0448\u0440", lblTime: "\u0414\u0430\u0432\u043E\u043C\u043D\u043E\u043A\u04E3", lblSource: "\u041C\u0430\u043D\u0431\u0430\u044A" },
  tk: { grab: "\xFD\xFCkle", quit: "\xE7yk", cancel: "\xFDatyr", tip: "Maslahat", lblTitle: "Ady", lblArtist: "Artist", lblAlbum: "Albom", lblRelease: "\xC7yky\u015F", lblTime: "Dowamlylygy", lblSource: "\xC7e\u015Fme" },
  mn: { grab: "\u0442\u0430\u0442\u0430\u0445", quit: "\u0433\u0430\u0440\u0430\u0445", cancel: "\u0446\u0443\u0446\u043B\u0430\u0445", tip: "\u0417\u04E9\u0432\u043B\u04E9\u0433\u04E9\u04E9", lblTitle: "\u0413\u0430\u0440\u0447\u0438\u0433", lblArtist: "\u0423\u0440\u0430\u043D \u0431\u04AF\u0442\u044D\u044D\u043B\u0447", lblAlbum: "\u0426\u043E\u043C\u043E\u0433", lblRelease: "\u0425\u044D\u0432\u043B\u044D\u043B\u0442", lblTime: "\u04AE\u0440\u0433\u044D\u043B\u0436\u043B\u044D\u0445 \u0445\u0443\u0433\u0430\u0446\u0430\u0430", lblSource: "\u042D\u0445 \u0441\u0443\u0440\u0432\u0430\u043B\u0436" },
  ne: { grab: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921", quit: "\u092C\u093E\u0939\u093F\u0930", cancel: "\u0930\u0926\u094D\u0926", tip: "\u0938\u0941\u091D\u093E\u0935", lblTitle: "\u0936\u0940\u0930\u094D\u0937\u0915", lblArtist: "\u0915\u0932\u093E\u0915\u093E\u0930", lblAlbum: "\u090F\u0932\u094D\u092C\u092E", lblRelease: "\u0930\u093F\u0932\u093F\u091C", lblTime: "\u0905\u0935\u0927\u093F", lblSource: "\u0938\u094D\u0930\u094B\u0924" },
  bn: { grab: "\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1", quit: "\u09AA\u09CD\u09B0\u09B8\u09CD\u09A5\u09BE\u09A8", cancel: "\u09AC\u09BE\u09A4\u09BF\u09B2", tip: "\u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6", lblTitle: "\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE", lblArtist: "\u09B6\u09BF\u09B2\u09CD\u09AA\u09C0", lblAlbum: "\u0985\u09CD\u09AF\u09BE\u09B2\u09AC\u09BE\u09AE", lblRelease: "\u09B0\u09BF\u09B2\u09BF\u099C", lblTime: "\u09B8\u09AE\u09AF\u09BC\u0995\u09BE\u09B2", lblSource: "\u0989\u09CE\u09B8" },
  fa: { grab: "\u062F\u0627\u0646\u0644\u0648\u062F", quit: "\u062E\u0631\u0648\u062C", cancel: "\u0644\u063A\u0648", tip: "\u0646\u06A9\u062A\u0647", lblTitle: "\u0639\u0646\u0648\u0627\u0646", lblArtist: "\u0647\u0646\u0631\u0645\u0646\u062F", lblAlbum: "\u0622\u0644\u0628\u0648\u0645", lblRelease: "\u0627\u0646\u062A\u0634\u0627\u0631", lblTime: "\u0645\u062F\u062A", lblSource: "\u0645\u0646\u0628\u0639" },
  he: { grab: "\u05D4\u05D5\u05E8\u05D3", quit: "\u05D9\u05E6\u05D9\u05D0\u05D4", cancel: "\u05D1\u05D9\u05D8\u05D5\u05DC", tip: "\u05D8\u05D9\u05E4", lblTitle: "\u05DB\u05D5\u05EA\u05E8\u05EA", lblArtist: "\u05D0\u05DE\u05DF", lblAlbum: "\u05D0\u05DC\u05D1\u05D5\u05DD", lblRelease: "\u05E9\u05D7\u05E8\u05D5\u05E8", lblTime: "\u05DE\u05E9\u05DA", lblSource: "\u05DE\u05E7\u05D5\u05E8" },
  ur: { grab: "\u0688\u0627\u0624\u0646 \u0644\u0648\u0688", quit: "\u0628\u0627\u06C1\u0631", cancel: "\u0645\u0646\u0633\u0648\u062E", tip: "\u0645\u0634\u0648\u0631\u06C1", lblTitle: "\u0639\u0646\u0648\u0627\u0646", lblArtist: "\u0641\u0646\u06A9\u0627\u0631", lblAlbum: "\u0627\u0644\u0628\u0645", lblRelease: "\u0627\u062C\u0631\u0627", lblTime: "\u062F\u0648\u0631\u0627\u0646\u06CC\u06C1", lblSource: "\u0645\u0627\u062E\u0630" },
  ps: { grab: "\u0689\u0627\u0648\u0646\u0644\u0648\u0689", quit: "\u0648\u062A\u0644", cancel: "\u0644\u063A\u0648\u0647", tip: "\u0644\u0627\u0631\u069A\u0648\u0648\u0646\u0647", lblTitle: "\u0633\u0631\u0644\u06CC\u06A9", lblArtist: "\u0647\u0646\u0631\u0645\u0646\u062F", lblAlbum: "\u0627\u0644\u0628\u0648\u0645", lblRelease: "\u062E\u067E\u0631\u0648\u0644", lblTime: "\u0645\u0648\u062F\u0647", lblSource: "\u0633\u0631\u0686\u06CC\u0646\u0647" },
  ku: { grab: "daxistin", quit: "derketin", cancel: "betal", tip: "\u015E\xEEret", lblTitle: "Sernav", lblArtist: "Hunermend", lblAlbum: "Alb\xFBm", lblRelease: "We\u015Fan", lblTime: "Dem", lblSource: "\xC7avkan\xEE" },
  km: { grab: "\u1791\u17B6\u1789\u1799\u1780", quit: "\u1785\u17C1\u1789", cancel: "\u1794\u17C4\u17C7\u1794\u1784\u17CB", tip: "\u1782\u1793\u17D2\u179B\u17B9\u17C7", lblTitle: "\u1785\u17C6\u178E\u1784\u1787\u17BE\u1784", lblArtist: "\u179F\u17B7\u179B\u17D2\u1794\u1780\u179A", lblAlbum: "\u17A2\u17B6\u179B\u17CB\u1794\u17CA\u17BB\u1798", lblRelease: "\u1780\u17B6\u179A\u1785\u17C1\u1789\u1795\u17D2\u179F\u17B6\u1799", lblTime: "\u179A\u1799\u17C8\u1796\u17C1\u179B", lblSource: "\u1794\u17D2\u179A\u1797\u1796" },
  lo: { grab: "\u0E94\u0EB2\u0EA7\u0EC2\u0EAB\u0EA5\u0E94", quit: "\u0EAD\u0EAD\u0E81", cancel: "\u0E8D\u0EBB\u0E81\u0EC0\u0EA5\u0EB5\u0E81", tip: "\u0E84\u0EB3\u0EC1\u0E99\u0EB0\u0E99\u0EB3", lblTitle: "\u0EAB\u0EBB\u0EA7\u0E82\u0ECD\u0EC9", lblArtist: "\u0EAA\u0EB4\u0E99\u0EA5\u0EB0\u0E9B\u0EB4\u0E99", lblAlbum: "\u0EAD\u0EB0\u0EA5\u0EB0\u0E9A\u0EB3", lblRelease: "\u0E81\u0EB2\u0E99\u0E9B\u0EC8\u0EAD\u0E8D", lblTime: "\u0EC4\u0EA5\u0E8D\u0EB0\u0EC0\u0EA7\u0EA5\u0EB2", lblSource: "\u0EC1\u0EAB\u0EBC\u0EC8\u0E87" },
  my: { grab: "\u1012\u1031\u102B\u1004\u103A\u1038\u101C\u102F\u1012\u103A", quit: "\u1011\u103D\u1000\u103A", cancel: "\u1015\u101A\u103A\u1016\u103B\u1000\u103A", tip: "\u1021\u1000\u103C\u1036\u1015\u103C\u102F\u1001\u103B\u1000\u103A", lblTitle: "\u1001\u1031\u102B\u1004\u103A\u1038\u1005\u1009\u103A", lblArtist: "\u1021\u1014\u102F\u1015\u100A\u102C\u101B\u103E\u1004\u103A", lblAlbum: "\u1021\u101A\u103A\u101C\u103A\u1018\u1019\u103A", lblRelease: "\u1011\u102F\u1010\u103A\u101D\u1031", lblTime: "\u1000\u103C\u102C\u1001\u103B\u102D\u1014\u103A", lblSource: "\u1021\u101B\u1004\u103A\u1038\u1021\u1019\u103C\u1005\u103A" },
  si: { grab: "\u0DB6\u0DCF\u0D9C\u0DB1\u0DCA\u0DB1", quit: "\u0DB4\u0DD2\u0DA7\u0DC0\u0DB1\u0DCA\u0DB1", cancel: "\u0D85\u0DC0\u0DBD\u0D82\u0D9C\u0DD4", tip: "\u0D89\u0D9F\u0DD2\u0DBA", lblTitle: "\u0DB8\u0DCF\u0DAD\u0DD8\u0D9A\u0DCF\u0DC0", lblArtist: "\u0D9A\u0DBD\u0DCF\u0D9A\u0DBB\u0DD4", lblAlbum: "\u0D87\u0DBD\u0DCA\u0DB6\u0DB8\u0DBA", lblRelease: "\u0DB1\u0DD2\u0D9A\u0DD4\u0DAD\u0DD4\u0DC0", lblTime: "\u0D9A\u0DCF\u0DBD\u0DBA", lblSource: "\u0DB8\u0DD6\u0DBD\u0DCF\u0DC1\u0DCA\u200D\u0DBB\u0DBA" },
  ta: { grab: "\u0BAA\u0BA4\u0BBF\u0BB5\u0BBF\u0BB1\u0B95\u0BCD\u0B95\u0BC1", quit: "\u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC7\u0BB1\u0BC1", cancel: "\u0BB0\u0BA4\u0BCD\u0BA4\u0BC1", tip: "\u0B95\u0BC1\u0BB1\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1", lblTitle: "\u0BA4\u0BB2\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1", lblArtist: "\u0B95\u0BB2\u0BC8\u0B9E\u0BB0\u0BCD", lblAlbum: "\u0B86\u0BB2\u0BCD\u0BAA\u0BAE\u0BCD", lblRelease: "\u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC0\u0B9F\u0BC1", lblTime: "\u0BA8\u0BC7\u0BB0\u0BAE\u0BCD", lblSource: "\u0BAE\u0BC2\u0BB2\u0BAE\u0BCD" },
  te: { grab: "\u0C21\u0C4C\u0C28\u0C4D\u200C\u0C32\u0C4B\u0C21\u0C4D", quit: "\u0C28\u0C3F\u0C37\u0C4D\u0C15\u0C4D\u0C30\u0C2E\u0C3F\u0C02\u0C1A\u0C41", cancel: "\u0C30\u0C26\u0C4D\u0C26\u0C41", tip: "\u0C1A\u0C3F\u0C1F\u0C4D\u0C15\u0C3E", lblTitle: "\u0C36\u0C40\u0C30\u0C4D\u0C37\u0C3F\u0C15", lblArtist: "\u0C15\u0C33\u0C3E\u0C15\u0C3E\u0C30\u0C41\u0C21\u0C41", lblAlbum: "\u0C06\u0C32\u0C4D\u0C2C\u0C2E\u0C4D", lblRelease: "\u0C35\u0C3F\u0C21\u0C41\u0C26\u0C32", lblTime: "\u0C35\u0C4D\u0C2F\u0C35\u0C27\u0C3F", lblSource: "\u0C2E\u0C42\u0C32\u0C02" },
  kn: { grab: "\u0CA1\u0CCC\u0CA8\u0CCD\u200C\u0CB2\u0CCB\u0CA1\u0CCD", quit: "\u0CA8\u0CBF\u0CB0\u0CCD\u0C97\u0CAE\u0CBF\u0CB8\u0CBF", cancel: "\u0CB0\u0CA6\u0CCD\u0CA6\u0CC1", tip: "\u0CB8\u0CB2\u0CB9\u0CC6", lblTitle: "\u0CB6\u0CC0\u0CB0\u0CCD\u0CB7\u0CBF\u0C95\u0CC6", lblArtist: "\u0C95\u0CB2\u0CBE\u0CB5\u0CBF\u0CA6", lblAlbum: "\u0C86\u0CB2\u0CCD\u0CAC\u0CAE\u0CCD", lblRelease: "\u0CAC\u0CBF\u0CA1\u0CC1\u0C97\u0CA1\u0CC6", lblTime: "\u0C85\u0CB5\u0CA7\u0CBF", lblSource: "\u0CAE\u0CC2\u0CB2" },
  ml: { grab: "\u0D21\u0D57\u0D7A\u0D32\u0D4B\u0D21\u0D4D", quit: "\u0D2A\u0D41\u0D31\u0D24\u0D4D\u0D24\u0D41\u0D15\u0D1F\u0D15\u0D4D\u0D15\u0D41\u0D15", cancel: "\u0D31\u0D26\u0D4D\u0D26\u0D3E\u0D15\u0D4D\u0D15\u0D41\u0D15", tip: "\u0D28\u0D41\u0D31\u0D41\u0D19\u0D4D\u0D19\u0D4D", lblTitle: "\u0D36\u0D40\u0D7C\u0D37\u0D15\u0D02", lblArtist: "\u0D15\u0D32\u0D3E\u0D15\u0D3E\u0D30\u0D7B", lblAlbum: "\u0D06\u0D7D\u0D2C\u0D02", lblRelease: "\u0D31\u0D3F\u0D32\u0D40\u0D38\u0D4D", lblTime: "\u0D26\u0D48\u0D7C\u0D18\u0D4D\u0D2F\u0D02", lblSource: "\u0D09\u0D31\u0D35\u0D3F\u0D1F\u0D02" },
  mr: { grab: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921", quit: "\u092C\u093E\u0939\u0947\u0930 \u092A\u0921\u093E", cancel: "\u0930\u0926\u094D\u0926 \u0915\u0930\u093E", tip: "\u091F\u0940\u092A", lblTitle: "\u0936\u0940\u0930\u094D\u0937\u0915", lblArtist: "\u0915\u0932\u093E\u0915\u093E\u0930", lblAlbum: "\u0905\u0932\u094D\u092C\u092E", lblRelease: "\u092A\u094D\u0930\u0915\u093E\u0936\u0928", lblTime: "\u0915\u093E\u0932\u093E\u0935\u0927\u0940", lblSource: "\u0938\u094D\u0930\u094B\u0924" },
  gu: { grab: "\u0AA1\u0ABE\u0A89\u0AA8\u0AB2\u0ACB\u0AA1", quit: "\u0AAC\u0AB9\u0ABE\u0AB0 \u0AA8\u0AC0\u0A95\u0AB3\u0ACB", cancel: "\u0AB0\u0AA6 \u0A95\u0AB0\u0ACB", tip: "\u0A9F\u0ABF\u0AAA", lblTitle: "\u0AB6\u0AC0\u0AB0\u0ACD\u0AB7\u0A95", lblArtist: "\u0A95\u0AB2\u0ABE\u0A95\u0ABE\u0AB0", lblAlbum: "\u0A86\u0AB2\u0ACD\u0AAC\u0AAE", lblRelease: "\u0AB0\u0ABF\u0AB2\u0AC0\u0A9D", lblTime: "\u0AB8\u0AAE\u0AAF\u0A97\u0ABE\u0AB3\u0ACB", lblSource: "\u0AB8\u0ACD\u0AB0\u0ACB\u0AA4" },
  pa: { grab: "\u0A21\u0A3E\u0A0A\u0A28\u0A32\u0A4B\u0A21", quit: "\u0A2C\u0A3E\u0A39\u0A30", cancel: "\u0A30\u0A71\u0A26", tip: "\u0A38\u0A41\u0A1D\u0A3E\u0A05", lblTitle: "\u0A38\u0A3F\u0A30\u0A32\u0A47\u0A16", lblArtist: "\u0A15\u0A32\u0A3E\u0A15\u0A3E\u0A30", lblAlbum: "\u0A10\u0A32\u0A2C\u0A2E", lblRelease: "\u0A30\u0A3F\u0A32\u0A40\u0A1C\u0A3C", lblTime: "\u0A2E\u0A3F\u0A06\u0A26", lblSource: "\u0A38\u0A30\u0A4B\u0A24" },
  or: { grab: "\u0B21\u0B3E\u0B09\u0B28\u0B32\u0B4B\u0B21\u0B4D", quit: "\u0B2C\u0B3E\u0B39\u0B3E\u0B30", cancel: "\u0B2C\u0B3E\u0B24\u0B3F\u0B32", tip: "\u0B2A\u0B30\u0B3E\u0B2E\u0B30\u0B4D\u0B36", lblTitle: "\u0B36\u0B40\u0B30\u0B4D\u0B37\u0B15", lblArtist: "\u0B15\u0B33\u0B3E\u0B15\u0B3E\u0B30", lblAlbum: "\u0B06\u0B32\u0B2C\u0B2E\u0B4D", lblRelease: "\u0B30\u0B3F\u0B32\u0B3F\u0B1C\u0B4D", lblTime: "\u0B38\u0B2E\u0B5F", lblSource: "\u0B09\u0B24\u0B4D\u0B38" },
  as: { grab: "\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1", quit: "\u0993\u09B2\u09BE\u0993\u0995", cancel: "\u09AC\u09BE\u09A4\u09BF\u09B2", tip: "\u09AA\u09F0\u09BE\u09AE\u09F0\u09CD\u09B6", lblTitle: "\u09B6\u09C0\u09F0\u09CD\u09B7\u0995", lblArtist: "\u09B6\u09BF\u09B2\u09CD\u09AA\u09C0", lblAlbum: "\u098F\u09B2\u09AC\u09BE\u09AE", lblRelease: "\u09AE\u09C1\u0995\u09CD\u09A4\u09BF", lblTime: "\u09B8\u09AE\u09AF\u09BC", lblSource: "\u0989\u09CE\u09B8" },
  ha: { grab: "sauke", quit: "fita", cancel: "soke", tip: "Shawara", lblTitle: "Take", lblArtist: "Mai fasaha", lblAlbum: "Album", lblRelease: "Saki", lblTime: "Lokaci", lblSource: "Tushe" },
  yo: { grab: "gba sil\u1EB9", quit: "jade", cancel: "fagilee", tip: "Im\u1ECDran", lblTitle: "Ak\u1ECDle", lblArtist: "O\u1E63ere", lblAlbum: "Awo-orin", lblRelease: "Itusil\u1EB9", lblTime: "Akoko", lblSource: "Orisun" },
  ig: { grab: "budata", quit: "p\u1EE5\u1ECD", cancel: "kagbuo", tip: "Nd\u1EE5m\u1ECDd\u1EE5", lblTitle: "Aha", lblArtist: "Onye na-ese", lblAlbum: "Album", lblRelease: "Mwep\u1EE5ta", lblTime: "Oge", lblSource: "Isi iyi" },
  zu: { grab: "landa", quit: "phuma", cancel: "khansela", tip: "Ithiphu", lblTitle: "Isihloko", lblArtist: "Umculi", lblAlbum: "Album", lblRelease: "Ukukhishwa", lblTime: "Isikhathi", lblSource: "Umthombo" },
  xh: { grab: "khuphela", quit: "phuma", cancel: "rhoxisa", tip: "Icebo", lblTitle: "Isihloko", lblArtist: "Umculi", lblAlbum: "Album", lblRelease: "Ukhutsho", lblTime: "Ixesha", lblSource: "Umthombo" },
  ht: { grab: "telechaje", quit: "soti", cancel: "anile", tip: "Kons\xE8y", lblTitle: "Tit", lblArtist: "Atis", lblAlbum: "Album", lblRelease: "Lage", lblTime: "Dire", lblSource: "Sous" },
  so: { grab: "soo deji", quit: "ka bax", cancel: "jooji", tip: "Talo", lblTitle: "Cinwaan", lblArtist: "Fanaan", lblAlbum: "Album", lblRelease: "Sii dayn", lblTime: "Muddo", lblSource: "Il" },
  rw: { grab: "gukuramo", quit: "sohoka", cancel: "hagarika", tip: "Inama", lblTitle: "Umutwe", lblArtist: "Umukinnyi", lblAlbum: "Album", lblRelease: "Irekurwa", lblTime: "Igihe", lblSource: "Isoko" },
  ln: { grab: "kokitisa", quit: "kobima", cancel: "kotika", tip: "Toli", lblTitle: "Mot\xF3", lblArtist: "Moyembi", lblAlbum: "Album", lblRelease: "Bimisa", lblTime: "Ntango", lblSource: "Esika" },
  lg: { grab: "wanula", quit: "fuluma", cancel: "sazaamu", tip: "Amagezi", lblTitle: "Omutwe", lblArtist: "Omuyimbi", lblAlbum: "Album", lblRelease: "Okufulumya", lblTime: "Obudde", lblSource: "Ensibuko" },
  sn: { grab: "dhawunirodha", quit: "buda", cancel: "kanzura", tip: "Zano", lblTitle: "Zita", lblArtist: "Muimbi", lblAlbum: "Album", lblRelease: "Kuburitswa", lblTime: "Nguva", lblSource: "Kwakabva" },
  st: { grab: "jarolla", quit: "tsoa", cancel: "hlakola", tip: "Keletso", lblTitle: "Sehlooho", lblArtist: "Sebini", lblAlbum: "Album", lblRelease: "Tokollo", lblTime: "Nako", lblSource: "Mohloli" },
  tn: { grab: "tsaya", quit: "tsamaya", cancel: "khansela", tip: "Kgakololo", lblTitle: "Setlhogo", lblArtist: "Moopedi", lblAlbum: "Album", lblRelease: "Kgatiso", lblTime: "Nako", lblSource: "Motswedi" },
  ny: { grab: "tsitsa", quit: "tuluka", cancel: "lekani", tip: "Malangizo", lblTitle: "Mutu", lblArtist: "Wojambula", lblAlbum: "Album", lblRelease: "Kutuluka", lblTime: "Nthawi", lblSource: "Gwero" },
  mg: { grab: "ampidino", quit: "hivoaka", cancel: "hanafoana", tip: "Torohevitra", lblTitle: "Lohateny", lblArtist: "Mpanakanto", lblAlbum: "Album", lblRelease: "Famoahana", lblTime: "Fotoana", lblSource: "Loharano" },
  eo: { grab: "el\u015Duti", quit: "eliri", cancel: "nuligi", tip: "Konsilo", lblTitle: "Titolo", lblArtist: "Artisto", lblAlbum: "Albumo", lblRelease: "Eldono", lblTime: "Da\u016Dro", lblSource: "Fonto" },
  la: { grab: "detrahere", quit: "exire", cancel: "irritum", tip: "Consilium", lblTitle: "Titulus", lblArtist: "Artifex", lblAlbum: "Album", lblRelease: "Editio", lblTime: "Tempus", lblSource: "Fons" },
  yi: { grab: "\u05D0\u05B7\u05E8\u05D0\u05B8\u05E4\u05BC\u05DC\u05D0\u05B8\u05D3\u05DF", quit: "\u05D0\u05B7\u05E8\u05D5\u05D9\u05E1\u05D2\u05D0\u05B7\u05E0\u05D2", cancel: "\u05D0\u05B8\u05E4\u05BC\u05D6\u05D0\u05B8\u05D2\u05DF", tip: "\u05E2\u05E6\u05D4", lblTitle: "\u05D8\u05D9\u05D8\u05DC", lblArtist: "\u05E7\u05D5\u05E0\u05E1\u05D8\u05DC\u05E2\u05E8", lblAlbum: "\u05D0\u05B7\u05DC\u05D1\u05D0\u05B8\u05DD", lblRelease: "\u05D0\u05B7\u05E8\u05D5\u05D9\u05E1\u05DC\u05D0\u05B8\u05D6\u05DF", lblTime: "\u05E6\u05F2\u05B7\u05D8", lblSource: "\u05DE\u05E7\u05D5\u05E8" },
  bo: { grab: "\u0F55\u0F56\u0F0B\u0F63\u0F7A\u0F53", quit: "\u0F55\u0FB1\u0F72\u0F62\u0F0B\u0F50\u0F7C\u0F53", cancel: "\u0F60\u0F51\u0F7C\u0F62\u0F0B\u0F56", tip: "\u0F56\u0F66\u0FB3\u0F56\u0F0B\u0F56\u0FB1", lblTitle: "\u0F41\u0F0B\u0F56\u0FB1\u0F44", lblArtist: "\u0F66\u0F92\u0FB1\u0F74\u0F0B\u0F62\u0FA9\u0F63\u0F0B\u0F54", lblAlbum: "\u0F46\u0F0B\u0F5A\u0F44", lblRelease: "\u0F60\u0F42\u0FB2\u0F7A\u0F58\u0F66\u0F0B\u0F66\u0FA4\u0F7A\u0F63", lblTime: "\u0F51\u0F74\u0F66\u0F0B\u0F5A\u0F7C\u0F51", lblSource: "\u0F41\u0F74\u0F44\u0F66" },
  ug: { grab: "\u0686\u06C8\u0634\u06C8\u0631\u06C8\u0634", quit: "\u0686\u0649\u0642\u0649\u0634", cancel: "\u0628\u0649\u0643\u0627\u0631", tip: "\u0643\u06C6\u0631\u0633\u06D5\u062A\u0645\u06D5", lblTitle: "\u0645\u0627\u06CB\u0632\u06C7", lblArtist: "\u0633\u06D5\u0646\u0626\u06D5\u062A\u0643\u0627\u0631", lblAlbum: "\u0626\u0627\u0644\u0628\u0648\u0645", lblRelease: "\u062A\u0627\u0631\u0642\u0649\u062A\u0649\u0634", lblTime: "\u06CB\u0627\u0642\u0649\u062A", lblSource: "\u0645\u06D5\u0646\u0628\u06D5" },
  dv: { grab: "\u0791\u07A6\u0787\u07AA\u0782\u07B0\u078D\u07AF\u0791\u07B0", quit: "\u0782\u07AA\u0786\u07AA\u0782\u07B0\u0782\u07A7", cancel: "\u0786\u07AC\u0782\u07B0\u0790\u07A6\u078D\u07B0", tip: "\u0782\u07A6\u0790\u07AD\u0780\u07A6\u078C\u07B0", lblTitle: "\u0790\u07AA\u0783\u07AA\u079A\u07A9", lblArtist: "\u078A\u07A6\u0782\u0782\u07B0\u0782\u07A7\u0782\u07B0", lblAlbum: "\u0787\u07A6\u078D\u07B0\u0784\u07A6\u0789\u07B0", lblRelease: "\u0783\u07A8\u078D\u07A9\u0790\u07B0", lblTime: "\u0788\u07A6\u078E\u07AA\u078C\u07AA", lblSource: "\u0789\u07A6\u0790\u07B0\u078B\u07A6\u0783\u07AA" },
  haw: { grab: "ho\u02BBoiho", quit: "ha\u02BBalele", cancel: "k\u0101pae", tip: "Mana\u02BBo", lblTitle: "Po\u02BBo", lblArtist: "Mea hana", lblAlbum: "Album", lblRelease: "Ho\u02BBoku\u02BBu", lblTime: "Ka l\u014D\u02BBihi", lblSource: "Kumu" },
  mi: { grab: "tango", quit: "puta", cancel: "whakakore", tip: "Tohutohu", lblTitle: "Taitara", lblArtist: "Kaitoi", lblAlbum: "Pukaemi", lblRelease: "Tuku", lblTime: "Roanga", lblSource: "P\u016Btake" },
  sm: { grab: "sii mai", quit: "alu ese", cancel: "faaleaoga", tip: "Fautuaga", lblTitle: "Ulutala", lblArtist: "Tusitala", lblAlbum: "Album", lblRelease: "Lolomi", lblTime: "Umi", lblSource: "Punavai" },
  to: { grab: "download", quit: "mavae", cancel: "kaniseli", tip: "Fale\u02BBi", lblTitle: "Ulunga", lblArtist: "Tokotaha", lblAlbum: "Album", lblRelease: "Tuku", lblTime: "Taimi", lblSource: "Ma\u02BBu\u02BBanga" },
  fj: { grab: "lavetaka", quit: "biuta", cancel: "bokoca", tip: "iVakaro", lblTitle: "iYatukana", lblArtist: "Dauveiqaravi", lblAlbum: "Album", lblRelease: "Vakadewa", lblTime: "Gauna", lblSource: "iVurevure" }
};
var table = { en, id, es, fr, de, pt, it, ru, ja, ko, zh, "zh-TW": zhTW, ar, hi, tr, vi, th, ms, nl, pl, uk, fil };
function merge(base, override) {
  return { ...base, ...override };
}
for (const [code, p] of Object.entries(partial)) {
  table[code] = merge(en, p);
}
function normalizeLocale(raw) {
  if (!raw) return void 0;
  const cleaned = raw.split(".")[0].replace("_", "-");
  const lower = cleaned.toLowerCase();
  if (lower === "zh-tw" || lower === "zh-hk") return "zh-TW";
  return lower.split("-")[0];
}
function detectLanguage() {
  const explicit = process.env.CARBON_LANG;
  if (explicit) {
    const norm = normalizeLocale(explicit);
    if (norm && table[norm]) return norm;
  }
  for (const envVar of ["LC_ALL", "LC_MESSAGES", "LANG", "LANGUAGE"]) {
    const norm = normalizeLocale(process.env[envVar]);
    if (norm && table[norm]) return norm;
  }
  try {
    const sysLocale = normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale);
    if (sysLocale && table[sysLocale]) return sysLocale;
  } catch {
  }
  return "en";
}
var currentLang = detectLanguage();
function getLanguage() {
  return currentLang;
}
function t() {
  return table[currentLang] ?? en;
}

// src/lib/formats.ts
var VIDEO_FORMATS = [
  { id: "mp4", label: "MP4", ext: "mp4", recommended: true, descKey: "fmtMp4" },
  { id: "mkv", label: "MKV", ext: "mkv", descKey: "fmtMkv" },
  { id: "webm", label: "WEBM", ext: "webm", descKey: "fmtWebm" },
  { id: "mov", label: "MOV", ext: "mov", descKey: "fmtMov" },
  { id: "avi", label: "AVI", ext: "avi", descKey: "fmtAvi" }
];
var AUDIO_FORMATS = [
  { id: "mp3", label: "MP3", ext: "mp3", recommended: true, descKey: "fmtMp3", bitrates: [8, 16, 24, 32, 48, 64, 96, 112, 128, 160, 192, 224, 256, 320] },
  { id: "aac", label: "AAC", ext: "m4a", descKey: "fmtAac", bitrates: [8, 16, 24, 32, 48, 64, 96, 112, 128, 160, 192, 224, 256, 320, 384, 512] },
  { id: "m4a", label: "M4A", ext: "m4a", descKey: "fmtM4a", bitrates: [8, 16, 24, 32, 48, 64, 96, 112, 128, 160, 192, 224, 256, 320, 384, 512] },
  { id: "flac", label: "FLAC", ext: "flac", descKey: "fmtFlac" },
  { id: "wav", label: "WAV", ext: "wav", descKey: "fmtWav" }
];
function fmtDesc(descKey) {
  const s = t();
  return s[descKey] ?? descKey;
}
function hasBitrateOptions(format) {
  return Boolean(format.bitrates && format.bitrates.length > 0);
}
function bitrateItems(format) {
  const s = t();
  const rates = [...format.bitrates ?? []].sort((a, b) => b - a);
  return rates.map((kbps) => ({
    key: String(kbps),
    label: `${kbps} kbps${kbps >= 320 ? `  \u2605 ${s.brHighest}` : kbps >= 192 ? `  ${s.brHigh}` : kbps >= 128 ? `  ${s.brStandard}` : `  ${s.brSmall}`}`,
    value: kbps
  }));
}
var FPS_OPTIONS = [
  { value: 0, label: "Source FPS", descKey: "fpsSource" },
  { value: 24, label: "24 FPS", descKey: "fps24" },
  { value: 30, label: "30 FPS", descKey: "fps30" },
  { value: 60, label: "60 FPS", descKey: "fps60" }
];
var RESOLUTIONS = [
  { value: 0, label: "Best available", descKey: "resBest" },
  { value: 2160, label: "2160p (4K)", descKey: "res2160" },
  { value: 1440, label: "1440p (2K)", descKey: "res1440" },
  { value: 1080, label: "1080p", descKey: "res1080" },
  { value: 720, label: "720p", descKey: "res720" },
  { value: 480, label: "480p", descKey: "res480" },
  { value: 360, label: "360p", descKey: "res360" }
];

// src/lib/history.ts
import fs from "fs";
import os from "os";
import path from "path";
var HISTORY_FILE = path.join(os.homedir(), ".config", "carbon", "history.json");
var LIMIT = 50;
function loadHistory() {
  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
  } catch {
    return [];
  }
}
function addToHistory(url) {
  const next = [url, ...loadHistory().filter((entry) => entry !== url)].slice(0, LIMIT);
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(HISTORY_FILE, `${JSON.stringify(next, null, 2)}
`);
  } catch {
  }
  return next;
}

// src/lib/platforms.ts
var PLATFORMS = [
  { hosts: ["youtube.com", "youtu.be", "music.youtube.com"], platform: { key: "youtube", label: "YouTube" } },
  { hosts: ["x.com", "twitter.com"], platform: { key: "x", label: "X / Twitter" } },
  { hosts: ["instagram.com"], platform: { key: "instagram", label: "Instagram" } },
  { hosts: ["threads.net", "threads.com"], platform: { key: "threads", label: "Threads" } },
  { hosts: ["tiktok.com"], platform: { key: "tiktok", label: "TikTok" } },
  { hosts: ["vimeo.com"], platform: { key: "vimeo", label: "Vimeo" } },
  { hosts: ["twitch.tv"], platform: { key: "twitch", label: "Twitch" } },
  { hosts: ["reddit.com", "redd.it"], platform: { key: "reddit", label: "Reddit" } },
  { hosts: ["facebook.com", "fb.watch", "fb.com"], platform: { key: "facebook", label: "Facebook" } },
  { hosts: ["soundcloud.com"], platform: { key: "soundcloud", label: "SoundCloud" } },
  { hosts: ["spotify.com", "open.spotify.com"], platform: { key: "spotify", label: "Spotify" } },
  { hosts: ["bandcamp.com"], platform: { key: "bandcamp", label: "Bandcamp" } },
  { hosts: ["dailymotion.com", "dai.ly"], platform: { key: "dailymotion", label: "Dailymotion" } },
  { hosts: ["bilibili.com", "b23.tv"], platform: { key: "bilibili", label: "Bilibili" } },
  { hosts: ["pinterest.com", "pin.it"], platform: { key: "pinterest", label: "Pinterest" } },
  { hosts: ["tumblr.com"], platform: { key: "tumblr", label: "Tumblr" } },
  { hosts: ["ok.ru", "odnoklassniki.ru"], platform: { key: "ok", label: "OK.ru" } },
  { hosts: ["streamable.com"], platform: { key: "streamable", label: "Streamable" } },
  // Streaming hosts / embedded players
  { hosts: ["streamtape.com", "streamtape.net", "streamtape.to"], platform: { key: "streamtape", label: "StreamTape" } },
  { hosts: ["mixdrop.co", "mixdrop.to", "mixdrop.sx"], platform: { key: "mixdrop", label: "MixDrop" } },
  { hosts: ["dood.to", "dood.so", "dood.ws", "dood.sh", "dood.re"], platform: { key: "doodstream", label: "DoodStream" } },
  { hosts: ["filemoon.sx", "filemoon.to", "filemoon.in"], platform: { key: "filemoon", label: "FileMoon" } },
  { hosts: ["voe.sx"], platform: { key: "voe", label: "VOE" } },
  { hosts: ["vidcloud.co", "vidcloud.pro"], platform: { key: "vidcloud", label: "VidCloud" } },
  { hosts: ["upstream.to"], platform: { key: "upstream", label: "UpStream" } },
  { hosts: ["streamhub.to"], platform: { key: "streamhub", label: "StreamHub" } },
  { hosts: ["embed.smashystream.com", "smashystream.com"], platform: { key: "smashy", label: "SmashyStream" } }
];
function detectPlatform(url) {
  const trimmed = url.trim();
  if (/\.m3u8(\?|$)/i.test(trimmed)) return { key: "hls", label: "HLS Stream (.m3u8)" };
  if (/\.mpd(\?|$)/i.test(trimmed)) return { key: "dash", label: "DASH Stream (.mpd)" };
  if (/\.(mp4|mkv|webm|mov|avi)(\?|$)/i.test(trimmed)) return { key: "direct", label: "Direct video file" };
  let hostname;
  try {
    hostname = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return { key: "unknown", label: "Unknown site" };
  }
  for (const { hosts, platform } of PLATFORMS) {
    if (hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return platform;
    }
  }
  return { key: "generic", label: hostname };
}
function isProbablyUrl(input) {
  try {
    const u = new URL(input.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// src/lib/tips.ts
var TIP_INTERVAL_MS = 1e4;
var EN = [
  // ── Carbon / app tips ──────────────────────────────────────────────
  "Carbon supports 1800+ websites \u2014 YouTube, TikTok, Instagram, X, SoundCloud and more.",
  "Press Ctrl+T anytime to switch between dark, light and system theme.",
  "MP4 is the most compatible video format \u2014 it plays on virtually every device.",
  "FLAC is lossless audio \u2014 perfect quality, but bigger file size.",
  "MP3 at 320 kbps is indistinguishable from lossless for most listeners.",
  "MKV containers can hold multiple audio tracks and subtitles in one file.",
  "WEBM is great for web content \u2014 smaller files with good quality.",
  "Carbon automatically embeds metadata and cover art into your downloads.",
  "Your download history is saved \u2014 press \u2191 on the input screen to browse it.",
  "Carbon downloads to your ~/Downloads folder by default.",
  "Set CARBON_LANG=id to use Carbon in Bahasa Indonesia.",
  "Carbon supports 80+ languages \u2014 it auto-detects your system language.",
  "Press Esc during a download to cancel it safely.",
  "Carbon auto-downloads yt-dlp on first run \u2014 no manual setup needed.",
  "FFmpeg is bundled automatically for format conversion and merging.",
  'The "best" resolution option picks the highest quality available.',
  "60fps makes gameplay and sports videos look much smoother.",
  "AAC is the standard audio format for Apple devices.",
  "M4A files are AAC audio in an MP4 container \u2014 great quality/size ratio.",
  "WAV is uncompressed audio \u2014 used in professional audio production.",
  // ── Music facts ────────────────────────────────────────────────────
  "The most expensive musical instrument ever sold was a Stradivarius violin for $16 million.",
  'The song "Happy Birthday" was under copyright until 2016.',
  "Beethoven composed music even after becoming completely deaf.",
  'The first music video ever played on MTV was "Video Killed the Radio Star".',
  'An "earworm" is a song that gets stuck in your head \u2014 98% of people experience them.',
  "The longest song ever released is 13 hours and 23 minutes long.",
  "Vinyl records have outsold CDs in recent years for the first time since the 1980s.",
  "The most streamed song on Spotify has over 4 billion plays.",
  "Mozart wrote his first symphony at age 8.",
  'The term "album" comes from the Latin word for "white" \u2014 originally a collection of songs.',
  "Listening to music releases dopamine \u2014 the same chemical as eating chocolate.",
  "The world's largest music genre by revenue is pop music.",
  "Jazz originated in New Orleans in the late 19th century.",
  "The electric guitar was invented in 1931.",
  "A standard piano has 88 keys \u2014 52 white and 36 black.",
  "The human voice can produce over 100 different tones.",
  "Music can physically repair brain damage and improve memory.",
  "The fastest tempo ever recorded in a song is 1015 BPM.",
  "Binaural beats can help you focus or relax depending on the frequency.",
  'The first song ever played in space was "Jingle Bells" by astronauts in 1965.',
  // ── Video facts ────────────────────────────────────────────────────
  'The first YouTube video ever uploaded was "Me at the zoo" in 2005.',
  "Over 500 hours of video are uploaded to YouTube every minute.",
  "The most viewed YouTube video has over 14 billion views.",
  "4K resolution is exactly 3840 \xD7 2160 pixels \u2014 four times Full HD.",
  "The human eye can perceive up to 1000 frames per second.",
  `The first movie ever made was "Roundhay Garden Scene" in 1888 \u2014 it's 2 seconds long.`,
  "H.265/HEVC can deliver the same quality as H.264 at half the file size.",
  "The average person watches 100 minutes of online video per day.",
  "TikTok videos are limited to 10 minutes, but most viral ones are under 60 seconds.",
  "The first color film was made in 1902 using a process called Kinemacolor.",
  "IMAX screens can be up to 38 meters wide \u2014 that's 12 stories tall.",
  'The term "blockbuster" originally meant a bomb powerful enough to destroy a city block.',
  "Streaming video accounts for over 60% of global internet traffic.",
  "The first TV broadcast with sound was in 1926.",
  "A single minute of uncompressed 4K video at 60fps is about 1.5 GB.",
  "The aspect ratio 16:9 was chosen as the standard for HDTV in the 1990s.",
  "Slow motion works by capturing more frames per second than playback.",
  'The first animated film was "Fantasmagorie" in 1908.',
  "Video compression removes data your eyes can't perceive.",
  'The word "cinema" comes from the Greek word for "movement".',
  // ── Internet / tech facts ──────────────────────────────────────────
  "The first website ever created is still online: info.cern.ch",
  "About 5.4 billion people use the internet \u2014 67% of the world population.",
  "The first email was sent in 1971 by Ray Tomlinson.",
  "Over 333 billion emails are sent every day worldwide.",
  "The internet weighs about as much as a strawberry (in electrons).",
  "The first domain name ever registered was symbolics.com in 1985.",
  "Google processes over 8.5 billion searches per day.",
  'The first computer "bug" was an actual moth found in a relay in 1947.',
  "A single Google search uses about 0.3 watt-hours of electricity.",
  "The internet and the World Wide Web are not the same thing.",
  "The first webcam watched a coffee pot at Cambridge University.",
  "Over 2.5 quintillion bytes of data are created every day.",
  "The first smartphone was the IBM Simon, released in 1994.",
  'Wi-Fi was originally called "WaveLAN".',
  "The @ symbol was almost removed from keyboards before email was invented.",
  "The first 1GB hard drive weighed 550 pounds and was made by IBM in 1980.",
  "Bluetooth is named after a Viking king, Harald Bluetooth.",
  'The first text message ever sent said "Merry Christmas" in 1992.',
  "About 90% of the world's data was created in the last two years.",
  "The QWERTY keyboard was designed to slow typists down to prevent jamming.",
  // ── Fun / random facts ─────────────────────────────────────────────
  "Honey never spoils \u2014 archaeologists found 3000-year-old edible honey in Egyptian tombs.",
  "Octopuses have three hearts and blue blood.",
  'A group of flamingos is called a "flamboyance".',
  "Bananas are berries, but strawberries are not.",
  "The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896).",
  "There are more possible chess games than atoms in the observable universe.",
  "A day on Venus is longer than a year on Venus.",
  "The inventor of the Pringles can is buried in one.",
  "Sharks existed before trees \u2014 by about 50 million years.",
  'The dot over the letters "i" and "j" is called a "tittle".',
  "Wombat poop is cube-shaped.",
  "The first oranges weren't orange \u2014 they were green.",
  "A jiffy is an actual unit of time: 1/100th of a second.",
  "The unicorn is the national animal of Scotland.",
  "There's a species of jellyfish that is biologically immortal.",
  'The longest English word without a vowel is "rhythms".',
  "Cows have best friends and get stressed when separated.",
  "The heart of a shrimp is located in its head.",
  "There are more stars in the universe than grains of sand on Earth.",
  "The first alarm clock could only ring at 4 AM.",
  "A bolt of lightning is five times hotter than the surface of the sun.",
  "The Eiffel Tower can grow up to 15 cm taller in summer due to heat.",
  "Sloths can hold their breath longer than dolphins \u2014 up to 40 minutes.",
  "The first computer programmer was Ada Lovelace in the 1840s.",
  "There are more fake flamingos in the world than real ones.",
  "The average person walks the equivalent of 5 times around the world in their lifetime.",
  "A cloud weighs about 1.1 million pounds on average.",
  "The first photograph took 8 hours to expose.",
  "Polar bears have black skin under their white fur.",
  "The longest hiccuping spree lasted 68 years.",
  // ── Downloading / file tips ────────────────────────────────────────
  "Downloading at night is often faster \u2014 less network congestion.",
  "A wired ethernet connection is more stable than Wi-Fi for large downloads.",
  "File names with special characters can cause issues on some systems.",
  "Checksums (MD5, SHA-256) verify that a downloaded file is intact.",
  "The first file ever downloaded over the internet was in 1969 via FTP.",
  "BitTorrent splits files into pieces and downloads them from many peers.",
  "A 4K movie can be 50-100 GB in uncompressed format.",
  "The average download speed worldwide is about 50 Mbps.",
  "ZIP files were invented in 1989 by Phil Katz.",
  "The .mp3 extension stands for MPEG-1 Audio Layer 3.",
  "Lossy compression (MP3, JPEG) removes data; lossless (FLAC, PNG) does not.",
  "The first JPEG image was created in 1992.",
  "Streaming a song uses about 2-3 MB of data per minute at standard quality.",
  "A 3-minute song in FLAC format is about 20-30 MB.",
  "The same song in MP3 320kbps is about 7 MB.",
  "Video bitrate affects quality more than resolution does.",
  "24fps is the standard for movies; 30fps for TV; 60fps for gaming.",
  'The term "buffering" comes from filling a buffer before playback.',
  "Peer-to-peer downloading was popularized by Napster in 1999.",
  "The first video ever streamed live was in 1993."
];
var ID = [
  // ── Tips Carbon / aplikasi ─────────────────────────────────────────
  "Carbon mendukung 1800+ situs \u2014 YouTube, TikTok, Instagram, X, SoundCloud, dan lainnya.",
  "Tekan Ctrl+T kapan saja untuk berganti tema gelap, terang, atau sistem.",
  "MP4 adalah format video paling kompatibel \u2014 bisa diputar di hampir semua perangkat.",
  "FLAC adalah audio lossless \u2014 kualitas sempurna, tapi ukuran file lebih besar.",
  "MP3 320 kbps tidak bisa dibedakan dari lossless oleh kebanyakan pendengar.",
  "Kontainer MKV bisa menyimpan beberapa trek audio dan subtitle dalam satu file.",
  "WEBM cocok untuk konten web \u2014 file lebih kecil dengan kualitas bagus.",
  "Carbon otomatis menanamkan metadata dan cover art ke hasil unduhanmu.",
  "Riwayat unduhanmu tersimpan \u2014 tekan \u2191 di layar input untuk menelusurinya.",
  "Carbon mengunduh ke folder ~/Downloads secara default.",
  "Setel CARBON_LANG=id untuk memakai Carbon dalam Bahasa Indonesia.",
  "Carbon mendukung 80+ bahasa \u2014 otomatis mendeteksi bahasa sistemmu.",
  "Tekan Esc saat mengunduh untuk membatalkan dengan aman.",
  "Carbon otomatis mengunduh yt-dlp saat pertama dijalankan \u2014 tanpa setup manual.",
  "FFmpeg disertakan otomatis untuk konversi dan penggabungan format.",
  'Opsi resolusi "best" memilih kualitas tertinggi yang tersedia.',
  "60fps membuat video gameplay dan olahraga terlihat jauh lebih mulus.",
  "AAC adalah format audio standar untuk perangkat Apple.",
  "File M4A adalah audio AAC dalam kontainer MP4 \u2014 rasio kualitas/ukuran bagus.",
  "WAV adalah audio tanpa kompresi \u2014 dipakai di produksi audio profesional.",
  // ── Fakta musik ────────────────────────────────────────────────────
  "Alat musik termahal yang pernah dijual adalah biola Stradivarius seharga $16 juta.",
  'Lagu "Happy Birthday" dilindungi hak cipta hingga tahun 2016.',
  "Beethoven tetap menggubah musik bahkan setelah benar-benar tuli.",
  'Video musik pertama yang diputar di MTV adalah "Video Killed the Radio Star".',
  '"Earworm" adalah lagu yang terus terngiang di kepala \u2014 98% orang pernah mengalaminya.',
  "Lagu terpanjang yang pernah dirilis berdurasi 13 jam 23 menit.",
  "Piringan hitam kembali mengalahkan penjualan CD untuk pertama kalinya sejak 1980-an.",
  "Lagu paling banyak diputar di Spotify telah melebihi 4 miliar pemutaran.",
  "Mozart menulis simfoni pertamanya di usia 8 tahun.",
  'Istilah "album" berasal dari kata Latin untuk "putih" \u2014 awalnya kumpulan lagu.',
  "Mendengarkan musik melepaskan dopamin \u2014 zat kimia yang sama saat makan cokelat.",
  "Genre musik terbesar di dunia berdasarkan pendapatan adalah musik pop.",
  "Jazz berasal dari New Orleans pada akhir abad ke-19.",
  "Gitar listrik ditemukan pada tahun 1931.",
  "Piano standar memiliki 88 tuts \u2014 52 putih dan 36 hitam.",
  "Suara manusia bisa menghasilkan lebih dari 100 nada berbeda.",
  "Musik bisa membantu memperbaiki kerusakan otak dan meningkatkan memori.",
  "Tempo tercepat yang pernah tercatat dalam sebuah lagu adalah 1015 BPM.",
  "Binaural beats bisa membantu fokus atau rileks tergantung frekuensinya.",
  'Lagu pertama yang diputar di luar angkasa adalah "Jingle Bells" oleh astronot pada 1965.',
  // ── Fakta video ────────────────────────────────────────────────────
  'Video YouTube pertama yang pernah diunggah adalah "Me at the zoo" pada 2005.',
  "Lebih dari 500 jam video diunggah ke YouTube setiap menit.",
  "Video YouTube paling banyak ditonton telah melebihi 14 miliar views.",
  "Resolusi 4K tepat 3840 \xD7 2160 piksel \u2014 empat kali Full HD.",
  "Mata manusia bisa menangkap hingga 1000 frame per detik.",
  'Film pertama yang pernah dibuat adalah "Roundhay Garden Scene" pada 1888 \u2014 durasinya 2 detik.',
  "H.265/HEVC bisa menghasilkan kualitas sama dengan H.264 pada setengah ukuran file.",
  "Rata-rata orang menonton 100 menit video online per hari.",
  "Video TikTok dibatasi 10 menit, tapi kebanyakan yang viral di bawah 60 detik.",
  "Film berwarna pertama dibuat pada 1902 menggunakan proses bernama Kinemacolor.",
  "Layar IMAX bisa selebar 38 meter \u2014 setinggi gedung 12 lantai.",
  'Istilah "blockbuster" awalnya berarti bom yang cukup kuat menghancurkan satu blok kota.',
  "Streaming video menyumbang lebih dari 60% lalu lintas internet global.",
  "Siaran TV pertama dengan suara terjadi pada 1926.",
  "Satu menit video 4K tanpa kompresi pada 60fps berukuran sekitar 1,5 GB.",
  "Rasio aspek 16:9 dipilih sebagai standar HDTV pada 1990-an.",
  "Slow motion bekerja dengan menangkap lebih banyak frame per detik daripada pemutaran.",
  'Film animasi pertama adalah "Fantasmagorie" pada 1908.',
  "Kompresi video membuang data yang tidak bisa ditangkap matamu.",
  'Kata "cinema" berasal dari kata Yunani untuk "gerakan".',
  // ── Fakta internet / teknologi ─────────────────────────────────────
  "Website pertama yang pernah dibuat masih online: info.cern.ch",
  "Sekitar 5,4 miliar orang menggunakan internet \u2014 67% populasi dunia.",
  "Email pertama dikirim pada 1971 oleh Ray Tomlinson.",
  "Lebih dari 333 miliar email dikirim setiap hari di seluruh dunia.",
  "Internet memiliki berat sekitar sama dengan buah stroberi (dalam elektron).",
  "Nama domain pertama yang pernah didaftarkan adalah symbolics.com pada 1985.",
  "Google memproses lebih dari 8,5 miliar pencarian per hari.",
  '"Bug" komputer pertama adalah ngengat sungguhan yang ditemukan di relay pada 1947.',
  "Satu pencarian Google menggunakan sekitar 0,3 watt-jam listrik.",
  "Internet dan World Wide Web bukanlah hal yang sama.",
  "Webcam pertama mengawasi teko kopi di Universitas Cambridge.",
  "Lebih dari 2,5 kuintiliun byte data dibuat setiap hari.",
  "Smartphone pertama adalah IBM Simon, dirilis pada 1994.",
  'Wi-Fi awalnya bernama "WaveLAN".',
  "Simbol @ hampir dihapus dari keyboard sebelum email ditemukan.",
  "Hard drive 1GB pertama berbobot 250 kg dan dibuat oleh IBM pada 1980.",
  "Bluetooth dinamai dari raja Viking, Harald Bluetooth.",
  'Pesan teks pertama yang pernah dikirim berbunyi "Selamat Natal" pada 1992.',
  "Sekitar 90% data dunia dibuat dalam dua tahun terakhir.",
  "Keyboard QWERTY dirancang untuk memperlambat pengetik agar tidak macet.",
  // ── Fakta seru / acak ──────────────────────────────────────────────
  "Madu tidak pernah basi \u2014 arkeolog menemukan madu 3000 tahun yang masih bisa dimakan di makam Mesir.",
  "Gurita memiliki tiga jantung dan darah biru.",
  'Sekelompok flamingo disebut "flamboyance".',
  "Pisang adalah buah beri, tapi stroberi bukan.",
  "Perang tersingkat dalam sejarah berlangsung 38 menit (Inggris vs Zanzibar, 1896).",
  "Ada lebih banyak kemungkinan permainan catur daripada atom di alam semesta yang teramati.",
  "Satu hari di Venus lebih lama daripada satu tahun di Venus.",
  "Penemu kaleng Pringles dimakamkan di dalam kalengnya.",
  "Hiu sudah ada sebelum pohon \u2014 sekitar 50 juta tahun lebih dulu.",
  'Titik di atas huruf "i" dan "j" disebut "tittle".',
  "Kotoran wombat berbentuk kubus.",
  "Jeruk pertama bukanlah oranye \u2014 warnanya hijau.",
  "Jiffy adalah satuan waktu sungguhan: 1/100 detik.",
  "Unicorn adalah hewan nasional Skotlandia.",
  "Ada spesies ubur-ubur yang secara biologis abadi.",
  'Kata bahasa Inggris terpanjang tanpa huruf vokal adalah "rhythms".',
  "Sapi punya sahabat dan stres saat dipisahkan.",
  "Jantung udang terletak di kepalanya.",
  "Ada lebih banyak bintang di alam semesta daripada butiran pasir di Bumi.",
  "Jam alarm pertama hanya bisa berbunyi pada pukul 4 pagi.",
  "Sambaran petir lima kali lebih panas daripada permukaan matahari.",
  "Menara Eiffel bisa tumbuh hingga 15 cm lebih tinggi di musim panas karena panas.",
  "Kungkang bisa menahan napas lebih lama daripada lumba-lumba \u2014 hingga 40 menit.",
  "Programmer komputer pertama adalah Ada Lovelace pada 1840-an.",
  "Ada lebih banyak flamingo palsu di dunia daripada yang asli.",
  "Rata-rata orang berjalan setara 5 kali keliling dunia seumur hidupnya.",
  "Awan rata-rata berbobot sekitar 500.000 kg.",
  "Foto pertama membutuhkan 8 jam untuk pencahayaan.",
  "Beruang kutub memiliki kulit hitam di bawah bulu putihnya.",
  "Rekor cegukan terlama berlangsung 68 tahun.",
  // ── Tips unduhan / file ────────────────────────────────────────────
  "Mengunduh di malam hari sering lebih cepat \u2014 lebih sedikit kepadatan jaringan.",
  "Koneksi ethernet kabel lebih stabil daripada Wi-Fi untuk unduhan besar.",
  "Nama file dengan karakter khusus bisa bermasalah di beberapa sistem.",
  "Checksum (MD5, SHA-256) memverifikasi bahwa file unduhan utuh.",
  "File pertama yang diunduh lewat internet adalah pada 1969 via FTP.",
  "BitTorrent memecah file menjadi potongan dan mengunduhnya dari banyak peer.",
  "Film 4K bisa berukuran 50-100 GB dalam format tanpa kompresi.",
  "Kecepatan unduh rata-rata dunia sekitar 50 Mbps.",
  "File ZIP ditemukan pada 1989 oleh Phil Katz.",
  "Ekstensi .mp3 adalah singkatan dari MPEG-1 Audio Layer 3.",
  "Kompresi lossy (MP3, JPEG) membuang data; lossless (FLAC, PNG) tidak.",
  "Gambar JPEG pertama dibuat pada 1992.",
  "Streaming satu lagu memakai sekitar 2-3 MB data per menit pada kualitas standar.",
  "Lagu 3 menit dalam format FLAC berukuran sekitar 20-30 MB.",
  "Lagu yang sama dalam MP3 320kbps berukuran sekitar 7 MB.",
  "Bitrate video memengaruhi kualitas lebih dari resolusi.",
  "24fps standar untuk film; 30fps untuk TV; 60fps untuk gaming.",
  'Istilah "buffering" berasal dari mengisi buffer sebelum pemutaran.',
  "Unduhan peer-to-peer dipopulerkan oleh Napster pada 1999.",
  "Video pertama yang disiarkan langsung secara streaming adalah pada 1993."
];
var TIPS_BY_LANG = {
  en: EN,
  id: ID
};
function activeTips() {
  return TIPS_BY_LANG[getLanguage()] ?? EN;
}
var shuffled = [];
var index = 0;
var lastLang;
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function nextTip() {
  const lang = getLanguage();
  if (shuffled.length === 0 || index >= shuffled.length || lastLang !== lang) {
    lastLang = lang;
    shuffled = shuffle(activeTips());
    index = 0;
  }
  return shuffled[index++];
}
function randomTip() {
  const tips = activeTips();
  return tips[Math.floor(Math.random() * tips.length)];
}

// src/lib/update-check.ts
var GITHUB_REPO = "AlFarrizi-Studio/Carbon-DL";
var CURRENT_VERSION = "1.0.7";
function isNewerVersion(a, b) {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return false;
}
async function checkForUpdate(signal) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "carbon-dl-update-checker"
      },
      signal: combinedSignal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const latest = data.tag_name?.replace(/^v/, "") ?? "";
    if (!latest) return null;
    return {
      hasUpdate: isNewerVersion(latest, CURRENT_VERSION),
      currentVersion: CURRENT_VERSION,
      latestVersion: latest,
      releaseUrl: data.html_url ?? `https://github.com/${GITHUB_REPO}/releases`
    };
  } catch {
    return null;
  }
}

// src/lib/ytdlp.ts
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import fs2 from "fs/promises";
import os2 from "os";
import path2 from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

// src/lib/ytmusic.ts
var YTMUSIC_SEARCH_URL = "https://music.youtube.com/youtubei/v1/search?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30&prettyPrint=false";
var CLIENT_CONTEXT = {
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20260302.03.01",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    hl: "en",
    gl: "US"
  },
  user: { lockedSafetyMode: false },
  request: { useSsl: true }
};
var PARAMS_TRACKS = "EgWKAQIIAWoSEAMQBRAEEAkQChAVEBAQDhAR";
async function searchYtMusic(query, signal) {
  const results = await searchYtMusicMany(query, 1, signal);
  return results[0];
}
async function searchYtMusicMany(query, limit = 5, signal) {
  try {
    const response = await fetch(YTMUSIC_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": CLIENT_CONTEXT.client.userAgent,
        "X-Goog-Api-Format-Version": "2"
      },
      body: JSON.stringify({
        context: CLIENT_CONTEXT,
        query,
        params: PARAMS_TRACKS
      }),
      signal
    });
    if (!response.ok) return [];
    const data = await response.json();
    return parseSearchResults(data, limit);
  } catch {
    return [];
  }
}
function parseSearchResults(data, limit) {
  const tracks = [];
  const contents = data.contents;
  const tabbed = contents?.tabbedSearchResultsRenderer;
  const tabs = tabbed?.tabs;
  const tabContent = tabs?.[0]?.tabRenderer;
  const content = tabContent?.content;
  let sectionContents;
  const sectionList = content?.sectionListRenderer;
  if (sectionList?.contents) {
    sectionContents = sectionList.contents;
  }
  if (!sectionContents) {
    const splitView = content?.musicSplitViewRenderer;
    const mainContent = splitView?.mainContent;
    const mainSectionList = mainContent?.sectionListRenderer;
    if (mainSectionList?.contents) {
      sectionContents = mainSectionList.contents;
    }
  }
  if (!sectionContents) return [];
  const shelfContents = findShelfContents(sectionContents);
  if (!shelfContents) return [];
  for (const item of shelfContents) {
    if (tracks.length >= limit) break;
    const track = parseTrackItem(item);
    if (track) tracks.push(track);
  }
  return tracks;
}
function findShelfContents(sections) {
  for (const section of sections) {
    const sec = section;
    const shelf = sec.musicShelfRenderer;
    if (shelf?.contents) {
      return shelf.contents;
    }
  }
  return void 0;
}
function parseTrackItem(item) {
  const renderer = item.musicResponsiveListItemRenderer ?? item.musicTwoColumnItemRenderer;
  if (!renderer) return void 0;
  const playlistItemData = renderer.playlistItemData;
  let videoId = playlistItemData?.videoId;
  if (!videoId) {
    const overlay = renderer.overlay;
    const overlayRenderer = overlay?.musicItemThumbnailOverlayRenderer;
    const content2 = overlayRenderer?.content;
    const musicPlayButton = content2?.musicPlayButtonRenderer;
    const playNavigation = musicPlayButton?.playNavigationEndpoint;
    const watchEndpoint = playNavigation?.watchEndpoint;
    videoId = watchEndpoint?.videoId;
  }
  if (!videoId) return void 0;
  const flexColumns = renderer.flexColumns;
  let title;
  let artist;
  let album;
  if (flexColumns && flexColumns.length > 0) {
    const titleCol = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer;
    title = extractText(titleCol?.text);
    if (flexColumns.length > 1) {
      const artistCol = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
      const artistText = extractText(artistCol?.text);
      if (artistText) {
        const parts = artistText.split("\u2022").map((p) => p.trim());
        artist = parts[0];
        album = parts.length > 1 ? parts.slice(1).join(" \u2022 ") : void 0;
      }
    }
  }
  const thumbnail = renderer.thumbnail;
  const thumbRenderer = thumbnail?.musicThumbnailRenderer;
  const thumbContent = thumbRenderer?.thumbnail;
  const thumbSources = thumbContent?.thumbnails;
  const bestThumb = thumbSources?.length ? thumbSources[thumbSources.length - 1]?.url : void 0;
  const fixedColumns = renderer.fixedColumns;
  let duration;
  if (fixedColumns && fixedColumns.length > 0) {
    const durationCol = fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer;
    duration = extractText(durationCol?.text);
  }
  if (!title) return void 0;
  return { videoId, title, artist, album, duration, thumbnail: bestThumb };
}
function extractText(textObj) {
  if (!textObj) return void 0;
  if (typeof textObj.simpleText === "string") return textObj.simpleText;
  const runs = textObj.runs;
  if (runs && runs.length > 0) {
    return runs.map((r) => r.text ?? "").join("");
  }
  return void 0;
}
function ytmTrackUrl(track) {
  return `https://www.youtube.com/watch?v=${track.videoId}`;
}

// src/lib/ytdlp.ts
var CARBON_DIR = path2.join(os2.homedir(), ".carbon", "bin");
var RELEASE_BASE = "https://github.com/yt-dlp/yt-dlp/releases/latest/download";
function ytDlpAssetName() {
  if (process.platform === "win32") return "yt-dlp.exe";
  if (process.platform === "darwin") return "yt-dlp_macos";
  return process.arch === "arm64" ? "yt-dlp_linux_aarch64" : "yt-dlp_linux";
}
function commandWorks(cmd, args2) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(cmd, args2, { stdio: "ignore", timeout: 1e4 });
    } catch {
      resolve(false);
      return;
    }
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}
async function ensureYtDlp(onStatus, signal) {
  if (await commandWorks("yt-dlp", ["--version"])) return "yt-dlp";
  const local = path2.join(CARBON_DIR, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
  if (await commandWorks(local, ["--version"])) return local;
  onStatus("first run: fetching yt-dlp\u2026");
  await fs2.mkdir(CARBON_DIR, { recursive: true });
  const url = `${RELEASE_BASE}/${ytDlpAssetName()}`;
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) {
    throw new Error(`Could not download yt-dlp (${response.status}). Check your connection and try again.`);
  }
  const tmp = `${local}.download`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tmp), { signal });
  if (process.platform !== "win32") await fs2.chmod(tmp, 493);
  await fs2.rename(tmp, local);
  return local;
}
async function findFfmpeg() {
  if (await commandWorks("ffmpeg", ["-version"])) return void 0;
  try {
    const mod = await import("ffmpeg-static");
    const ffmpegPath = mod.default ?? mod;
    if (ffmpegPath && await commandWorks(ffmpegPath, ["-version"])) return ffmpegPath;
  } catch {
  }
  return void 0;
}
function formatReleaseDate(raw) {
  if (!raw || raw.length !== 8) return void 0;
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return void 0;
  return `${year}-${month}-${day}`;
}
function artistOf(info) {
  return info.artist ?? info.creator ?? info.uploader;
}
async function fetchSpotifyMetadata(url, signal) {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, { signal });
    if (!response.ok) return void 0;
    const data = await response.json();
    if (!data.title) return void 0;
    return { title: data.title, thumbnail: data.thumbnail_url };
  } catch {
    return void 0;
  }
}
async function fetchAppleMusicMetadata(url, signal) {
  try {
    const idMatch = /[?&]i=(\d+)/.exec(url) ?? /\/album\/[^/]+\/(\d+)/.exec(url);
    if (!idMatch) return void 0;
    const lookupUrl = `https://itunes.apple.com/lookup?id=${idMatch[1]}&entity=song`;
    const response = await fetch(lookupUrl, { signal });
    if (!response.ok) return void 0;
    const data = await response.json();
    const item = data.results?.[0];
    if (!item?.trackName) return void 0;
    return {
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      thumbnail: item.artworkUrl100?.replace("100x100", "600x600")
    };
  } catch {
    return void 0;
  }
}
async function fetchDeezerMetadata(url, signal) {
  try {
    const idMatch = /\/track\/(\d+)/.exec(url);
    if (!idMatch) return void 0;
    const response = await fetch(`https://api.deezer.com/track/${idMatch[1]}`, { signal });
    if (!response.ok) return void 0;
    const data = await response.json();
    if (!data.title) return void 0;
    return {
      title: data.title,
      artist: data.artist?.name,
      album: data.album?.title,
      thumbnail: data.album?.cover_big
    };
  } catch {
    return void 0;
  }
}
function isDrmMusicService(url) {
  return /open\.spotify\.com|spotify:|music\.apple\.com|deezer\.com|tidal\.com|music\.amazon\.|amazon\.com\/music/i.test(url);
}
function queryFromUrlSlug(url) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = decodeURIComponent(segments[i] ?? "");
      if (/^\d+$/.test(seg)) continue;
      if (seg.length < 3) continue;
      if (/^(browse|track|album|playlist|artist|listen|watch|music|us|gb|id)$/i.test(seg)) continue;
      return seg.replace(/[-_]+/g, " ").trim();
    }
  } catch {
  }
  return void 0;
}
async function fetchMusicMetadata(url, signal) {
  if (/open\.spotify\.com|spotify:/i.test(url)) return fetchSpotifyMetadata(url, signal);
  if (/music\.apple\.com/i.test(url)) return fetchAppleMusicMetadata(url, signal);
  if (/deezer\.com/i.test(url)) return fetchDeezerMetadata(url, signal);
  return void 0;
}
async function searchYouTubeMusic(_ytdlp, query, signal) {
  const track = await searchYtMusic(query, signal);
  if (!track) return void 0;
  return ytmTrackUrl(track);
}
var BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var YOUTUBE_RETRY_ARGS = [
  "--extractor-args",
  "youtube:player_client=android,tv,web_embedded,web;player_skip=configs;formats=missing_pot"
];
var TIKTOK_API_HOSTS = [
  "api16-normal-c-useast1a.tiktokv.com",
  "api22-normal-c-useast2a.tiktokv.com",
  "api19-normal-c-useast2a.tiktokv.com"
];
var GENERIC_BYPASS_ARGS = [
  "--no-check-certificates",
  // Present a normal browser UA to avoid bot-throttling on TikTok/IG/X/etc.
  "--user-agent",
  BROWSER_UA,
  // Bypass geo-restrictions where the extractor supports it.
  "--geo-bypass"
];
function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/i.test(url);
}
function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}
function bypassArgsFor(url, strong = false, tiktokHostIndex = -1) {
  if (strong && isYouTubeUrl(url)) return [...YOUTUBE_RETRY_ARGS, ...GENERIC_BYPASS_ARGS];
  if (isTikTokUrl(url)) {
    const index2 = tiktokHostIndex < 0 ? Math.abs(hashCode(url)) : tiktokHostIndex;
    const host = TIKTOK_API_HOSTS[index2 % TIKTOK_API_HOSTS.length];
    return [
      "--extractor-args",
      `tiktok:api_hostname=${host}`,
      ...GENERIC_BYPASS_ARGS
    ];
  }
  return GENERIC_BYPASS_ARGS;
}
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
async function detectBrowser() {
  const browsers = process.platform === "win32" ? ["chrome", "edge", "firefox", "brave"] : process.platform === "darwin" ? ["chrome", "safari", "firefox", "brave"] : ["chrome", "firefox", "chromium", "brave"];
  for (const browser of browsers) {
    if (await commandWorks("yt-dlp", ["--cookies-from-browser", browser, "--simulate", "https://www.youtube.com/watch?v=jNQXAC9IVRw"])) {
      return browser;
    }
  }
  return void 0;
}
var cachedBrowser = null;
async function getBrowserForCookies() {
  if (cachedBrowser === null) {
    cachedBrowser = await detectBrowser();
  }
  return cachedBrowser ?? void 0;
}
async function probe(ytdlp, url, signal, useCookies = false) {
  const doProbe = async (targetUrl, strong = false, withCookies = false, tiktokHostIndex = 0) => {
    const browser = withCookies ? await getBrowserForCookies() : void 0;
    const cookies = browser ? ["--cookies-from-browser", browser] : [];
    const stdout = await new Promise((resolve, reject) => {
      const child = spawn(ytdlp, ["-J", "--no-playlist", "--no-warnings", ...bypassArgsFor(targetUrl, strong, tiktokHostIndex), ...cookies, targetUrl], { signal });
      let out = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => out += chunk);
      child.stderr.on("data", (chunk) => stderr += chunk);
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(cleanYtDlpError(stderr) || `yt-dlp exited with code ${code}`));
        } else {
          resolve(out);
        }
      });
    });
    try {
      return JSON.parse(stdout);
    } catch {
      throw new Error("Could not parse video info from yt-dlp.");
    }
  };
  try {
    const info = await doProbe(url);
    return { info };
  } catch (directError) {
    if (signal?.aborted) throw directError;
    const errMsg = directError instanceof Error ? directError.message : String(directError);
    const needsBypass = /blocked|restricted|age|private|cookies|log.?in|sign.?in|authentication|403|429|unavailable|rehydration/i.test(errMsg);
    if (needsBypass) {
      if (isTikTokUrl(url)) {
        const startIndex = Math.abs(hashCode(url)) % TIKTOK_API_HOSTS.length;
        for (let attempt = 1; attempt < TIKTOK_API_HOSTS.length; attempt++) {
          if (signal?.aborted) throw directError;
          const hostIndex = (startIndex + attempt) % TIKTOK_API_HOSTS.length;
          try {
            const info = await doProbe(url, false, false, hostIndex);
            return { info };
          } catch {
          }
        }
      } else {
        try {
          const info = await doProbe(url, true, false);
          return { info };
        } catch {
        }
      }
    }
    const needsCookies = /cookies|log.?in|sign.?in|logged.?in|authentication|blocked|restricted|age|private/i.test(errMsg) && !useCookies;
    if (needsCookies) {
      try {
        const browser = await getBrowserForCookies();
        if (browser) {
          const info = await doProbe(url, true, true);
          return { info };
        }
      } catch {
      }
    }
    const looksLikeMusicDrm = isDrmMusicService(url) || /soundcloud\.com|bandcamp\.com|audiomack\.com/i.test(url) || /\bdrm\b|premium|subscription required/i.test(errMsg);
    if (!looksLikeMusicDrm) throw directError;
    const metadata = await fetchMusicMetadata(url, signal);
    let searchQuery;
    if (metadata?.title) {
      searchQuery = metadata.artist ? `${metadata.artist} - ${metadata.title}` : metadata.title;
    } else {
      searchQuery = queryFromUrlSlug(url);
    }
    if (searchQuery) {
      const youtubeUrl = await searchYouTubeMusic(ytdlp, searchQuery, signal);
      if (youtubeUrl) {
        try {
          const info = await doProbe(youtubeUrl);
          if (metadata?.title && !info.title) info.title = metadata.title;
          if (metadata?.artist && !info.artist) info.artist = metadata.artist;
          if (metadata?.album && !info.album) info.album = metadata.album;
          return { info, spotifyFallback: true, originalUrl: url };
        } catch {
        }
      }
    }
    throw directError;
  }
}
function maxHeight(info) {
  const videos = (info.formats ?? []).filter((f) => f.vcodec && f.vcodec !== "none" && f.height);
  return videos.reduce((max, f) => Math.max(max, f.height ?? 0), 0);
}
function hasAudio(info) {
  return (info.formats ?? []).some((f) => f.acodec && f.acodec !== "none");
}
function buildVideoArgs(format, resolution, fps) {
  const heightFilter = resolution > 0 ? `[height<=${resolution}]` : "";
  const fpsFilter = fps > 0 ? `[fps<=${fps}]` : "";
  const selector = `bv*${heightFilter}${fpsFilter}+ba/b${heightFilter}${fpsFilter}/bv*${heightFilter}+ba/b`;
  return ["-f", selector, "--merge-output-format", format.ext];
}
function buildAudioArgs(format, bitrateKbps = 0) {
  const args2 = ["-f", "ba/b", "-x", "--audio-format", format.id];
  if (bitrateKbps > 0) {
    args2.push("--audio-quality", `${bitrateKbps}K`);
  } else {
    args2.push("--audio-quality", "0");
  }
  return args2;
}
var PROGRESS_PREFIX = "CARBON|";
var PROGRESS_TEMPLATE = `${PROGRESS_PREFIX}%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s`;
var activeChild;
process.on("exit", () => activeChild?.kill("SIGTERM"));
async function download(opts, handlers, signal) {
  const browser = opts.useCookies ? await getBrowserForCookies() : void 0;
  const cookieArgs = browser ? ["--cookies-from-browser", browser] : [];
  const args2 = [
    opts.url,
    ...opts.choice.args,
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "--no-quiet",
    "--progress",
    "--progress-template",
    `download:${PROGRESS_TEMPLATE}`,
    "--print",
    "after_move:filepath",
    "--no-simulate",
    // DRM/restriction bypass (strong args only on retry to preserve quality)
    ...bypassArgsFor(opts.url, opts.strongBypass),
    // Cookies for age restriction / DRM bypass
    ...cookieArgs,
    // Embed metadata (title, artist, album, date…) and cover art into the
    // final file so media players can display them during playback.
    "--embed-metadata",
    "--embed-thumbnail",
    "-o",
    path2.join(opts.outDir, "%(title).80s.%(ext)s")
  ];
  if (opts.ffmpegLocation) args2.push("--ffmpeg-location", opts.ffmpegLocation);
  return new Promise((resolve, reject) => {
    const child = spawn(opts.ytdlp, args2, { signal });
    activeChild = child;
    let stderr = "";
    let filepath = "";
    let part = 0;
    let totalParts = 1;
    let lastDownloaded = 0;
    let buffer = "";
    const destinations = [];
    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith(PROGRESS_PREFIX)) {
          const [downloaded, total, totalEstimate, speed, eta] = line.slice(PROGRESS_PREFIX.length).split("|");
          const downloadedBytes = toNumber(downloaded) ?? 0;
          if (downloadedBytes < lastDownloaded) part++;
          lastDownloaded = downloadedBytes;
          handlers.onProgress({
            downloadedBytes,
            totalBytes: toNumber(total) ?? toNumber(totalEstimate),
            speed: toNumber(speed),
            eta: toNumber(eta),
            part,
            totalParts
          });
        } else if (line.includes("Downloading 1 format(s):")) {
          totalParts = (line.split("format(s):")[1] ?? "").trim().split("+").length;
        } else if (line.includes("[Merger]") || line.includes("[ExtractAudio]") || line.includes("[VideoConvert]")) {
          const merging = /^\[Merger\] Merging formats into "(.+)"$/.exec(line)?.[1];
          const extracting = /^\[ExtractAudio\] Destination: (.+)$/.exec(line)?.[1];
          const target = merging ?? extracting;
          if (target) destinations.push(target);
          handlers.onProcessing();
        } else if (line.startsWith("[download] Destination: ")) {
          destinations.push(line.slice("[download] Destination: ".length));
        } else if (path2.isAbsolute(line)) {
          filepath = line;
        }
      }
    });
    child.stderr.on("data", (chunk) => stderr += chunk);
    child.on("error", reject);
    child.on("close", (code) => {
      activeChild = void 0;
      if (signal?.aborted) {
        void removePartials(destinations);
        reject(new Error("Download cancelled."));
        return;
      }
      if (code === 0 && filepath) {
        resolve(filepath);
      } else {
        reject(new Error(cleanYtDlpError(stderr) || `Download failed (yt-dlp exit code ${code}).`));
      }
    });
  });
}
function removePartials(destinations) {
  return Promise.allSettled(
    destinations.flatMap((dest) => [dest, `${dest}.part`, `${dest}.ytdl`]).map((file) => fs2.rm(file, { force: true }))
  );
}
function toNumber(value) {
  if (!value || value === "NA" || value === "None") return void 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : void 0;
}
function cleanYtDlpError(stderr) {
  const lines = stderr.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("ERROR:"));
  const last = lines.at(-1);
  return last ? last.replace(/^ERROR:\s*(\[[^\]]+\]\s*)?/, "") : "";
}

// src/app.tsx
import { Fragment, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var OUT_DIR = path3.join(os3.homedir(), "Downloads");
function UpdateBadge({ info }) {
  const theme = useTheme();
  const s = t();
  if (!info?.hasUpdate) return null;
  return /* @__PURE__ */ jsx5(Box4, { position: "absolute", top: 0, right: 1, children: /* @__PURE__ */ jsxs4(Text5, { color: theme.warning ?? theme.accent ?? theme.primary, bold: true, children: [
    "\u2191 ",
    s.updateAvailable ?? "Update Carbon available",
    ": v",
    info.latestVersion
  ] }) });
}
var Gap = ({ lines = 1 }) => /* @__PURE__ */ jsx5(Box4, { flexDirection: "column", flexShrink: 0, children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx5(Text5, { children: " " }, i)) });
function ChoiceIndicator({ isSelected }) {
  const theme = useTheme();
  return /* @__PURE__ */ jsx5(Box4, { marginRight: 1, children: /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.primary, children: isSelected ? "\u25B6" : " " }) });
}
function ChoiceItem({ isSelected, label }) {
  const theme = useTheme();
  return /* @__PURE__ */ jsx5(Text5, { color: isSelected ? theme.accent ?? theme.primary : theme.primary, bold: isSelected, children: label });
}
function MetadataBlock({ info, platform, maxWidth }) {
  const theme = useTheme();
  const s = t();
  const artist = artistOf(info);
  const release = formatReleaseDate(info.release_date);
  const labelW = 9;
  const valueW = Math.max(10, maxWidth - labelW - 4);
  const rows = [
    [s.lblTitle, info.title ?? "-"],
    [s.lblArtist, artist ?? "-"],
    [s.lblAlbum, info.album ?? "-"],
    [s.lblRelease, release ?? "-"],
    [s.lblTime, info.duration ? formatDuration(info.duration) : "-"],
    [s.lblSource, platform?.label ?? "-"]
  ];
  return /* @__PURE__ */ jsx5(Box4, { flexDirection: "column", children: rows.map(([label, value]) => /* @__PURE__ */ jsxs4(Box4, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.gray, bold: true, children: label.padEnd(labelW) }),
    /* @__PURE__ */ jsx5(Text5, { color: theme.primary, children: truncate(value, valueW) })
  ] }, label)) });
}
function ModernProgressBar({ percent, width = 40 }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, percent));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  const pct = Math.round(clamped * 100);
  return /* @__PURE__ */ jsx5(Box4, { flexDirection: "column", alignItems: "center", children: /* @__PURE__ */ jsxs4(Text5, { children: [
    /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.primary, bold: true, children: "\u2588".repeat(filled) }),
    /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: true, children: "\u2591".repeat(empty) }),
    /* @__PURE__ */ jsxs4(Text5, { color: theme.primary, bold: true, children: [
      " ",
      pct,
      "%"
    ] })
  ] }) });
}
function TipDisplay({ maxWidth }) {
  const theme = useTheme();
  const s = t();
  const [tip, setTip] = useState2(randomTip);
  useEffect(() => {
    const interval = setInterval(() => {
      setTip(nextTip());
    }, TIP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
  const wrapped = wrapText(`${s.tip}: ${tip}`, maxWidth);
  return /* @__PURE__ */ jsx5(Box4, { flexDirection: "column", alignItems: "center", children: wrapped.slice(0, 2).map((line, i) => /* @__PURE__ */ jsxs4(Text5, { color: theme.gray, dimColor: theme.dimSecondary, italic: true, children: [
    i === 0 ? "\u{1F4A1} " : "   ",
    line
  ] }, i)) });
}
function App({ initialThemeMode: initialThemeMode2 = "system", ...props }) {
  const [themeMode, setThemeMode] = useState2(initialThemeMode2);
  const cycleTheme = useCallback(() => {
    setThemeMode(nextThemeMode);
  }, []);
  return /* @__PURE__ */ jsx5(ThemeProvider, { mode: themeMode, children: /* @__PURE__ */ jsx5(AppContent, { ...props, cycleTheme }) });
}
function AppContent({
  initialUrl: initialUrl2,
  onOutcome,
  cycleTheme
}) {
  const theme = useTheme();
  const s = t();
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [url, setUrl] = useState2(initialUrl2 ?? "");
  const [urlInput, setUrlInput] = useState2("");
  const [history, setHistory] = useState2(loadHistory);
  const [platform, setPlatform] = useState2();
  const [info, setInfo] = useState2();
  const downloadUrlRef = useRef2("");
  const [wizard, setWizard] = useState2({ kind: null, videoFormat: null, audioFormat: null, resolution: 0, fps: 0, bitrate: 0 });
  const ytdlpRef = useRef2("");
  const abortRef = useRef2(void 0);
  const [phase, setPhase] = useState2(initialUrl2 ? { name: "probing", status: s.warmingUp } : { name: "input" });
  const [updateInfo, setUpdateInfo] = useState2(null);
  useEffect(() => {
    let cancelled = false;
    void checkForUpdate().then((info2) => {
      if (!cancelled) setUpdateInfo(info2);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80;
  const rows = stdout?.rows && stdout.rows > 0 ? stdout.rows : 24;
  const boxWidth = Math.max(14, Math.min(64, columns - 6));
  const contentWidth = Math.max(10, Math.min(columns - 4, 78));
  const startProbe = useCallback(async (targetUrl) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setPlatform(detectPlatform(targetUrl));
    setPhase({ name: "probing", status: t().warmingUp });
    try {
      const ytdlp = ytdlpRef.current || await ensureYtDlp((status) => setPhase({ name: "probing", status }), controller.signal);
      ytdlpRef.current = ytdlp;
      if (controller.signal.aborted) return;
      setPhase({ name: "probing", status: t().fetchingInfo });
      let videoInfo;
      let downloadUrl = targetUrl;
      try {
        const result = await probe(ytdlp, targetUrl, controller.signal);
        videoInfo = result.info;
        if (result.spotifyFallback && videoInfo.webpage_url) {
          downloadUrl = videoInfo.webpage_url;
        }
      } catch (firstError) {
        if (controller.signal.aborted) return;
        const errMsg = firstError instanceof Error ? firstError.message : String(firstError);
        if (errMsg.toLowerCase().includes("drm") || errMsg.toLowerCase().includes("sign in") || errMsg.toLowerCase().includes("age")) {
          setPhase({ name: "probing", status: t().fetchingInfo });
          const result = await probe(ytdlp, targetUrl, controller.signal, true);
          videoInfo = result.info;
          if (result.spotifyFallback && videoInfo.webpage_url) {
            downloadUrl = videoInfo.webpage_url;
          }
        } else {
          throw firstError;
        }
      }
      downloadUrlRef.current = downloadUrl;
      if (controller.signal.aborted) return;
      setInfo(videoInfo);
      setWizard({ kind: null, videoFormat: null, audioFormat: null, resolution: 0, fps: 0, bitrate: 0 });
      setPhase({ name: "wizard", step: "type" });
    } catch (error) {
      if (controller.signal.aborted) return;
      setPhase({ name: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }, []);
  useEffect(() => {
    if (initialUrl2) void startProbe(initialUrl2);
  }, [initialUrl2, startProbe]);
  const resetToInput = useCallback(() => {
    setUrl("");
    setUrlInput("");
    setPlatform(void 0);
    setInfo(void 0);
    setWizard({ kind: null, videoFormat: null, audioFormat: null, resolution: 0, fps: 0, bitrate: 0 });
    setPhase({ name: "input" });
  }, []);
  const cancelRun = useCallback(() => {
    abortRef.current?.abort();
    resetToInput();
    setUrlInput(url);
  }, [resetToInput, url]);
  useInput2(
    (input, key) => {
      if (key.ctrl && input === "t") {
        cycleTheme();
        return;
      }
      if (key.escape && phase.name === "wizard") {
        if (phase.step === "type") resetToInput();
        else if (phase.step === "format") setPhase({ name: "wizard", step: "type" });
        else if (phase.step === "resolution") setPhase({ name: "wizard", step: "format" });
        else if (phase.step === "fps") setPhase({ name: "wizard", step: "resolution" });
        else if (phase.step === "bitrate") setPhase({ name: "wizard", step: "format" });
        return;
      }
      if (key.escape && (phase.name === "error" || phase.name === "done")) resetToInput();
      if (key.escape && (phase.name === "probing" || phase.name === "downloading")) cancelRun();
      if (key.return && (phase.name === "error" || phase.name === "done")) resetToInput();
    },
    { isActive: Boolean(process.stdin.isTTY) }
  );
  const handleUrlSubmit = (value) => {
    const trimmed = value.trim();
    if (!isProbablyUrl(trimmed)) {
      setPhase({ name: "input", warning: t().notUrl });
      return;
    }
    setUrl(trimmed);
    void startProbe(trimmed);
  };
  const startDownload = useCallback(
    (choice) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setPhase({ name: "downloading", choice, processing: false });
      void (async () => {
        const handlers = {
          onProgress: (progress) => setPhase((prev) => prev.name === "downloading" ? { ...prev, progress, processing: false } : prev),
          onProcessing: () => setPhase((prev) => prev.name === "downloading" ? { ...prev, processing: true } : prev)
        };
        try {
          const ffmpegLocation = await findFfmpeg();
          const actualUrl = downloadUrlRef.current || url;
          const base = { ytdlp: ytdlpRef.current, ffmpegLocation, url: actualUrl, choice, outDir: OUT_DIR };
          let filepath;
          try {
            filepath = await download(base, handlers, controller.signal);
          } catch (error) {
            if (controller.signal.aborted) throw error;
            const errMsg = error instanceof Error ? error.message : String(error);
            const isDrm = errMsg.toLowerCase().includes("drm") || errMsg.toLowerCase().includes("sign in") || errMsg.toLowerCase().includes("age");
            setPhase(
              (prev) => prev.name === "downloading" ? { ...prev, progress: void 0, refreshing: true } : prev
            );
            filepath = await download({ ...base, useCookies: isDrm, strongBypass: true }, handlers, controller.signal);
          }
          onOutcome({ filepath });
          setHistory(addToHistory(url));
          setPhase({ name: "done", filepath });
        } catch (error) {
          if (controller.signal.aborted) return;
          setPhase({ name: "error", message: error instanceof Error ? error.message : String(error) });
        }
      })();
    },
    [url, onOutcome]
  );
  const handleTypePick = (item) => {
    const kind = item.value;
    setWizard((w) => ({ ...w, kind }));
    setPhase({ name: "wizard", step: "format" });
  };
  const handleFormatPick = (item) => {
    if (wizard.kind === "video") {
      const fmt = VIDEO_FORMATS.find((f) => f.id === item.value);
      if (!fmt) return;
      setWizard((w) => ({ ...w, videoFormat: fmt }));
      setPhase({ name: "wizard", step: "resolution" });
    } else {
      const fmt = AUDIO_FORMATS.find((f) => f.id === item.value);
      if (!fmt) return;
      setWizard((w) => ({ ...w, audioFormat: fmt }));
      if (hasBitrateOptions(fmt)) {
        setPhase({ name: "wizard", step: "bitrate" });
      } else {
        const choice = {
          kind: "audio",
          label: `audio \xB7 ${fmt.label}`,
          detail: fmtDesc(fmt.descKey),
          args: buildAudioArgs(fmt)
        };
        startDownload(choice);
      }
    }
  };
  const handleBitratePick = (item) => {
    const fmt = wizard.audioFormat;
    if (!fmt) return;
    setWizard((w) => ({ ...w, bitrate: item.value }));
    const choice = {
      kind: "audio",
      label: `audio \xB7 ${fmt.label} \xB7 ${item.value} kbps`,
      detail: fmtDesc(fmt.descKey),
      args: buildAudioArgs(fmt, item.value)
    };
    startDownload(choice);
  };
  const handleResolutionPick = (item) => {
    setWizard((w) => ({ ...w, resolution: item.value }));
    setPhase({ name: "wizard", step: "fps" });
  };
  const handleFpsPick = (item) => {
    const fmt = wizard.videoFormat;
    if (!fmt) return;
    setWizard((w) => ({ ...w, fps: item.value }));
    const resLabel = wizard.resolution > 0 ? `${wizard.resolution}p` : "best";
    const fpsLabel = item.value > 0 ? `${item.value}fps` : t().sourceFps;
    const choice = {
      kind: "video",
      label: `video \xB7 ${fmt.label} \xB7 ${resLabel} \xB7 ${fpsLabel}`,
      detail: fmtDesc(fmt.descKey),
      args: buildVideoArgs(fmt, wizard.resolution, item.value)
    };
    startDownload(choice);
  };
  const sourceHasVideo = info ? maxHeight(info) > 0 : true;
  const sourceHasAudio = info ? hasAudio(info) : true;
  const typeItems = [
    ...sourceHasVideo || !sourceHasAudio ? [{ key: "video", label: `\u25B6  ${t().videoOption}`, value: "video" }] : [],
    ...sourceHasAudio || !sourceHasVideo ? [{ key: "audio", label: `\u266A  ${t().audioOption}`, value: "audio" }] : []
  ];
  const resolutionItems = RESOLUTIONS.map((r) => ({
    key: String(r.value),
    label: `${r.label}  ${fmtDesc(r.descKey)}`,
    value: r.value
  }));
  const fpsItems = FPS_OPTIONS.map((f) => ({
    key: String(f.value),
    label: `${f.label}  ${fmtDesc(f.descKey)}`,
    value: f.value
  }));
  const videoFormatItems = VIDEO_FORMATS.map((f) => ({
    key: f.id,
    label: `${f.label}${f.recommended ? `  \u2605 ${t().recommended}` : ""}  ${fmtDesc(f.descKey)}`,
    value: f.id
  }));
  const audioFormatItems = AUDIO_FORMATS.map((f) => ({
    key: f.id,
    label: `${f.label}${f.recommended ? `  \u2605 ${t().recommended}` : ""}  ${fmtDesc(f.descKey)}`,
    value: f.id
  }));
  const hints = (() => {
    const base = phase.name === "input" ? [["\u21B5", s.grab], ["^c", s.quit]] : phase.name === "probing" ? [["esc", s.cancel], ["^c", s.quit]] : phase.name === "wizard" ? [["\u2191\u2193", s.choose], ["\u21B5", s.select], ["esc", s.back], ["^c", s.quit]] : phase.name === "downloading" ? [["esc", s.cancel], ["^c", s.quit]] : phase.name === "done" ? [["^c", s.quit]] : [["\u21B5", s.tryAgain], ["^c", s.quit]];
    const withTheme = [...base, ["^t", `${s.theme}:${theme.mode}`]];
    if (phase.name === "input" && history.length > 0) {
      return [withTheme[0], ["\u2191", s.history], ...withTheme.slice(1)];
    }
    return withTheme;
  })();
  const partLabel = (progress) => progress.totalParts > 1 ? `${s.part} ${progress.part + 1}/${progress.totalParts}  ` : "";
  const downloadMeta = (progress) => {
    const speed = progress.speed ? formatSpeed(progress.speed) : "";
    const eta = progress.eta ? `${formatEta(progress.eta)} ${s.left}` : "";
    return `${partLabel(progress)}${speed.padStart(10)}  ${eta.padEnd(12)}`;
  };
  const indeterminateMeta = (progress) => {
    const bytes = formatBytes(progress.downloadedBytes);
    const speed = progress.speed ? formatSpeed(progress.speed) : "";
    return `${partLabel(progress)}${bytes.padStart(8)}  ${speed.padEnd(10)}`;
  };
  const stepTitle = (step) => {
    if (step === "type") return s.stepType;
    if (step === "format") return wizard.kind === "video" ? s.stepVideoFormat : s.stepAudioFormat;
    if (step === "resolution") return s.stepResolution;
    if (step === "fps") return s.stepFps;
    return s.stepBitrate;
  };
  const showFullLogo = phase.name === "input";
  return /* @__PURE__ */ jsxs4(
    Box4,
    {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: columns,
      height: rows,
      backgroundColor: theme.background,
      children: [
        /* @__PURE__ */ jsx5(UpdateBadge, { info: updateInfo }),
        showFullLogo ? /* @__PURE__ */ jsxs4(Fragment, { children: [
          /* @__PURE__ */ jsx5(Logo, {}),
          /* @__PURE__ */ jsx5(Gap, {}),
          /* @__PURE__ */ jsx5(Text5, { color: theme.primary, bold: true, children: s.tagline }),
          /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: s.sitesLine })
        ] }) : /* @__PURE__ */ jsxs4(Box4, { flexDirection: "row", alignItems: "center", children: [
          /* @__PURE__ */ jsx5(LogoCompact, {}),
          /* @__PURE__ */ jsxs4(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: [
            "  \xB7  ",
            s.tagline
          ] })
        ] }),
        /* @__PURE__ */ jsx5(Gap, {}),
        phase.name === "input" && /* @__PURE__ */ jsxs4(Box4, { flexDirection: "column", alignItems: "center", children: [
          /* @__PURE__ */ jsx5(Panel, { title: s.pasteLink, width: boxWidth, children: /* @__PURE__ */ jsx5(
            TextInput,
            {
              value: urlInput,
              onChange: setUrlInput,
              onSubmit: handleUrlSubmit,
              placeholder: s.placeholder,
              width: boxWidth - 8,
              history,
              submitOnPaste: isProbablyUrl
            }
          ) }),
          phase.warning ? /* @__PURE__ */ jsxs4(Text5, { color: theme.danger ?? theme.primary, children: [
            "\u2717 ",
            phase.warning
          ] }) : null
        ] }),
        phase.name === "probing" && /* @__PURE__ */ jsx5(Box4, { flexDirection: "column", alignItems: "center", children: /* @__PURE__ */ jsx5(Panel, { title: platform ? platform.label : s.analyzing, width: boxWidth, children: /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: url.length > boxWidth - 10 ? `${url.slice(0, boxWidth - 11)}\u2026` : url }) }) }),
        phase.name === "wizard" && info && /* @__PURE__ */ jsxs4(Box4, { width: contentWidth, flexDirection: "column", alignItems: "center", children: [
          /* @__PURE__ */ jsx5(MetadataBlock, { info, platform, maxWidth: contentWidth }),
          /* @__PURE__ */ jsx5(Gap, {}),
          /* @__PURE__ */ jsxs4(Panel, { title: stepTitle(phase.step), width: Math.min(56, contentWidth), children: [
            phase.step === "type" && /* @__PURE__ */ jsx5(
              SelectInput,
              {
                indicatorComponent: ChoiceIndicator,
                itemComponent: ChoiceItem,
                items: typeItems,
                onSelect: handleTypePick
              }
            ),
            phase.step === "format" && wizard.kind === "video" && /* @__PURE__ */ jsx5(
              SelectInput,
              {
                indicatorComponent: ChoiceIndicator,
                itemComponent: ChoiceItem,
                items: videoFormatItems,
                onSelect: handleFormatPick
              }
            ),
            phase.step === "format" && wizard.kind === "audio" && /* @__PURE__ */ jsx5(
              SelectInput,
              {
                indicatorComponent: ChoiceIndicator,
                itemComponent: ChoiceItem,
                items: audioFormatItems,
                onSelect: handleFormatPick
              }
            ),
            phase.step === "resolution" && /* @__PURE__ */ jsx5(
              SelectInput,
              {
                indicatorComponent: ChoiceIndicator,
                itemComponent: ChoiceItem,
                items: resolutionItems,
                onSelect: handleResolutionPick
              }
            ),
            phase.step === "fps" && /* @__PURE__ */ jsx5(
              SelectInput,
              {
                indicatorComponent: ChoiceIndicator,
                itemComponent: ChoiceItem,
                items: fpsItems,
                onSelect: handleFpsPick
              }
            ),
            phase.step === "bitrate" && wizard.audioFormat && /* @__PURE__ */ jsx5(
              SelectInput,
              {
                indicatorComponent: ChoiceIndicator,
                itemComponent: ChoiceItem,
                items: bitrateItems(wizard.audioFormat),
                onSelect: handleBitratePick
              }
            )
          ] })
        ] }),
        phase.name === "downloading" && /* @__PURE__ */ jsxs4(Box4, { flexDirection: "column", alignItems: "center", width: contentWidth, children: [
          info ? /* @__PURE__ */ jsx5(MetadataBlock, { info, platform, maxWidth: contentWidth }) : null,
          /* @__PURE__ */ jsx5(Gap, {}),
          /* @__PURE__ */ jsxs4(Text5, { color: theme.accent ?? theme.primary, bold: true, children: [
            "\u25B8 ",
            phase.choice.label
          ] }),
          /* @__PURE__ */ jsx5(Gap, {}),
          phase.processing ? /* @__PURE__ */ jsxs4(Fragment, { children: [
            /* @__PURE__ */ jsx5(ModernProgressBar, { percent: 1, width: Math.min(40, contentWidth - 10) }),
            /* @__PURE__ */ jsx5(Gap, {}),
            /* @__PURE__ */ jsxs4(Text5, { children: [
              /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.primary, children: /* @__PURE__ */ jsx5(Spinner, { type: "dots" }) }),
              /* @__PURE__ */ jsxs4(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: [
                " ",
                s.processing
              ] })
            ] })
          ] }) : phase.progress?.totalBytes ? /* @__PURE__ */ jsxs4(Fragment, { children: [
            /* @__PURE__ */ jsx5(
              ModernProgressBar,
              {
                percent: phase.progress.downloadedBytes / phase.progress.totalBytes,
                width: Math.min(40, contentWidth - 10)
              }
            ),
            /* @__PURE__ */ jsx5(Gap, {}),
            /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: downloadMeta(phase.progress) })
          ] }) : phase.progress ? /* @__PURE__ */ jsxs4(Fragment, { children: [
            /* @__PURE__ */ jsxs4(Text5, { children: [
              /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.primary, children: /* @__PURE__ */ jsx5(Spinner, { type: "dots" }) }),
              /* @__PURE__ */ jsxs4(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: [
                " ",
                s.downloading
              ] })
            ] }),
            /* @__PURE__ */ jsx5(Gap, {}),
            /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: indeterminateMeta(phase.progress) })
          ] }) : /* @__PURE__ */ jsxs4(Fragment, { children: [
            /* @__PURE__ */ jsx5(ModernProgressBar, { percent: 0, width: Math.min(40, contentWidth - 10) }),
            /* @__PURE__ */ jsx5(Gap, {}),
            /* @__PURE__ */ jsxs4(Text5, { children: [
              /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.primary, children: /* @__PURE__ */ jsx5(Spinner, { type: "dots" }) }),
              /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: phase.refreshing ? ` ${s.linkExpired}` : ` ${s.starting}` })
            ] })
          ] }),
          /* @__PURE__ */ jsx5(Gap, {}),
          /* @__PURE__ */ jsx5(TipDisplay, { maxWidth: contentWidth })
        ] }),
        phase.name === "done" && /* @__PURE__ */ jsxs4(Box4, { flexDirection: "column", alignItems: "center", children: [
          /* @__PURE__ */ jsxs4(Text5, { children: [
            /* @__PURE__ */ jsxs4(Text5, { bold: true, color: theme.success ?? theme.primary, children: [
              "\u2713 ",
              s.grabbed,
              " "
            ] }),
            /* @__PURE__ */ jsx5(Text5, { color: theme.primary, children: s.savedTo })
          ] }),
          /* @__PURE__ */ jsx5(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: shortenPath(phase.filepath, os3.homedir(), 60) }),
          /* @__PURE__ */ jsx5(Gap, {}),
          /* @__PURE__ */ jsx5(
            Box4,
            {
              borderStyle: "double",
              borderColor: theme.accent ?? theme.gray,
              paddingX: 3,
              children: /* @__PURE__ */ jsx5(Text5, { bold: true, color: theme.primary, children: s.grabAnother })
            }
          )
        ] }),
        phase.name === "error" && /* @__PURE__ */ jsx5(Box4, { flexDirection: "column", alignItems: "center", width: Math.max(10, Math.min(columns - 6, 72)), children: /* @__PURE__ */ jsxs4(Text5, { bold: true, color: theme.danger ?? theme.primary, children: [
          "\u2717 ",
          phase.message
        ] }) }),
        hints.length > 0 ? /* @__PURE__ */ jsxs4(Fragment, { children: [
          /* @__PURE__ */ jsx5(Gap, { lines: 2 }),
          /* @__PURE__ */ jsx5(
            Shortcuts,
            {
              items: hints,
              leading: phase.name === "probing" ? /* @__PURE__ */ jsxs4(Text5, { children: [
                /* @__PURE__ */ jsx5(Text5, { color: theme.accent ?? theme.primary, children: /* @__PURE__ */ jsx5(Spinner, { type: "dots" }) }),
                /* @__PURE__ */ jsxs4(Text5, { color: theme.gray, dimColor: theme.dimSecondary, children: [
                  " ",
                  phase.status
                ] })
              ] }) : void 0
            }
          )
        ] }) : null
      ]
    }
  );
}

// src/lib/args.ts
function parseArgs(argv) {
  const result = { help: false, version: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-v" || arg === "--version") {
      result.version = true;
    } else if (arg === "--theme") {
      const value = argv[++i];
      if (!value || value.startsWith("-")) {
        result.error = "--theme needs a value: system, dark, or light";
        return result;
      }
      if (!isThemeMode(value)) {
        result.error = `unknown theme "${value}" \u2014 use system, dark, or light`;
        return result;
      }
      result.themeMode = value;
    } else if (arg.startsWith("-") && arg !== "-") {
      result.error = `unknown option "${arg}"`;
      return result;
    } else {
      rest.push(arg);
    }
  }
  if (rest.length > 1) {
    result.error = "only one url is supported";
    return result;
  }
  result.initialUrl = rest[0];
  return result;
}

// src/lib/image-protocol.ts
var cachedProtocol;
var cellPixelSize;
async function queryTerminal(timeoutMs = 350) {
  if (!process.stdout.isTTY || !process.stdin.isTTY) return {};
  const kittyQuery = "\x1B_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1B\\";
  const cellQuery = "\x1B[16t";
  return new Promise((resolve) => {
    let resolved = false;
    let buffer = "";
    let sawKittyReply = false;
    const caps = {};
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.pause();
      if (process.stdin.setRawMode) {
        try {
          process.stdin.setRawMode(false);
        } catch {
        }
      }
    };
    const finish = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      cleanup();
      resolve(caps);
    };
    const onData = (chunk) => {
      buffer += chunk.toString();
      if (!sawKittyReply && buffer.includes("\x1B_Gi=31;")) {
        sawKittyReply = true;
        if (buffer.includes("\x1B_Gi=31;OK")) caps.protocol = "kitty";
      }
      const cellMatch = /\x1b\[6;(\d+);(\d+)t/.exec(buffer);
      if (cellMatch && !caps.cellPixelSize) {
        const height = Number.parseInt(cellMatch[1], 10);
        const width = Number.parseInt(cellMatch[2], 10);
        if (width > 0 && height > 0) caps.cellPixelSize = { width, height };
      }
      if (sawKittyReply && caps.cellPixelSize) finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    try {
      if (process.stdin.setRawMode) process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onData);
      process.stdout.write(kittyQuery + cellQuery);
    } catch {
      clearTimeout(timer);
      cleanup();
      resolve(caps);
    }
  });
}
function setProtocol(protocol) {
  cachedProtocol = protocol;
}
function setCellPixelSize(size) {
  cellPixelSize = size;
}

// src/cli.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var VERSION = createRequire(import.meta.url)("../package.json").version;
var HELP = `
  \u25C8 Carbon \u2014 grab any video or music. pick. download. done.

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
  Powered by yt-dlp \u2014 YouTube, TikTok, Instagram, X, SoundCloud & 1800+ sites.
`;
var args = parseArgs(process.argv.slice(2));
if (args.error) {
  console.error(`carbon: ${args.error}
Try "carbon --help" for usage.`);
  process.exit(1);
}
if (args.help) {
  console.log(HELP);
  process.exit(0);
}
if (args.version) {
  console.log(VERSION);
  process.exit(0);
}
var initialUrl = args.initialUrl;
var initialThemeMode = args.themeMode ?? "system";
var isTTY = Boolean(process.stdout.isTTY);
if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error(
    "carbon: interactive terminal required.\nCarbon needs a real TTY terminal to run its UI.\nRun it from a normal terminal (Windows Terminal, cmd, PowerShell, iTerm2, etc.)."
  );
  process.exit(1);
}
var enterAltScreen = () => process.stdout.write("\x1B[?1049h\x1B[H");
var leaveAltScreen = () => process.stdout.write("\x1B[?1049l");
if (isTTY) {
  const caps = await queryTerminal(350);
  if (caps.protocol) setProtocol(caps.protocol);
  if (caps.cellPixelSize) setCellPixelSize(caps.cellPixelSize);
}
if (isTTY) {
  enterAltScreen();
  process.on("exit", leaveAltScreen);
  for (const event of ["uncaughtException", "unhandledRejection"]) {
    process.on(event, (error) => {
      leaveAltScreen();
      console.error(error);
      process.exit(1);
    });
  }
}
var outcome = {};
var { waitUntilExit } = render(
  /* @__PURE__ */ jsx6(
    App,
    {
      initialUrl,
      initialThemeMode,
      onOutcome: (result) => outcome = result
    }
  )
);
await waitUntilExit();
if (isTTY) leaveAltScreen();
if (outcome.filepath) {
  console.log(`\u2713 grabbed \u2192 ${outcome.filepath}`);
}
