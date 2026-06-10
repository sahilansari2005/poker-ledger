#!/bin/sh
echo "=== Running migrations ==="
python manage.py migrate --no-input
echo "=== Collecting static files ==="
python manage.py collectstatic --no-input
echo "=== Starting gunicorn on port ${PORT:-8000} ==="
python -m gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --log-level debug 2>&1
echo "=== Gunicorn exited ==="
