#!/usr/bin/env sh
set -eu

cd /app/backend

echo "==> Running migrations"
python manage.py migrate --no-input

echo "==> Starting server"
exec gunicorn config.wsgi \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --log-file -
