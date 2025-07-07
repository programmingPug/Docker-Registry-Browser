#!/bin/sh

# Generate environment configuration for Docker Registry Browser
# This script is run at container startup to inject environment variables

# Create env.js with environment variables
cat <<EOF > /usr/share/nginx/html/assets/env.js
window.env = {
  REGISTRY_HOST: '${REGISTRY_HOST:-localhost:5000}',
  REGISTRY_PROTOCOL: '${REGISTRY_PROTOCOL:-http}',
  REGISTRY_USERNAME: '${REGISTRY_USERNAME:-}',
  REGISTRY_PASSWORD: '${REGISTRY_PASSWORD:-}'
};
EOF

echo "Environment configuration generated:"
cat /usr/share/nginx/html/assets/env.js

# Start nginx
exec nginx -g 'daemon off;'
