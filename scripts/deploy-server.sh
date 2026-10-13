#!/usr/bin/env bash
# Запускается на VPS после загрузки артефактов сборки из GitHub Actions.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/inside72}"
PM2_NAME="${PM2_NAME:-inside72}"

cd "$APP_DIR"

# Старый DATABASE_URL от Supabase не должен снова включать Postgres.
touch .env
if grep -q '^STORAGE_BACKEND=' .env; then
  sed -i 's/^STORAGE_BACKEND=.*/STORAGE_BACKEND=json/' .env
else
  printf '\nSTORAGE_BACKEND=json\n' >> .env
fi

echo "==> Install production dependencies only"
npm ci --omit=dev --no-audit --no-fund

echo "==> Restart app"
pm2 restart "$PM2_NAME"

echo "==> Check www redirect (ожидается Location: https://inside72.ru/ без :3000)"
curl -sI --max-time 10 https://www.inside72.ru/ | grep -i '^location:' || true

echo "==> Done"
pm2 status "$PM2_NAME"
