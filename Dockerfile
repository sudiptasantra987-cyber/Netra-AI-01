# =============================================================================
# NETRA AI - MULTI-STAGE PRODUCTION DOCKERFILE
# Stage 1: Compiles React + Vite Frontend
# Stage 2: Runs FastAPI Backend with Unified Static Assets & OpenCV
# =============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --silent

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    PORT=8000 \
    HOST=0.0.0.0 \
    DATABASE_FILE=/app/database/netra_store.json \
    UPLOADS_DIR=/app/backend/uploads \
    FRONTEND_DIST_DIR=/app/frontend/dist

WORKDIR /app

# Install native libraries required by OpenCV (headless runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with caching
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code & database seeds
COPY backend/ ./backend/
COPY database/ ./database/

# Copy built frontend distribution from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure persistent directories exist
RUN mkdir -p /app/backend/uploads /app/database

# Expose application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run FastAPI production ASGI server
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir backend"]
