#!/usr/bin/env bash
# Полный деплой на сервере (нужно ≥2 GB RAM или swap). Для VPS лучше GitHub Actions.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/inside72}"
PM2_NAME="${PM2_NAME:-inside72}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> Fetch latest code (${BRANCH})"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Install dependencies"
npm ci

echo "==> Build"
npm run build

echo "==> Remove dev dependencies"
npm prune --omit=dev

echo "==> Restart app"
pm2 restart "$PM2_NAME"

echo "==> Done"
pm2 status "$PM2_NAME"
