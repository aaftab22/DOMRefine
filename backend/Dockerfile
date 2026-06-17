# Use Microsoft's official Playwright image pre-loaded with Python and all OS dependencies
FROM mcr.microsoft.com/playwright/python:v1.60.0-noble

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first to leverage Docker's build caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

WORKDIR /app/backend/app

# Expose the port FastAPI will run on
EXPOSE 10000

# Run the FastAPI server using Uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "10000"]