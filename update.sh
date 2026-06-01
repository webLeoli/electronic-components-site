#!/usr/bin/env bash
set -Eeuo pipefail

# FPGACenter one-click VPS update script.
#
# Usage on the server:
#   cd /path/to/electronic-components-site
#   bash update.sh
#
# Optional environment variables:
#   BRANCH=master                         Git branch to deploy.
#   APP_NAME=fpgacenter                   PM2 app name to restart.
#   SERVICE_NAME=fpgacenter               systemd service name to restart.
#   HEALTH_URL=https://fpgacenter.com     URL to check after restart.
#   SKIP_DB=1                             Skip Prisma database sync.
#   FORCE_DB_PUSH_ACCEPT_DATA_LOSS=1      Allow prisma db push --accept-data-loss.

BRANCH="${BRANCH:-master}"
APP_NAME="${APP_NAME:-fpgacenter}"
HEALTH_URL="${HEALTH_URL:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

log() {
  printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"
}

fail() {
  printf '\nUpdate failed: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

restart_service() {
  if command -v pm2 >/dev/null 2>&1; then
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
      log "Restarting PM2 app: $APP_NAME"
      pm2 restart "$APP_NAME" --update-env
      pm2 save || true
      return 0
    fi

    if [ -f ecosystem.config.js ] || [ -f ecosystem.config.cjs ] || [ -f ecosystem.config.mjs ]; then
      log "Reloading PM2 ecosystem file"
      pm2 reload ecosystem.config.* --update-env
      pm2 save || true
      return 0
    fi
  fi

  if [ -n "${SERVICE_NAME:-}" ] && command -v systemctl >/dev/null 2>&1; then
    log "Restarting systemd service: $SERVICE_NAME"
    sudo systemctl restart "$SERVICE_NAME"
    return 0
  fi

  log "No restart target found. Set APP_NAME or SERVICE_NAME, then restart the app manually."
  return 0
}

log "Starting FPGACenter update in $SCRIPT_DIR"

require_cmd git
require_cmd node
require_cmd npm

log "Fetching latest code from origin/$BRANCH"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd --exclude=.env --exclude=.env.local --exclude=uploads --exclude=public/uploads

log "Installing Node dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

log "Generating Prisma client"
npx prisma generate

if [ "${SKIP_DB:-0}" != "1" ]; then
  if [ -d prisma/migrations ] && find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q .; then
    log "Applying Prisma migrations"
    npx prisma migrate deploy
  else
    log "No Prisma migrations found; syncing schema with prisma db push"
    if [ "${FORCE_DB_PUSH_ACCEPT_DATA_LOSS:-0}" = "1" ]; then
      npx prisma db push --accept-data-loss
    else
      npx prisma db push
    fi
  fi
else
  log "Skipping database sync because SKIP_DB=1"
fi

log "Building Next.js production bundle"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
if command -v nice >/dev/null 2>&1; then
  nice -n "${BUILD_NICE:-5}" npm run build
else
  npm run build
fi

restart_service

if [ -n "$HEALTH_URL" ]; then
  log "Checking health URL: $HEALTH_URL"
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 20 "$HEALTH_URL" >/dev/null
    log "Health check passed"
  else
    log "curl is not installed; skipped health check"
  fi
fi

log "Update complete"
