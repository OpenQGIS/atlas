# 地图录 · AtlasLog 自动化部署与双分支同步脚本 (PowerShell)
[CmdletBinding()]
param (
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  地图录 · AtlasLog 自动化部署与双分支同步工具" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查工作区状态
$status = git status --porcelain
if ($status) {
    Write-Host "[提示] 检测到工作区有未提交的代码改动：" -ForegroundColor Yellow
    git status -s
    Write-Host ""
    if (-not $Message) {
        $Message = Read-Host "请输入本次提交的 Commit 描述 (留空则默认 auto-deploy)"
    }
    if (-not $Message) {
        $Message = "build: auto-deploy release"
    }
    git add .
    git commit -m "$Message"
    Write-Host "[✓] 本地提交完成。" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[✓] 工作区干净，准备推送远程分支..." -ForegroundColor Green
    Write-Host ""
}

# 2. 推送主干 main 分支
Write-Host "[1/2] 正在推送到源码主干 (origin/main)..." -ForegroundColor Yellow
git push origin main
Write-Host "[✓] main 分支推送成功！" -ForegroundColor Green
Write-Host ""

# 3. 一键同步推送到 website 分支以触发 GitHub Pages 构建
Write-Host "[2/2] 正在同步推送到生产发布分支 (origin/website)..." -ForegroundColor Yellow
git push origin main:website
Write-Host "[✓] website 分支同步成功！" -ForegroundColor Green
Write-Host ""

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  发布流程全部完成！" -ForegroundColor Green
Write-Host "  GitHub Pages 已自动触发构建。" -ForegroundColor Green
Write-Host "  生产地址: https://openqgis.github.io/atlas/" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
