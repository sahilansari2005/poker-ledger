# Poker Ledger

Track poker buy-ins, cash-outs, chips, and session stats.

## Run locally (shell scripts)

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Dev mode — Vite hot reload + Django API
./start.sh
# App: http://127.0.0.1:5173  ·  API: http://127.0.0.1:8000/api/

# Production-style build (frontend → Django static, migrate, collectstatic)
./build.sh
cd backend && gunicorn config.wsgi --bind 0.0.0.1:8000
```

## Docker — local testing (share with a friend)

One command, SQLite, data persisted in a Docker volume:

```bash
docker compose -f docker-compose.local.yml up --build
```

Open **http://localhost:8000**

## Docker — production

Postgres + gunicorn:

```bash
cp .env.example .env   # set SECRET_KEY
docker compose up --build
```

Or build and run the image alone (provide `DATABASE_URL` at runtime):

```bash
docker build -t poker-ledger .
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret \
  -e DATABASE_URL=postgres://... \
  poker-ledger
```

## Deploy (Render / Railway)

Both use `./build.sh` and start gunicorn from `backend/`. Set `DATABASE_URL`, `SECRET_KEY`, and `ALLOWED_HOSTS` in your host's environment.

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `SECRET_KEY` | dev key | Required in production |
| `DEBUG` | `False` | Set `True` for local dev |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Use `*` or your domain in prod |
| `DATABASE_URL` | SQLite | Postgres recommended for production |
| `CORS_ALLOWED_ORIGINS` | Vite dev URLs | Only needed when frontend runs separately |
