# syntax=docker/dockerfile:1
#
# Targets:
#   local       — SQLite, debug (for: docker compose -f docker-compose.local.yml up --build)
#   production  — Postgres-ready, non-root user (for: docker compose up --build)
#
# Build examples:
#   docker build --target local -t poker-ledger:local .
#   docker build --target production -t poker-ledger:prod .

FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

RUN npm run build


FROM python:3.12-slim AS python-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/backend/static/frontend ./backend/static/frontend/
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/backend

RUN python manage.py collectstatic --no-input

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]


FROM python-base AS local

ENV DEBUG=True \
    ALLOWED_HOSTS=* \
    SECRET_KEY=local-docker-dev-key \
    DATABASE_URL=sqlite:////data/db.sqlite3 \
    WEB_CONCURRENCY=1

RUN mkdir -p /data

VOLUME ["/data"]


FROM python-base AS production

ENV DEBUG=False \
    ALLOWED_HOSTS=*

RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health/')" || exit 1
