@echo off
setlocal
set "PROJECT_DIR=%CD%"
if not "%~1"=="" set "PROJECT_DIR=%~1"
if not exist "%PROJECT_DIR%\.protorec\pages" mkdir "%PROJECT_DIR%\.protorec\pages"
if not exist "%PROJECT_DIR%\.protorec\temp_proto" mkdir "%PROJECT_DIR%\.protorec\temp_proto"
if not exist "%PROJECT_DIR%\.protorec\quality" mkdir "%PROJECT_DIR%\.protorec\quality"
cd /d %~dp0
call npm install --omit=dev
set "PROTO_CAPTURE_RESTORE_PROJECT_ROOT=%PROJECT_DIR%"
set "PROTO_CAPTURE_RESTORE_WORKSPACE_ROOT=%PROJECT_DIR%\.protorec"
node server.js
pause
