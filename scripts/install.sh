#!/usr/bin/env bash
set -euo pipefail

echo "Installing EtherVault3 CLI (global) from GitHub Release tarball"

if ! command -v node >/dev/null 2>&1; then
  echo "[Error] Node.js is required (v18+). Please install Node.js and retry." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[Error] npm is required. Please install npm and retry." >&2
  exit 1
fi

# Repo details
OWNER="RAHULDINDIGALA-32"
REPO="ethervault3-cli-wallet"
PKG_NAME="ethervault3-cli"

# Usage: ./install.sh [tag]
# If no tag provided, resolve the latest release via GitHub API
TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "Resolving latest release tag..."
  TAG=$(curl -fsSL "https://api.github.com/repos/$OWNER/$REPO/releases/latest" | grep -m1 '"tag_name"' | sed -E 's/.*"tag_name"\s*:\s*"([^"]+)".*/\1/')
  if [ -z "$TAG" ]; then
    echo "[Error] Unable to resolve latest release tag from GitHub API." >&2
    exit 1
  fi
fi

echo "Using release tag: $TAG"

TARBALL_URL="https://github.com/$OWNER/$REPO/releases/download/$TAG/${PKG_NAME}-${TAG#v}.tgz"
echo "Downloading and installing: $TARBALL_URL"

npm i -g "$TARBALL_URL"

echo "Done. You can now run: ethervault3"
echo "Tip: create a .env with INFURA_PROJECT_ID to enable network access."

