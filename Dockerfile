# Multi-stage build for Docker Registry Browser with Node.js proxy
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

# Production stage with Node.js proxy server
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy built application
COPY --from=build /app/dist ./dist

# Copy server and entrypoint
COPY server.js ./
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G appuser appuser && \
    chown -R appuser:appuser /app

# Add labels for better container management
LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Docker Registry Browser with Node.js proxy - A web interface for browsing Docker registries"
LABEL version="1.1.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Use Node.js proxy entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
