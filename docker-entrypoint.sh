#!/bin/sh

# Docker Registry Browser with Node.js Express Proxy
# Reliable CORS-handling solution

# Set default values
REGISTRY_HOST=${REGISTRY_HOST:-localhost:5000}
REGISTRY_PROTOCOL=${REGISTRY_PROTOCOL:-http}
REGISTRY_USERNAME=${REGISTRY_USERNAME:-}
REGISTRY_PASSWORD=${REGISTRY_PASSWORD:-}

echo "=== Docker Registry Browser with Node.js Proxy ==="
echo "Registry Host: ${REGISTRY_HOST}"
echo "Registry Protocol: ${REGISTRY_PROTOCOL}"
echo "Registry URL: ${REGISTRY_PROTOCOL}://${REGISTRY_HOST}"

# Validate configuration
if [ -z "$REGISTRY_HOST" ]; then
    echo "ERROR: REGISTRY_HOST is required"
    exit 1
fi

# Test registry connectivity if possible
echo "Testing registry connectivity..."
REGISTRY_URL="${REGISTRY_PROTOCOL}://${REGISTRY_HOST}"

if command -v curl >/dev/null 2>&1; then
    echo "Testing connection to: ${REGISTRY_URL}/v2/"
    
    CURL_CMD="curl -f -s --connect-timeout 10"
    if [ -n "$REGISTRY_USERNAME" ] && [ -n "$REGISTRY_PASSWORD" ]; then
        CURL_CMD="$CURL_CMD -u ${REGISTRY_USERNAME}:${REGISTRY_PASSWORD}"
    fi
    
    if $CURL_CMD "${REGISTRY_URL}/v2/" > /dev/null; then
        echo "SUCCESS: Registry is accessible"
    else
        echo "WARNING: Registry connection test failed"
        echo "This might be normal - the Node.js proxy will still attempt to connect"
    fi
else
    echo "curl not available, skipping connectivity test"
fi

# Create environment configuration for the frontend
echo "Creating frontend environment configuration..."
mkdir -p /app/dist/docker-registry-browser/assets

cat > /app/dist/docker-registry-browser/assets/env.js <<EOF
// Node.js Express Proxy Configuration
window.env = {
  REGISTRY_HOST: '${REGISTRY_HOST}',
  REGISTRY_PROTOCOL: '${REGISTRY_PROTOCOL}',
  REGISTRY_USERNAME: '${REGISTRY_USERNAME}',
  REGISTRY_PASSWORD: '${REGISTRY_PASSWORD}',
  USE_PROXY: true
};

console.log('Docker Registry Browser with Node.js Express Proxy');
console.log('Registry Target:', '${REGISTRY_PROTOCOL}://${REGISTRY_HOST}');
console.log('Proxy Endpoint: /api/*');
console.log('Proxy Method: http-proxy-middleware');
EOF

# Set proper permissions
chown -R appuser:appuser /app
chmod 644 /app/dist/docker-registry-browser/assets/env.js

echo "=== Starting Node.js Express Proxy Server ==="
echo "Proxy: /api/* -> ${REGISTRY_PROTOCOL}://${REGISTRY_HOST}/*"
echo "Web interface: http://localhost:80"
echo "Health check: http://localhost:80/health"
echo "Proxy status: http://localhost:80/proxy-status"
if [ -n "$REGISTRY_USERNAME" ]; then
    echo "Using basic authentication"
fi

# Export environment variables for Node.js
export REGISTRY_HOST
export REGISTRY_PROTOCOL
export REGISTRY_USERNAME
export REGISTRY_PASSWORD
export NODE_ENV=production

# Switch to non-root user and start Node.js server
echo "Switching to non-root user and starting server..."
su appuser -s /bin/sh -c "cd /app && node server.js"
