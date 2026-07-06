#!/usr/bin/env sh
set -eu

cd /app/backend

echo "==> Running migrations"
python manage.py migrate --no-input

if echo "${DATABASE_URL:-}" | grep -qi sqlite; then
  WORKERS=1
else
  WORKERS="${WEB_CONCURRENCY:-2}"
fi

echo "==> Starting server (workers=${WORKERS})"
exec gunicorn config.wsgi \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WORKERS}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --log-file -
