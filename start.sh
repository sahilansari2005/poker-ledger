#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -d ".venv" ]]; then
  echo "No .venv found. Create one first:"
  echo "  python3.12 -m venv .venv"
  echo "  source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

source .venv/bin/activate

if [[ ! -d "frontend/node_modules" ]]; then
  echo "==> Installing frontend dependencies"
  (cd frontend && npm install)
fi

echo "==> Running migrations"
(cd backend && python manage.py migrate --no-input)

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Starting frontend (http://127.0.0.1:5173)"
(cd frontend && npm run dev -- --host 127.0.0.1 --port 5173) &
FRONTEND_PID=$!

sleep 2

echo "==> Starting backend (http://127.0.0.1:8000)"
(cd backend && python manage.py runserver 127.0.0.1:8000) &
BACKEND_PID=$!

echo ""
echo "Poker Ledger is running:"
echo "  App:  http://127.0.0.1:5173"
echo "  API:  http://127.0.0.1:8000/api/"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
