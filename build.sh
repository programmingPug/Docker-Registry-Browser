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
echo "To run the container:"
echo "docker run -d --name docker-registry-browser -p 8080:80 --add-host=host.docker.internal:host-gateway $FULL_IMAGE_NAME"
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
    docker run -d \
        --name docker-registry-browser \
        -p 8080:80 \
        --add-host=host.docker.internal:host-gateway \
        -e REGISTRY_HOST=localhost:5000 \
        -e REGISTRY_PROTOCOL=http \
        "$FULL_IMAGE_NAME"
    
    echo ""
    echo "Container started successfully!"
    echo "Access the application at: http://localhost:8080"
    echo "View container logs: docker logs docker-registry-browser"
    echo "Stop container: docker stop docker-registry-browser"
fi
