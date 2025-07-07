#!/bin/bash

# Development start script for Docker Registry Browser
# Usage: ./start-dev.sh [registry_host] [protocol]

# Set default values
REGISTRY_HOST=${1:-"localhost:5000"}
REGISTRY_PROTOCOL=${2:-"http"}

echo "Starting Docker Registry Browser development server..."
echo "Registry: $REGISTRY_PROTOCOL://$REGISTRY_HOST"
echo ""

# Export environment variables
export REGISTRY_HOST="$REGISTRY_HOST"
export REGISTRY_PROTOCOL="$REGISTRY_PROTOCOL"

# Check if .env file exists and source it
if [ -f ".env" ]; then
    echo "Loading environment from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Generate proxy configuration and start server
npm run start
