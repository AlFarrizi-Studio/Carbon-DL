/**
 * Carbon Tips — rotating fun facts shown during downloads.
 * Tips rotate every TIP_INTERVAL_MS milliseconds and are localized to the
 * active UI language. Languages without a dedicated tip pack fall back to
 * English so the carousel is never empty.
 */

import {getLanguage} from './i18n.js'

export const TIP_INTERVAL_MS = 10_000

const EN: string[] = [
  // ── Carbon / app tips ──────────────────────────────────────────────
  'Carbon supports 1800+ websites — YouTube, TikTok, Instagram, X, SoundCloud and more.',
  'Press Ctrl+T anytime to switch between dark, light and system theme.',
  'MP4 is the most compatible video format — it plays on virtually every device.',
  'FLAC is lossless audio — perfect quality, but bigger file size.',
  'MP3 at 320 kbps is indistinguishable from lossless for most listeners.',
  'MKV containers can hold multiple audio tracks and subtitles in one file.',
  'WEBM is great for web content — smaller files with good quality.',
  'Carbon automatically embeds metadata and cover art into your downloads.',
  'Your download history is saved — press ↑ on the input screen to browse it.',
  'Carbon downloads to your ~/Downloads folder by default.',
  'Set CARBON_LANG=id to use Carbon in Bahasa Indonesia.',
  'Carbon supports 80+ languages — it auto-detects your system language.',
  'Press Esc during a download to cancel it safely.',
  'Carbon auto-downloads yt-dlp on first run — no manual setup needed.',
  'FFmpeg is bundled automatically for format conversion and merging.',
  'The "best" resolution option picks the highest quality available.',
  '60fps makes gameplay and sports videos look much smoother.',
  'AAC is the standard audio format for Apple devices.',
  'M4A files are AAC audio in an MP4 container — great quality/size ratio.',
  'WAV is uncompressed audio — used in professional audio production.',
  // ── Music facts ────────────────────────────────────────────────────
  'The most expensive musical instrument ever sold was a Stradivarius violin for $16 million.',
  'The song "Happy Birthday" was under copyright until 2016.',
  'Beethoven composed music even after becoming completely deaf.',
  'The first music video ever played on MTV was "Video Killed the Radio Star".',
  'An "earworm" is a song that gets stuck in your head — 98% of people experience them.',
  'The longest song ever released is 13 hours and 23 minutes long.',
  'Vinyl records have outsold CDs in recent years for the first time since the 1980s.',
  'The most streamed song on Spotify has over 4 billion plays.',
  'Mozart wrote his first symphony at age 8.',
  'The term "album" comes from the Latin word for "white" — originally a collection of songs.',
  'Listening to music releases dopamine — the same chemical as eating chocolate.',
  'The world\'s largest music genre by revenue is pop music.',
  'Jazz originated in New Orleans in the late 19th century.',
  'The electric guitar was invented in 1931.',
  'A standard piano has 88 keys — 52 white and 36 black.',
  'The human voice can produce over 100 different tones.',
  'Music can physically repair brain damage and improve memory.',
  'The fastest tempo ever recorded in a song is 1015 BPM.',
  'Binaural beats can help you focus or relax depending on the frequency.',
  'The first song ever played in space was "Jingle Bells" by astronauts in 1965.',
  // ── Video facts ────────────────────────────────────────────────────
  'The first YouTube video ever uploaded was "Me at the zoo" in 2005.',
  'Over 500 hours of video are uploaded to YouTube every minute.',
  'The most viewed YouTube video has over 14 billion views.',
  '4K resolution is exactly 3840 × 2160 pixels — four times Full HD.',
  'The human eye can perceive up to 1000 frames per second.',
  'The first movie ever made was "Roundhay Garden Scene" in 1888 — it\'s 2 seconds long.',
  'H.265/HEVC can deliver the same quality as H.264 at half the file size.',
  'The average person watches 100 minutes of online video per day.',
  'TikTok videos are limited to 10 minutes, but most viral ones are under 60 seconds.',
  'The first color film was made in 1902 using a process called Kinemacolor.',
  'IMAX screens can be up to 38 meters wide — that\'s 12 stories tall.',
  'The term "blockbuster" originally meant a bomb powerful enough to destroy a city block.',
  'Streaming video accounts for over 60% of global internet traffic.',
  'The first TV broadcast with sound was in 1926.',
  'A single minute of uncompressed 4K video at 60fps is about 1.5 GB.',
  'The aspect ratio 16:9 was chosen as the standard for HDTV in the 1990s.',
  'Slow motion works by capturing more frames per second than playback.',
  'The first animated film was "Fantasmagorie" in 1908.',
  'Video compression removes data your eyes can\'t perceive.',
  'The word "cinema" comes from the Greek word for "movement".',
  // ── Internet / tech facts ──────────────────────────────────────────
  'The first website ever created is still online: info.cern.ch',
  'About 5.4 billion people use the internet — 67% of the world population.',
  'The first email was sent in 1971 by Ray Tomlinson.',
  'Over 333 billion emails are sent every day worldwide.',
  'The internet weighs about as much as a strawberry (in electrons).',
  'The first domain name ever registered was symbolics.com in 1985.',
  'Google processes over 8.5 billion searches per day.',
  'The first computer "bug" was an actual moth found in a relay in 1947.',
  'A single Google search uses about 0.3 watt-hours of electricity.',
  'The internet and the World Wide Web are not the same thing.',
  'The first webcam watched a coffee pot at Cambridge University.',
  'Over 2.5 quintillion bytes of data are created every day.',
  'The first smartphone was the IBM Simon, released in 1994.',
  'Wi-Fi was originally called "WaveLAN".',
  'The @ symbol was almost removed from keyboards before email was invented.',
  'The first 1GB hard drive weighed 550 pounds and was made by IBM in 1980.',
  'Bluetooth is named after a Viking king, Harald Bluetooth.',
  'The first text message ever sent said "Merry Christmas" in 1992.',
  'About 90% of the world\'s data was created in the last two years.',
  'The QWERTY keyboard was designed to slow typists down to prevent jamming.',
  // ── Fun / random facts ─────────────────────────────────────────────
  'Honey never spoils — archaeologists found 3000-year-old edible honey in Egyptian tombs.',
  'Octopuses have three hearts and blue blood.',
  'A group of flamingos is called a "flamboyance".',
  'Bananas are berries, but strawberries are not.',
  'The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896).',
  'There are more possible chess games than atoms in the observable universe.',
  'A day on Venus is longer than a year on Venus.',
  'The inventor of the Pringles can is buried in one.',
  'Sharks existed before trees — by about 50 million years.',
  'The dot over the letters "i" and "j" is called a "tittle".',
  'Wombat poop is cube-shaped.',
  'The first oranges weren\'t orange — they were green.',
  'A jiffy is an actual unit of time: 1/100th of a second.',
  'The unicorn is the national animal of Scotland.',
  'There\'s a species of jellyfish that is biologically immortal.',
  'The longest English word without a vowel is "rhythms".',
  'Cows have best friends and get stressed when separated.',
  'The heart of a shrimp is located in its head.',
  'There are more stars in the universe than grains of sand on Earth.',
  'The first alarm clock could only ring at 4 AM.',
  'A bolt of lightning is five times hotter than the surface of the sun.',
  'The Eiffel Tower can grow up to 15 cm taller in summer due to heat.',
  'Sloths can hold their breath longer than dolphins — up to 40 minutes.',
  'The first computer programmer was Ada Lovelace in the 1840s.',
  'There are more fake flamingos in the world than real ones.',
  'The average person walks the equivalent of 5 times around the world in their lifetime.',
  'A cloud weighs about 1.1 million pounds on average.',
  'The first photograph took 8 hours to expose.',
  'Polar bears have black skin under their white fur.',
  'The longest hiccuping spree lasted 68 years.',
  // ── Downloading / file tips ────────────────────────────────────────
  'Downloading at night is often faster — less network congestion.',
  'A wired ethernet connection is more stable than Wi-Fi for large downloads.',
  'File names with special characters can cause issues on some systems.',
  'Checksums (MD5, SHA-256) verify that a downloaded file is intact.',
  'The first file ever downloaded over the internet was in 1969 via FTP.',
  'BitTorrent splits files into pieces and downloads them from many peers.',
  'A 4K movie can be 50-100 GB in uncompressed format.',
  'The average download speed worldwide is about 50 Mbps.',
  'ZIP files were invented in 1989 by Phil Katz.',
  'The .mp3 extension stands for MPEG-1 Audio Layer 3.',
  'Lossy compression (MP3, JPEG) removes data; lossless (FLAC, PNG) does not.',
  'The first JPEG image was created in 1992.',
  'Streaming a song uses about 2-3 MB of data per minute at standard quality.',
  'A 3-minute song in FLAC format is about 20-30 MB.',
  'The same song in MP3 320kbps is about 7 MB.',
  'Video bitrate affects quality more than resolution does.',
  '24fps is the standard for movies; 30fps for TV; 60fps for gaming.',
  'The term "buffering" comes from filling a buffer before playback.',
  'Peer-to-peer downloading was popularized by Napster in 1999.',
  'The first video ever streamed live was in 1993.',
]

const ID: string[] = [
  // ── Tips Carbon / aplikasi ─────────────────────────────────────────
  'Carbon mendukung 1800+ situs — YouTube, TikTok, Instagram, X, SoundCloud, dan lainnya.',
  'Tekan Ctrl+T kapan saja untuk berganti tema gelap, terang, atau sistem.',
  'MP4 adalah format video paling kompatibel — bisa diputar di hampir semua perangkat.',
  'FLAC adalah audio lossless — kualitas sempurna, tapi ukuran file lebih besar.',
  'MP3 320 kbps tidak bisa dibedakan dari lossless oleh kebanyakan pendengar.',
  'Kontainer MKV bisa menyimpan beberapa trek audio dan subtitle dalam satu file.',
  'WEBM cocok untuk konten web — file lebih kecil dengan kualitas bagus.',
  'Carbon otomatis menanamkan metadata dan cover art ke hasil unduhanmu.',
  'Riwayat unduhanmu tersimpan — tekan ↑ di layar input untuk menelusurinya.',
  'Carbon mengunduh ke folder ~/Downloads secara default.',
  'Setel CARBON_LANG=id untuk memakai Carbon dalam Bahasa Indonesia.',
  'Carbon mendukung 80+ bahasa — otomatis mendeteksi bahasa sistemmu.',
  'Tekan Esc saat mengunduh untuk membatalkan dengan aman.',
  'Carbon otomatis mengunduh yt-dlp saat pertama dijalankan — tanpa setup manual.',
  'FFmpeg disertakan otomatis untuk konversi dan penggabungan format.',
  'Opsi resolusi "best" memilih kualitas tertinggi yang tersedia.',
  '60fps membuat video gameplay dan olahraga terlihat jauh lebih mulus.',
  'AAC adalah format audio standar untuk perangkat Apple.',
  'File M4A adalah audio AAC dalam kontainer MP4 — rasio kualitas/ukuran bagus.',
  'WAV adalah audio tanpa kompresi — dipakai di produksi audio profesional.',
  // ── Fakta musik ────────────────────────────────────────────────────
  'Alat musik termahal yang pernah dijual adalah biola Stradivarius seharga $16 juta.',
  'Lagu "Happy Birthday" dilindungi hak cipta hingga tahun 2016.',
  'Beethoven tetap menggubah musik bahkan setelah benar-benar tuli.',
  'Video musik pertama yang diputar di MTV adalah "Video Killed the Radio Star".',
  '"Earworm" adalah lagu yang terus terngiang di kepala — 98% orang pernah mengalaminya.',
  'Lagu terpanjang yang pernah dirilis berdurasi 13 jam 23 menit.',
  'Piringan hitam kembali mengalahkan penjualan CD untuk pertama kalinya sejak 1980-an.',
  'Lagu paling banyak diputar di Spotify telah melebihi 4 miliar pemutaran.',
  'Mozart menulis simfoni pertamanya di usia 8 tahun.',
  'Istilah "album" berasal dari kata Latin untuk "putih" — awalnya kumpulan lagu.',
  'Mendengarkan musik melepaskan dopamin — zat kimia yang sama saat makan cokelat.',
  'Genre musik terbesar di dunia berdasarkan pendapatan adalah musik pop.',
  'Jazz berasal dari New Orleans pada akhir abad ke-19.',
  'Gitar listrik ditemukan pada tahun 1931.',
  'Piano standar memiliki 88 tuts — 52 putih dan 36 hitam.',
  'Suara manusia bisa menghasilkan lebih dari 100 nada berbeda.',
  'Musik bisa membantu memperbaiki kerusakan otak dan meningkatkan memori.',
  'Tempo tercepat yang pernah tercatat dalam sebuah lagu adalah 1015 BPM.',
  'Binaural beats bisa membantu fokus atau rileks tergantung frekuensinya.',
  'Lagu pertama yang diputar di luar angkasa adalah "Jingle Bells" oleh astronot pada 1965.',
  // ── Fakta video ────────────────────────────────────────────────────
  'Video YouTube pertama yang pernah diunggah adalah "Me at the zoo" pada 2005.',
  'Lebih dari 500 jam video diunggah ke YouTube setiap menit.',
  'Video YouTube paling banyak ditonton telah melebihi 14 miliar views.',
  'Resolusi 4K tepat 3840 × 2160 piksel — empat kali Full HD.',
  'Mata manusia bisa menangkap hingga 1000 frame per detik.',
  'Film pertama yang pernah dibuat adalah "Roundhay Garden Scene" pada 1888 — durasinya 2 detik.',
  'H.265/HEVC bisa menghasilkan kualitas sama dengan H.264 pada setengah ukuran file.',
  'Rata-rata orang menonton 100 menit video online per hari.',
  'Video TikTok dibatasi 10 menit, tapi kebanyakan yang viral di bawah 60 detik.',
  'Film berwarna pertama dibuat pada 1902 menggunakan proses bernama Kinemacolor.',
  'Layar IMAX bisa selebar 38 meter — setinggi gedung 12 lantai.',
  'Istilah "blockbuster" awalnya berarti bom yang cukup kuat menghancurkan satu blok kota.',
  'Streaming video menyumbang lebih dari 60% lalu lintas internet global.',
  'Siaran TV pertama dengan suara terjadi pada 1926.',
  'Satu menit video 4K tanpa kompresi pada 60fps berukuran sekitar 1,5 GB.',
  'Rasio aspek 16:9 dipilih sebagai standar HDTV pada 1990-an.',
  'Slow motion bekerja dengan menangkap lebih banyak frame per detik daripada pemutaran.',
  'Film animasi pertama adalah "Fantasmagorie" pada 1908.',
  'Kompresi video membuang data yang tidak bisa ditangkap matamu.',
  'Kata "cinema" berasal dari kata Yunani untuk "gerakan".',
  // ── Fakta internet / teknologi ─────────────────────────────────────
  'Website pertama yang pernah dibuat masih online: info.cern.ch',
  'Sekitar 5,4 miliar orang menggunakan internet — 67% populasi dunia.',
  'Email pertama dikirim pada 1971 oleh Ray Tomlinson.',
  'Lebih dari 333 miliar email dikirim setiap hari di seluruh dunia.',
  'Internet memiliki berat sekitar sama dengan buah stroberi (dalam elektron).',
  'Nama domain pertama yang pernah didaftarkan adalah symbolics.com pada 1985.',
  'Google memproses lebih dari 8,5 miliar pencarian per hari.',
  '"Bug" komputer pertama adalah ngengat sungguhan yang ditemukan di relay pada 1947.',
  'Satu pencarian Google menggunakan sekitar 0,3 watt-jam listrik.',
  'Internet dan World Wide Web bukanlah hal yang sama.',
  'Webcam pertama mengawasi teko kopi di Universitas Cambridge.',
  'Lebih dari 2,5 kuintiliun byte data dibuat setiap hari.',
  'Smartphone pertama adalah IBM Simon, dirilis pada 1994.',
  'Wi-Fi awalnya bernama "WaveLAN".',
  'Simbol @ hampir dihapus dari keyboard sebelum email ditemukan.',
  'Hard drive 1GB pertama berbobot 250 kg dan dibuat oleh IBM pada 1980.',
  'Bluetooth dinamai dari raja Viking, Harald Bluetooth.',
  'Pesan teks pertama yang pernah dikirim berbunyi "Selamat Natal" pada 1992.',
  'Sekitar 90% data dunia dibuat dalam dua tahun terakhir.',
  'Keyboard QWERTY dirancang untuk memperlambat pengetik agar tidak macet.',
  // ── Fakta seru / acak ──────────────────────────────────────────────
  'Madu tidak pernah basi — arkeolog menemukan madu 3000 tahun yang masih bisa dimakan di makam Mesir.',
  'Gurita memiliki tiga jantung dan darah biru.',
  'Sekelompok flamingo disebut "flamboyance".',
  'Pisang adalah buah beri, tapi stroberi bukan.',
  'Perang tersingkat dalam sejarah berlangsung 38 menit (Inggris vs Zanzibar, 1896).',
  'Ada lebih banyak kemungkinan permainan catur daripada atom di alam semesta yang teramati.',
  'Satu hari di Venus lebih lama daripada satu tahun di Venus.',
  'Penemu kaleng Pringles dimakamkan di dalam kalengnya.',
  'Hiu sudah ada sebelum pohon — sekitar 50 juta tahun lebih dulu.',
  'Titik di atas huruf "i" dan "j" disebut "tittle".',
  'Kotoran wombat berbentuk kubus.',
  'Jeruk pertama bukanlah oranye — warnanya hijau.',
  'Jiffy adalah satuan waktu sungguhan: 1/100 detik.',
  'Unicorn adalah hewan nasional Skotlandia.',
  'Ada spesies ubur-ubur yang secara biologis abadi.',
  'Kata bahasa Inggris terpanjang tanpa huruf vokal adalah "rhythms".',
  'Sapi punya sahabat dan stres saat dipisahkan.',
  'Jantung udang terletak di kepalanya.',
  'Ada lebih banyak bintang di alam semesta daripada butiran pasir di Bumi.',
  'Jam alarm pertama hanya bisa berbunyi pada pukul 4 pagi.',
  'Sambaran petir lima kali lebih panas daripada permukaan matahari.',
  'Menara Eiffel bisa tumbuh hingga 15 cm lebih tinggi di musim panas karena panas.',
  'Kungkang bisa menahan napas lebih lama daripada lumba-lumba — hingga 40 menit.',
  'Programmer komputer pertama adalah Ada Lovelace pada 1840-an.',
  'Ada lebih banyak flamingo palsu di dunia daripada yang asli.',
  'Rata-rata orang berjalan setara 5 kali keliling dunia seumur hidupnya.',
  'Awan rata-rata berbobot sekitar 500.000 kg.',
  'Foto pertama membutuhkan 8 jam untuk pencahayaan.',
  'Beruang kutub memiliki kulit hitam di bawah bulu putihnya.',
  'Rekor cegukan terlama berlangsung 68 tahun.',
  // ── Tips unduhan / file ────────────────────────────────────────────
  'Mengunduh di malam hari sering lebih cepat — lebih sedikit kepadatan jaringan.',
  'Koneksi ethernet kabel lebih stabil daripada Wi-Fi untuk unduhan besar.',
  'Nama file dengan karakter khusus bisa bermasalah di beberapa sistem.',
  'Checksum (MD5, SHA-256) memverifikasi bahwa file unduhan utuh.',
  'File pertama yang diunduh lewat internet adalah pada 1969 via FTP.',
  'BitTorrent memecah file menjadi potongan dan mengunduhnya dari banyak peer.',
  'Film 4K bisa berukuran 50-100 GB dalam format tanpa kompresi.',
  'Kecepatan unduh rata-rata dunia sekitar 50 Mbps.',
  'File ZIP ditemukan pada 1989 oleh Phil Katz.',
  'Ekstensi .mp3 adalah singkatan dari MPEG-1 Audio Layer 3.',
  'Kompresi lossy (MP3, JPEG) membuang data; lossless (FLAC, PNG) tidak.',
  'Gambar JPEG pertama dibuat pada 1992.',
  'Streaming satu lagu memakai sekitar 2-3 MB data per menit pada kualitas standar.',
  'Lagu 3 menit dalam format FLAC berukuran sekitar 20-30 MB.',
  'Lagu yang sama dalam MP3 320kbps berukuran sekitar 7 MB.',
  'Bitrate video memengaruhi kualitas lebih dari resolusi.',
  '24fps standar untuk film; 30fps untuk TV; 60fps untuk gaming.',
  'Istilah "buffering" berasal dari mengisi buffer sebelum pemutaran.',
  'Unduhan peer-to-peer dipopulerkan oleh Napster pada 1999.',
  'Video pertama yang disiarkan langsung secara streaming adalah pada 1993.',
]

/** Localized tip packs. Add a new language by adding a keyed array here. */
const TIPS_BY_LANG: Record<string, string[]> = {
  en: EN,
  id: ID,
}

/** Resolve the tip list for the active language, falling back to English. */
function activeTips(): string[] {
  return TIPS_BY_LANG[getLanguage()] ?? EN
}

let shuffled: string[] = []
let index = 0
let lastLang: string | undefined

function shuffle(arr: string[]): string[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

/** Get the next tip in shuffled rotation (localized to the active language). */
export function nextTip(): string {
  const lang = getLanguage()
  if (shuffled.length === 0 || index >= shuffled.length || lastLang !== lang) {
    lastLang = lang
    shuffled = shuffle(activeTips())
    index = 0
  }
  return shuffled[index++]!
}

/** Get a random tip (for initial display), localized to the active language. */
export function randomTip(): string {
  const tips = activeTips()
  return tips[Math.floor(Math.random() * tips.length)]!
}