Param()

Write-Host "Installing EtherVault3 CLI (global) from GitHub Releases" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required (v18+). Please install Node.js and retry."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is required. Please install npm and retry."
  exit 1
}

$owner = "RAHULDINDIGALA-32"
$repo  = "ethervault3-cli-wallet"

# Optional tag parameter
param([string]$Tag)

if (-not $Tag -or $Tag -eq "") {
  Write-Host "Resolving latest release tag..." -ForegroundColor Cyan
  try {
    $latest = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases/latest" -UseBasicParsing
    $Tag = $latest.tag_name
  } catch {
    Write-Error "Unable to resolve latest release tag from GitHub API."
    exit 1
  }
}

Write-Host "Using release tag: $Tag" -ForegroundColor Cyan
Write-Host "Installing from GitHub: github:$owner/$repo#$Tag" -ForegroundColor Cyan

npm i -g "github:$owner/$repo#$Tag"

Write-Host "Done. You can now run: ethervault3" -ForegroundColor Green
Write-Host "Tip: create a .env with INFURA_PROJECT_ID to enable network access." -ForegroundColor Yellow

