#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${1:-$PWD}"
mkdir -p "$PROJECT_DIR/.protorec/pages" "$PROJECT_DIR/.protorec/temp_proto" "$PROJECT_DIR/.protorec/quality"
cd "$SCRIPT_DIR"
npm install --omit=dev
PROTO_CAPTURE_RESTORE_PROJECT_ROOT="$PROJECT_DIR" PROTO_CAPTURE_RESTORE_WORKSPACE_ROOT="$PROJECT_DIR/.protorec" node server.js
