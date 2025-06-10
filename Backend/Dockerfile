# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.12.10
FROM python:${PYTHON_VERSION}-slim as base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

COPY . .

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && python3 -m ensurepip --upgrade \
    && python3 -m pip install --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

# ✅ Use python3 here instead of python
RUN cd Backend && python3 -m pip install -r requirements.txt && python3 manage.py collectstatic --noinput && python3 manage.py migrate

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--chdir", "Backend", "AuthApi.wsgi:application", "--bind", "0.0.0.0:8000"]
