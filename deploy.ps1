# AtlasLog Dual-Branch Deployment Tool
param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  AtlasLog Dual-Branch Auto Deploy" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$status = git status --porcelain
if ($status) {
    Write-Host "Local changes detected:" -ForegroundColor Yellow
    git status -s
    if (-not $Message) {
        $Message = Read-Host "Enter commit message (default: build: auto-deploy release)"
    }
    if (-not $Message) {
        $Message = "build: auto-deploy release"
    }
    git add .
    git commit -m "$Message"
    Write-Host "Commit finished." -ForegroundColor Green
} else {
    Write-Host "Working tree clean, pushing..." -ForegroundColor Green
}

Write-Host "[1/2] Pushing to origin/main..." -ForegroundColor Yellow
git push origin main
Write-Host "Main branch pushed successfully." -ForegroundColor Green

Write-Host "[2/2] Pushing to origin/website (GitHub Pages)..." -ForegroundColor Yellow
git push origin main:website
Write-Host "Website branch pushed successfully." -ForegroundColor Green

Write-Host "Deployment completed! GitHub Pages triggered." -ForegroundColor Cyan
