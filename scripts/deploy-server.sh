#!/usr/bin/env bash
# Запускается на VPS после загрузки артефактов сборки из GitHub Actions.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/inside72}"
PM2_NAME="${PM2_NAME:-inside72}"

cd "$APP_DIR"

echo "==> Install production dependencies only"
npm ci --omit=dev --no-audit --no-fund

echo "==> Restart app"
pm2 restart "$PM2_NAME"

echo "==> Done"
pm2 status "$PM2_NAME"
