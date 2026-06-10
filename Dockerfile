FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONUNBUFFERED=1

# Run collectstatic at build time with a dummy key
RUN SECRET_KEY=dummy-build-key python manage.py collectstatic --no-input

CMD ["sh", "-c", "exec 2>&1; echo 'PORT='$PORT; python manage.py migrate --no-input && python -m gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --log-level debug --capture-output"]
