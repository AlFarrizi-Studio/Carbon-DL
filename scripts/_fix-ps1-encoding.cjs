/**
 * Temporary: make install.ps1 pure ASCII and BOM-free.
 *
 * A UTF-8 BOM makes `irm <url> | iex` fail silently (the BOM char is glued
 * to the first token), and non-ASCII characters make Windows PowerShell 5.1
 * mis-decode the file when it is read as ANSI. Pure ASCII works in every
 * scenario: `irm | iex`, `.\install.ps1` and `powershell -File install.ps1`.
 */
const fs = require('node:fs')
const path = require('node:path')

const FILE = path.join(__dirname, '..', 'install.ps1')
let src = fs.readFileSync(FILE, 'utf8').replace(/^\uFEFF/, '')

// 1. Replace the box-drawing banner with clean ASCII art.
const bannerOld = src.match(/Write-Host ''\n(?:Write-Host '[^\n]*' -ForegroundColor Cyan\n){6}/)
if (bannerOld) {
  const bannerNew = `Write-Host ''
Write-Host '   ____   ____  ____  ____  _____  ___   ___' -ForegroundColor Cyan
Write-Host '  / ___| |  _ \\|  _ \\|  _ \\|  ___| |   | |_ _|' -ForegroundColor Cyan
Write-Host '  | |    | | | | | | | | | |_   | |   |  | |' -ForegroundColor Cyan
Write-Host '  | |___ | |_| | |_| | |_| |  _|  | |___|  | |' -ForegroundColor Cyan
Write-Host '   \\____|\\____/ \\____/ \\____/ |_|   \\____/\\_,_|' -ForegroundColor Cyan
`
  src = src.replace(bannerOld[0], bannerNew)
} else {
  console.log('! banner tidak ditemukan')
}

// 2. Replace every remaining non-ASCII character with an ASCII equivalent.
const MAP = {
  '\u2550': '=', // box double horizontal
  '\u2551': '|', // box double vertical
  '\u2554': '+', // box double down right
  '\u2557': '+', // box double down left
  '\u255A': '+', // box double up right
  '\u255D': '+', // box double up left
  '\u2588': '#', // full block
  '\u26A0': '!', // warning sign
  '\u2713': '+', // check mark
  '\u2717': 'x', // ballot x
  '\u2192': '->', // rightwards arrow
  '\u2014': '-', // em dash
  '\u2013': '-', // en dash
  '\u00B7': '.', // middle dot
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
}
let converted = 0
src = src.replace(/[^\x00-\x7F]/g, ch => {
  converted++
  return MAP[ch] ?? '?'
})

fs.writeFileSync(FILE, src, {encoding: 'utf8'})

// 3. Verify
const bytes = fs.readFileSync(FILE)
const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
const nonAscii = bytes.filter(b => b > 127).length
console.log(`karakter non-ASCII dikonversi : ${converted}`)
console.log(`BOM                           : ${hasBom ? 'MASIH ADA' : 'tidak ada ✓'}`)
console.log(`sisa byte non-ASCII          : ${nonAscii} ${nonAscii === 0 ? '✓' : '❌'}`)
console.log(`ukuran                       : ${bytes.length} bytes`)
