# 1. Base Image (Slim = lightweight)
FROM python:3.10-slim


# 2. Environment Optimizations
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Set Working Directory
WORKDIR /app

# 4. Install System Dependencies (minimal)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*


# 5. Copy Requirements First (for caching)
COPY backend/requirements.txt .


# 6. Install Python Dependencies
RUN pip install --no-cache-dir -r requirements.txt


# 7. Copy Backend Code
COPY backend ./backend


# 8. Copy Frontend
COPY frontend ./frontend


# 9. Set PYTHONPATH 
ENV PYTHONPATH=/app/backend


# 10. Expose Port
EXPOSE 8000


# 11. Run Server 
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]