FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

CMD python manage.py migrate --no-input && \
    python manage.py collectstatic --no-input && \
    gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --log-file -
