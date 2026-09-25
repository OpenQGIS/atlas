@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===================================================
echo   地图录 · AtlasLog 自动化部署与双分支同步工具
echo ===================================================
echo.

:: 1. 检查工作区状态
git status --porcelain > "%TEMP%\git_status.tmp"
set /p GIT_STATUS=<"%TEMP%\git_status.tmp"
del "%TEMP%\git_status.tmp" 2>nul

if not "%GIT_STATUS%"=="" (
    echo [提示] 检测到工作区有未提交的改动：
    git status -s
    echo.
    set /p COMMIT_MSG="请输入本次提交的 Commit 描述 (留空则默认 auto-deploy): "
    if "!COMMIT_MSG!"=="" set COMMIT_MSG=build: auto-deploy release
    git add .
    git commit -m "!COMMIT_MSG!"
    echo [✓] 本地提交完成。
    echo.
) else (
    echo [✓] 工作区干净，准备同步远程分支...
    echo.
)

:: 2. 推送主干 main 分支
echo [1/2] 正在推送到源码主干 (origin/main)...
git push origin main
if errorlevel 1 (
    echo [错误] 推送到 main 分支失败，请检查网络连接或权限。
    pause
    exit /b 1
)
echo [✓] main 分支推送成功！
echo.

:: 3. 一键同步推送到 website 分支以触发 GitHub Pages 构建
echo [2/2] 正在同步推送到生产发布分支 (origin/website)...
git push origin main:website
if errorlevel 1 (
    echo [错误] 同步到 website 分支失败，请检查远程配置。
    pause
    exit /b 1
)
echo [✓] website 分支同步成功！
echo.

echo ===================================================
echo   发布流程全部完成！
echo   GitHub Pages 已自动触发构建。
echo   生产地址: https://openqgis.github.io/atlas/
echo ===================================================
echo.
pause
