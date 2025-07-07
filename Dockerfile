# Multi-stage build for optimized production image
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source code
COPY . .

# Build the Angular application
RUN npm run build -- --configuration production

# Production stage
FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=build /app/dist/docker-registry-browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create assets directory for env.js and set permissions
RUN mkdir -p /usr/share/nginx/html/assets && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R 755 /usr/share/nginx/html

# Add labels for better container management
LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Docker Registry Browser - A web interface for browsing Docker registries"
LABEL version="1.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Use custom entrypoint to generate environment config (run as root for file creation)
ENTRYPOINT ["/docker-entrypoint.sh"]
