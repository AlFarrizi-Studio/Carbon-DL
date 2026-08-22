#!/usr/bin/env bash
# Carbon installer for Linux & macOS
# Usage: curl -fsSL https://raw.githubusercontent.com/AlFarrizi-Studio/Carbon-DL/main/install.sh -o install.sh && bash install.sh

set -e

CYAN='\033[36m'
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
RESET='\033[0m'

GITHUB_REPO="AlFarrizi-Studio/Carbon-DL"
NODE_VERSION="v20.18.1"
INSTALL_DIR="$HOME/.carbon"

echo ""
echo -e "${CYAN}  ██████╗ █████╗ ██████╗ ██████╗  ██████╗ ███╗   ██╗${RESET}"
echo -e "${CYAN} ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔═══██╗████╗  ██║${RESET}"
echo -e "${CYAN} ██║     ███████║██████╔╝██████╔╝██║   ██║██╔██╗ ██║${RESET}"
echo -e "${CYAN} ██║     ██╔══██║██╔══██╗██╔══██╗██║   ██║██║╚██╗██║${RESET}"
echo -e "${CYAN} ╚██████╗██║  ██║██║  ██║██████╔╝╚██████╔╝██║ ╚████║${RESET}"
echo -e "${CYAN}  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝${RESET}"
echo ""
echo " Installing Carbon..."
echo ""

# --- Detect OS & architecture ---
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64)  NODE_ARCH="x64" ;;
    aarch64) NODE_ARCH="arm64" ;;
    arm64)   NODE_ARCH="arm64" ;;
    *)
        echo -e "${RED} ✗ Unsupported architecture: $ARCH${RESET}"
        exit 1
        ;;
esac

# --- Check / install Node.js ---
if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW} → Node.js not found. Downloading and installing automatically...${RESET}"

    # macOS uses "darwin" + .tar.gz; Linux uses "linux" + .tar.xz
    if [ "$OS" = "Darwin" ]; then
        TARBALL="node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
        URL="https://nodejs.org/dist/${NODE_VERSION}/${TARBALL}"
    else
        TARBALL="node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
        URL="https://nodejs.org/dist/${NODE_VERSION}/${TARBALL}"
    fi

    mkdir -p "$INSTALL_DIR"
    TMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TMP_DIR"' EXIT

    echo "   Downloading Node.js ${NODE_VERSION} (${NODE_ARCH})..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$URL" -o "$TMP_DIR/$TARBALL"
    elif command -v wget >/dev/null 2>&1; then
        wget -q "$URL" -O "$TMP_DIR/$TARBALL"
    else
        echo -e "${RED} ✗ Neither curl nor wget found. Cannot download Node.js.${RESET}"
        exit 1
    fi

    echo "   Extracting Node.js..."
    if [[ "$TARBALL" == *.tar.xz ]]; then
        tar -xJf "$TMP_DIR/$TARBALL" -C "$TMP_DIR"
    else
        tar -xzf "$TMP_DIR/$TARBALL" -C "$TMP_DIR"
    fi

    EXTRACTED_DIR="$TMP_DIR/$(basename "$TARBALL" | sed 's/\.tar\.\(xz\|gz\)$//')"
    rm -rf "$INSTALL_DIR/node"
    mv "$EXTRACTED_DIR" "$INSTALL_DIR/node"

    # Add to PATH in shell profile
    PROFILE=""
    if [ -f "$HOME/.bashrc" ]; then
        PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then
        PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.profile" ]; then
        PROFILE="$HOME/.profile"
    fi

    PATH_LINE="export PATH=\"$INSTALL_DIR/node/bin:\$PATH\""
    if [ -n "$PROFILE" ]; then
        if ! grep -qF "$INSTALL_DIR/node/bin" "$PROFILE" 2>/dev/null; then
            echo "" >> "$PROFILE"
            echo "# Added by Carbon installer" >> "$PROFILE"
            echo "$PATH_LINE" >> "$PROFILE"
        fi
    fi

    # Use it in this session
    export PATH="$INSTALL_DIR/node/bin:$PATH"

    echo -e "${GREEN} ✓ Node.js installed to $INSTALL_DIR/node${RESET}"
fi

# Verify node is now available
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED} ✗ Node.js was installed but is not found in PATH.${RESET}"
    echo -e "${YELLOW}   Please open a new terminal and re-run this script.${RESET}"
    exit 1
fi

NODE_VER="$(node --version | sed 's/^v//')"
MAJOR="${NODE_VER%%.*}"
if [ "$MAJOR" -lt 18 ]; then
    echo -e "${RED} ✗ Node.js v$NODE_VER found, but v18+ is required.${RESET}"
    echo -e "${YELLOW}   Update Node.js from https://nodejs.org, then re-run this script.${RESET}"
    exit 1
fi
echo -e "${GREEN} ✓ Node.js v$NODE_VER${RESET}"

# --- Download Carbon from GitHub ---
echo " → Downloading Carbon from GitHub..."

# Get latest release tag (for display only)
TAG_NAME="latest"
if command -v curl >/dev/null 2>&1; then
    TAG_NAME=$(curl -fsSL "https://api.github.com/repos/$GITHUB_REPO/releases/latest" 2>/dev/null | grep -o '"tag_name": *"[^"]*"' | cut -d'"' -f4 || echo "latest")
elif command -v wget >/dev/null 2>&1; then
    TAG_NAME=$(wget -qO- "https://api.github.com/repos/$GITHUB_REPO/releases/latest" 2>/dev/null | grep -o '"tag_name": *"[^"]*"' | cut -d'"' -f4 || echo "latest")
fi

echo "   Version: $TAG_NAME"

# Always download from main branch — dist/cli.js there is the latest build
CLI_URL="https://raw.githubusercontent.com/$GITHUB_REPO/main/dist/cli.js"
APP_DIR="$INSTALL_DIR/app"
mkdir -p "$APP_DIR"

echo "   Downloading cli.js..."
if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$CLI_URL" -o "$APP_DIR/cli.js"
elif command -v wget >/dev/null 2>&1; then
    wget -q "$CLI_URL" -O "$APP_DIR/cli.js"
else
    echo -e "${RED} ✗ Neither curl nor wget found. Cannot download Carbon.${RESET}"
    exit 1
fi

# --- Create launcher script ---
LAUNCHER="$INSTALL_DIR/bin/carbon-dl"
mkdir -p "$INSTALL_DIR/bin"
cat > "$LAUNCHER" << 'LAUNCHER_EOF'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/../app/cli.js" "$@"
LAUNCHER_EOF
chmod +x "$LAUNCHER"

# --- Add to PATH in shell profile ---
PROFILE=""
if [ -f "$HOME/.bashrc" ]; then
    PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.profile" ]; then
    PROFILE="$HOME/.profile"
fi

BIN_PATH_LINE="export PATH=\"$INSTALL_DIR/bin:\$PATH\""
if [ -n "$PROFILE" ]; then
    if ! grep -qF "$INSTALL_DIR/bin" "$PROFILE" 2>/dev/null; then
        echo "" >> "$PROFILE"
        echo "# Added by Carbon installer" >> "$PROFILE"
        echo "$BIN_PATH_LINE" >> "$PROFILE"
    fi
fi

# Use it in this session
export PATH="$INSTALL_DIR/bin:$PATH"

echo -e "${GREEN} ✓ Added Carbon to PATH.${RESET}"

echo ""
echo -e "${GREEN} ✓ Carbon installed successfully!${RESET}"
echo ""
echo " Run it with:"
echo -e "   ${CYAN}carbon-dl${RESET}"
echo ""
