#!/bin/sh
set -e
python manage.py migrate --no-input
python manage.py collectstatic --no-input
exec gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --log-level info
