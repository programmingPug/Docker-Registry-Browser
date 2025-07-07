#!/bin/bash

# Docker Registry Browser - Build and Deploy Script
# Usage: ./build.sh [tag] [registry]

set -e

# Configuration
IMAGE_NAME="docker-registry-browser"
DEFAULT_TAG="latest"
DEFAULT_REGISTRY=""

# Parse arguments
TAG=${1:-$DEFAULT_TAG}
REGISTRY=${2:-$DEFAULT_REGISTRY}

# Build the full image name
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$TAG"
else
    FULL_IMAGE_NAME="$IMAGE_NAME:$TAG"
fi

echo "Building Docker Registry Browser..."
echo "Image: $FULL_IMAGE_NAME"
echo ""

# Build the Docker image
echo "Building Docker image..."
docker build -t "$FULL_IMAGE_NAME" .

echo ""
echo "Build completed successfully!"
echo ""
echo "To run the container with environment variables:"
echo "docker run -d --name docker-registry-browser \\"
echo "  -p 8080:80 \\"
echo "  --add-host=host.docker.internal:host-gateway \\"
echo "  -e REGISTRY_HOST=your-registry.com:5000 \\"
echo "  -e REGISTRY_PROTOCOL=https \\"
echo "  $FULL_IMAGE_NAME"
echo ""
echo "Or use docker-compose with .env file:"
echo "cp .env.example .env"
echo "# Edit .env with your values"
echo "docker-compose up -d"
echo ""
echo "To push to registry (if configured):"
if [ -n "$REGISTRY" ]; then
    echo "docker push $FULL_IMAGE_NAME"
else
    echo "Please specify a registry: ./build.sh $TAG your-registry.com"
fi
echo ""

# Optional: Run the container immediately
read -p "Do you want to run the container now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting container..."
    
    # Check if .env file exists
    if [ -f ".env" ]; then
        echo "Using .env file for configuration..."
        docker run -d \
            --name docker-registry-browser \
            -p 8080:80 \
            --add-host=host.docker.internal:host-gateway \
            --env-file .env \
            "$FULL_IMAGE_NAME"
    else
        echo "No .env file found, using default values..."
        echo "Copy .env.example to .env and edit it for your registry configuration."
        docker run -d \
            --name docker-registry-browser \
            -p 8080:80 \
            --add-host=host.docker.internal:host-gateway \
            -e REGISTRY_HOST=localhost:5000 \
            -e REGISTRY_PROTOCOL=http \
            "$FULL_IMAGE_NAME"
    fi
    
    echo ""
    echo "Container started successfully!"
    echo "Access the application at: http://localhost:8080"
    echo "View container logs: docker logs docker-registry-browser"
    echo "Stop container: docker stop docker-registry-browser"
fi
