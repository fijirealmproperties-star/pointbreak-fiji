@echo off
echo.
echo   ============================================
echo     PointBreak Rides Fiji - Starting Server
echo   ============================================
echo.
echo   Server will start on http://localhost:3001
echo   Open your browser and go to that address
echo.
cd /d "%~dp0"
node server/index.js
pause
