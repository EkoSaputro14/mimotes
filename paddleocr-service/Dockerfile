FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PaddleOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
  CMD curl -f http://localhost:${PORT:-8090}/health || exit 1

# Run the service
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8090}"]
