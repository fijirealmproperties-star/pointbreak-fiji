@echo off
title PointBreak Rides Fiji
color 0A
echo.
echo   ========================================
echo      PointBreak Rides Fiji - Desktop
echo   ========================================
echo.
echo   Starting server...
echo.

cd /d "%~dp0\.."

start "" http://localhost:3001

node server/index.js

pause
