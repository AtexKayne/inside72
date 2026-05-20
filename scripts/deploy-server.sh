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

echo "==> Check www redirect (ожидается Location: https://inside72.ru/ без :3000)"
curl -sI --max-time 10 https://www.inside72.ru/ | grep -i '^location:' || true

echo "==> Done"
pm2 status "$PM2_NAME"
