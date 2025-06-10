# syntax=docker/dockerfile:1

# Set the Python version to use
ARG PYTHON_VERSION=3.12.10
FROM python:${PYTHON_VERSION}-slim as base

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# Set working directory inside the container
WORKDIR /app

# Create a non-privileged user to run the app securely
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy all files into the container
COPY . .

# Install system dependencies (for psycopg2 and compiling packages)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && python -m ensurepip --upgrade \
    && python -m pip install --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies from the Backend directory
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install -r Backend/requirements.txt

# Collect static files
RUN cd Backend && python manage.py collectstatic --noinput

# Apply database migrations
RUN cd Backend && python manage.py migrate

# Switch to the non-root user
USER appuser

# Expose the port the app will run on
EXPOSE 8000

# Start the application using Gunicorn
CMD ["gunicorn", "--chdir", "Backend", "AuthApi.wsgi:application", "--bind", "0.0.0.0:8000"]
