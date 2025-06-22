# # syntax=docker/dockerfile:1
# ARG PYTHON_VERSION=3.12.10
# FROM python:${PYTHON_VERSION}-slim as base

# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1

# WORKDIR /app

# ARG UID=10001
# RUN adduser \
#     --disabled-password \
#     --gecos "" \
#     --home "/nonexistent" \
#     --shell "/sbin/nologin" \
#     --no-create-home \
#     --uid "${UID}" \
#     appuser

# COPY . .

# RUN apt-get update && apt-get install -y \
#     gcc \
#     libpq-dev \
#     && python3 -m ensurepip --upgrade \
#     && python3 -m pip install --upgrade pip \
#     && rm -rf /var/lib/apt/lists/*

# # Install dependencies
# RUN cd Backend && \
#     python3 -m pip install -r requirements.txt && \
#     python3 manage.py collectstatic --noinput && \
#     python3 manage.py migrate

# USER appuser

# EXPOSE 8000

# # ✅ Use ASGI with Daphne (replace your_project_name with your Django project folder)
# CMD ["daphne", "-b", "0.0.0.0", "-p", "${PORT}", "AuthApi.asgi:application"]


# Use PyTorch official image (CPU-only) to save space
FROM pytorch/pytorch:2.2.2-cpu as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000 

WORKDIR /app

# Create non-root user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only the necessary code
COPY ./Backend ./Backend
COPY ./requirements.txt .

# Install Python dependencies (no torch needed)
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Change to non-root user
USER appuser

# Expose port
EXPOSE ${PORT}

# Run app with Daphne
CMD ["sh", "-c", "cd Backend && python3 manage.py migrate && python3 manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p ${PORT} AuthApi.asgi:application"]
