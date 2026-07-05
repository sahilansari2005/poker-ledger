#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing Python dependencies"
pip install -r "$ROOT/requirements.txt"

echo "==> Building React frontend"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> Collecting static files & running migrations"
cd "$ROOT/backend"
python manage.py collectstatic --no-input
python manage.py migrate --no-input

echo "==> Build complete"
