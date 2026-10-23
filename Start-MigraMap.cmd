@echo off
cd /d "%~dp0"
echo MigraMap local preview
echo Your browser will open when the app is ready.
echo Keep this window open. Press Ctrl+C to stop.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js, then run this file again.
  pause
  exit /b 1
)
node "%~dp0scripts\serve.mjs" --open
pause
