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

# --- Download Carbon from GitHub Releases ---
Write-Host ' → Downloading Carbon from GitHub...' -ForegroundColor White

try {
    $releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/$GITHUB_REPO/releases/latest" -UseBasicParsing
    $tagName = $releaseInfo.tag_name
    $zipUrl = "https://github.com/$GITHUB_REPO/releases/download/$tagName/carbon-dl-win.zip"
} catch {
    Write-Host ' ✗ Failed to fetch latest release info.' -ForegroundColor Red
    Write-Host '   Please check your internet connection and try again.' -ForegroundColor Yellow
    exit 1
}

$zipPath = Join-Path $env:TEMP 'carbon-dl-win.zip'
Write-Host "   Downloading $tagName..." -ForegroundColor White
try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
} catch {
    Write-Host ' ✗ Failed to download Carbon release.' -ForegroundColor Red
    Write-Host "   URL: $zipUrl" -ForegroundColor Yellow
    exit 1
}

# --- Extract to install directory ---
Write-Host '   Extracting...' -ForegroundColor White
if (Test-Path $INSTALL_DIR) {
    Remove-Item $INSTALL_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $INSTALL_DIR -Force
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

# --- Create launcher script ---
$launcherPath = Join-Path $INSTALL_DIR 'carbon-dl.cmd'
$cliPath = Join-Path $INSTALL_DIR 'cli.js'
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