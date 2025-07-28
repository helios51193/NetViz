# Use official Python image as base
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy project files
COPY . .

# Collect static and launch via Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn networkvisualizer.wsgi:application --bind 0.0.0.0:8000"]