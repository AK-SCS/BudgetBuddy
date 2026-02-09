FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY BudgetBuddy-ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY BudgetBuddy-ml-service/ .

# Create necessary directories
RUN mkdir -p /app/logs /app/models && chmod 777 /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
