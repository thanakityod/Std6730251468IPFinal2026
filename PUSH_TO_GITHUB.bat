@echo off
title Push to GitHub (Std6730251468)
echo ========================================================
echo Pushing project to GitHub: Std6730251468IPFinal2026
echo ========================================================

set "PATH=C:\Program Files\nodejs;C:\Users\Admin\AppData\Local\Programs\Git\cmd;C:\Program Files\GitHub CLI;%PATH%"

cd /d "C:\Users\Admin\.gemini\antigravity\scratch\Std6730251468IPFinal2026"

gh auth status > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [Step 1] Logging into GitHub...
    gh auth login --web -h github.com -p https
)

echo.
echo [Step 2] Creating Public Repository and Pushing code...
gh repo create Std6730251468IPFinal2026 --public --source=. --remote=origin --push

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Repository is live on GitHub!
    echo ========================================================
) else (
    echo.
    echo Trying direct push to origin:
    git push -u origin main
)

pause
