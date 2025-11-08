# Use Python 3.11 with CUDA for GPU acceleration
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    TZ=UTC \
    DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3.11 \
    python3-pip \
    python3.11-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgeos-dev \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Install PyTorch with CUDA support
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install YOLOv5 for traffic sign detection
RUN git clone https://github.com/ultralytics/yolov5 /tmp/yolov5 && \
    cd /tmp/yolov5 && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -e . && \
    cd /app && \
    rm -rf /tmp/yolov5

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/ml/saved_models /app/logs

# Download pre-trained traffic sign model (if not already present in the image)
RUN if [ ! -f "/app/ml/saved_models/traffic_sign_yolov5.pt" ]; then \
    wget -O /app/ml/saved_models/traffic_sign_yolov5.pt \
    https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.pt; \
    fi

# Expose port
EXPOSE 8000

# Set up logging
RUN touch /app/logs/app.log && \
    chmod 666 /app/logs/app.log

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (can be overridden in docker-compose)
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-"]