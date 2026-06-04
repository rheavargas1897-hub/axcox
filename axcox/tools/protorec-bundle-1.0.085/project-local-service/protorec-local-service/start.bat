@echo off
cd /d %~dp0
call npm install --omit=dev
node server.js
pause
