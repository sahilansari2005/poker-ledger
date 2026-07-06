#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Desktop: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then run this script again."
  exit 1
fi

HOST_PORT="${HOST_PORT:-8000}"

echo "==> Building and starting Poker Ledger (local Docker)"
echo "    App URL: http://localhost:${HOST_PORT}"
echo "    Data volume: poker-ledger-data"
echo ""
echo "    Stop:  docker compose -f docker-compose.local.yml down"
echo "    Reset: docker compose -f docker-compose.local.yml down -v"
echo ""

exec docker compose -f docker-compose.local.yml up --build "$@"
