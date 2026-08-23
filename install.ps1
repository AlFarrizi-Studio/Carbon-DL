# Carbon installer for Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/AlFarrizi-Studio/Carbon-DL/main/install.ps1 | iex

$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '  ██████╗ █████╗ ██████╗ ██████╗  ██████╗ ███╗   ██╗' -ForegroundColor Cyan
Write-Host ' ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔═══██╗████╗  ██║' -ForegroundColor Cyan
Write-Host ' ██║     ███████║██████╔╝██████╔╝██║   ██║██╔██╗ ██║' -ForegroundColor Cyan
Write-Host ' ██║     ██╔══██║██╔══██╗██╔══██╗██║   ██║██║╚██╗██║' -ForegroundColor Cyan
Write-Host ' ╚██████╗██║  ██║██║  ██║██████╔╝╚██████╔╝██║ ╚████║' -ForegroundColor Cyan
Write-Host '  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝' -ForegroundColor Cyan
Write-Host ''
Write-Host ' Installing Carbon...' -ForegroundColor White
Write-Host ''

$GITHUB_REPO = 'AlFarrizi-Studio/Carbon-DL'
$INSTALL_DIR = Join-Path $env:LOCALAPPDATA 'Carbon'

# --- Check / install Node.js ---
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host ' → Node.js not found. Downloading and installing automatically...' -ForegroundColor Yellow

    $nodeVersion = 'v20.18.1'
    $arch = if ([Environment]::Is64BitOperatingSystem) { 'x64' } else { 'x86' }
    $msiUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-$arch.msi"
    $msiPath = Join-Path $env:TEMP "node-$nodeVersion-$arch.msi"

    Write-Host "   Downloading Node.js $nodeVersion ($arch)..." -ForegroundColor White
    try {
        Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
    } catch {
        Write-Host ' ✗ Failed to download Node.js.' -ForegroundColor Red
        Write-Host '   Please install Node.js manually from https://nodejs.org and re-run this script.' -ForegroundColor Yellow
        exit 1
    }

    Write-Host '   Installing Node.js (this may take a moment)...' -ForegroundColor White
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Host ' ✗ Node.js installation failed.' -ForegroundColor Red
        Write-Host '   Please install Node.js manually from https://nodejs.org and re-run this script.' -ForegroundColor Yellow
        exit 1
    }

    Remove-Item $msiPath -Force -ErrorAction SilentlyContinue

    # Refresh PATH so we can find node in this session
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machinePath;$userPath"

    Write-Host ' ✓ Node.js installed.' -ForegroundColor Green
}

# Verify node is now available
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host ' ✗ Node.js was installed but is not found in PATH.' -ForegroundColor Red
    Write-Host '   Please open a new terminal and re-run this script.' -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node --version) -replace '^v', ''
$major = [int]($nodeVersion.Split('.')[0])
if ($major -lt 18) {
    Write-Host " ✗ Node.js v$nodeVersion found, but v18+ is required." -ForegroundColor Red
    Write-Host '   Update Node.js from https://nodejs.org, then re-run this script.' -ForegroundColor Yellow
    exit 1
}
Write-Host " ✓ Node.js v$nodeVersion" -ForegroundColor Green

# --- Download Carbon from GitHub ---
Write-Host ' → Downloading Carbon from GitHub...' -ForegroundColor White

# Get latest release tag (for display only)
$tagName = 'latest'
try {
    $releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/$GITHUB_REPO/releases/latest" -UseBasicParsing
    $tagName = $releaseInfo.tag_name
} catch {}

Write-Host "   Version: $tagName" -ForegroundColor White

# Always download from main branch — dist/cli.js there is the latest build
$cliUrl = "https://raw.githubusercontent.com/$GITHUB_REPO/main/dist/cli.js"
$cliPath = Join-Path $INSTALL_DIR 'cli.js'

# Create install directory
if (-not (Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
}

Write-Host "   Downloading cli.js..." -ForegroundColor White
try {
    Invoke-WebRequest -Uri $cliUrl -OutFile $cliPath -UseBasicParsing
} catch {
    Write-Host ' ✗ Failed to download Carbon.' -ForegroundColor Red
    Write-Host "   URL: $cliUrl" -ForegroundColor Yellow
    exit 1
}

# --- Download yt-dlp ---
$BIN_DIR = Join-Path $env:USERPROFILE '.carbon\bin'
if (-not (Test-Path $BIN_DIR)) {
    New-Item -ItemType Directory -Path $BIN_DIR -Force | Out-Null
}

$ytdlpPath = Join-Path $BIN_DIR 'yt-dlp.exe'
if (-not (Test-Path $ytdlpPath)) {
    Write-Host ' → Downloading yt-dlp...' -ForegroundColor White
    $ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    try {
        Invoke-WebRequest -Uri $ytdlpUrl -OutFile $ytdlpPath -UseBasicParsing
        Write-Host ' ✓ yt-dlp downloaded.' -ForegroundColor Green
    } catch {
        Write-Host ' ⚠ Failed to download yt-dlp (will be downloaded on first run).' -ForegroundColor Yellow
    }
} else {
    Write-Host ' ✓ yt-dlp already present.' -ForegroundColor Green
}

# --- Download and extract ffmpeg ---
$ffmpegPath = Join-Path $BIN_DIR 'ffmpeg.exe'
$ffprobePath = Join-Path $BIN_DIR 'ffprobe.exe'
if (-not (Test-Path $ffmpegPath)) {
    Write-Host ' → Downloading ffmpeg (~170 MB, this may take a while)...' -ForegroundColor White
    $ffmpegUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip'
    $ffmpegZip = Join-Path $env:TEMP 'ffmpeg-carbon.zip'
    $ffmpegExtract = Join-Path $env:TEMP 'ffmpeg-carbon-extract'
    $ffmpegOk = $false

    # Try curl.exe first (handles large files + redirects better than Invoke-WebRequest)
    $curlExe = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curlExe) {
        Write-Host '   Downloading with curl...' -ForegroundColor White
        & curl.exe -fsSL -o $ffmpegZip $ffmpegUrl 2>$null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $ffmpegZip)) { $ffmpegOk = $true }
    }

    # Fallback to Invoke-WebRequest with TLS 1.2
    if (-not $ffmpegOk) {
        Write-Host '   Downloading with Invoke-WebRequest...' -ForegroundColor White
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $ProgressPreference = 'SilentlyContinue'  # Speeds up large downloads
            Invoke-WebRequest -Uri $ffmpegUrl -OutFile $ffmpegZip -UseBasicParsing
            if (Test-Path $ffmpegZip) { $ffmpegOk = $true }
        } catch {
            Write-Host "   Download error: $_" -ForegroundColor Yellow
        }
    }

    if ($ffmpegOk -and (Test-Path $ffmpegZip)) {
        Write-Host '   Extracting ffmpeg...' -ForegroundColor White
        try {
            if (Test-Path $ffmpegExtract) { Remove-Item $ffmpegExtract -Recurse -Force }
            Expand-Archive -Path $ffmpegZip -DestinationPath $ffmpegExtract -Force
            # Find ffmpeg.exe and ffprobe.exe in extracted folder (nested in bin/)
            $foundFfmpeg = Get-ChildItem -Path $ffmpegExtract -Recurse -Filter 'ffmpeg.exe' | Select-Object -First 1
            $foundFfprobe = Get-ChildItem -Path $ffmpegExtract -Recurse -Filter 'ffprobe.exe' | Select-Object -First 1
            if ($foundFfmpeg) { Copy-Item $foundFfmpeg.FullName $ffmpegPath -Force }
            if ($foundFfprobe) { Copy-Item $foundFfprobe.FullName $ffprobePath -Force }
            Write-Host ' ✓ ffmpeg downloaded and extracted.' -ForegroundColor Green
        } catch {
            Write-Host " ⚠ Failed to extract ffmpeg: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host ' ⚠ Failed to download ffmpeg (will be downloaded on first run).' -ForegroundColor Yellow
    }

    # Cleanup
    Remove-Item $ffmpegZip -Force -ErrorAction SilentlyContinue
    Remove-Item $ffmpegExtract -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host ' ✓ ffmpeg already present.' -ForegroundColor Green
}

# --- Create launcher script ---
$launcherPath = Join-Path $INSTALL_DIR 'carbon-dl.cmd'
@"
@echo off
node "%~dp0cli.js" %*
"@ | Set-Content -Path $launcherPath -Encoding ASCII

# --- Add to user PATH ---
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$INSTALL_DIR*") {
    [Environment]::SetEnvironmentVariable('Path', "$userPath;$INSTALL_DIR", 'User')
    $env:Path = "$env:Path;$INSTALL_DIR"
    Write-Host ' ✓ Added Carbon to PATH.' -ForegroundColor Green
}

Write-Host ''
Write-Host ' ✓ Carbon installed successfully!' -ForegroundColor Green
Write-Host ''
Write-Host ' Run it with:' -ForegroundColor White
Write-Host '   carbon-dl' -ForegroundColor Cyan
Write-Host ''