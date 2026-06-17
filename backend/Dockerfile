# Use Microsoft's official Playwright image
FROM mcr.microsoft.com/playwright/python:v1.60.0-noble

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first to leverage Docker's build caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code into /app
COPY . .

# Expose the port FastAPI will run on
EXPOSE 10000

# Run Uvicorn pointing directly to the app directory inside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]