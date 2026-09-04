#!/usr/bin/env bash
# Deploy the piece to a Raspberry Pi 5 kiosk.
# Usage: ./pi/deploy.sh [pi-host]   (default: daniel@mmrybx.local)
set -euo pipefail

PI_HOST="${1:-daniel@mmrybx.local}"
PI_DIR="~/tone-viewer"
SERVICE="tone-viewer"

echo "▸ Building production bundle locally…"
npm run build

echo "▸ Syncing to ${PI_HOST}:${PI_DIR}…"
rsync -az --delete \
  --exclude node_modules --exclude .next/cache --exclude .git \
  ./ "${PI_HOST}:${PI_DIR}/"

echo "▸ Installing deps and restarting ${SERVICE} on the Pi…"
ssh "${PI_HOST}" "cd ${PI_DIR} && npm ci --omit=dev && sudo systemctl restart ${SERVICE}"

echo "▸ Done — the kiosk should refresh momentarily."
