# Docker Registry Browser

A simple, reliable web interface for browsing Docker registries with a Node.js proxy to handle CORS issues. Perfect for Unraid users who want to easily view and manage their Docker registry.

## Features

- Browse repositories and tags in your Docker registry
- View detailed image information (size, layers, creation date, etc.)
- Copy docker pull commands with one click
- Clean, responsive web interface
- **CORS-free** - Uses Node.js proxy to avoid browser restrictions
- Works with any Docker Registry v2 compatible registry

## Quick Start

### Build and Run
```bash
# Build the image
docker build -t docker-registry-browser .

# Run with your registry
docker run -d -p 8080:80 \
  -e REGISTRY_HOST=your-registry:5000 \
  -e REGISTRY_PROTOCOL=http \
  docker-registry-browser
```

### Using Docker Compose
```bash
# Set your registry in .env or environment
export REGISTRY_HOST=192.168.1.100:5000
export REGISTRY_PROTOCOL=http

# Start with compose
docker-compose up -d
```

## Unraid Installation

### 1. Community Applications (Recommended)
- Go to **Apps** tab in Unraid
- Search for "Docker Registry Browser"
- Click **Install**

### 2. Manual Configuration
Use these settings in the Unraid template:

#### Basic Configuration
- **Registry Host**: `192.168.1.100:5000` (your Unraid IP and registry port)
- **Registry Protocol**: `http` (or `https` for secure registries)

#### For Authenticated Registries (Optional)
- **Username**: Your registry username
- **Password**: Your registry password

### 3. Common Unraid Examples

#### Local Registry on Unraid Host
```
Registry Host: 192.168.1.100:5000
Registry Protocol: http
```

#### Registry Container on Unraid
```
Registry Host: registry:5000
Registry Protocol: http
```

#### Remote Secure Registry
```
Registry Host: my-registry.com:443
Registry Protocol: https
Username: myuser
Password: mypass
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REGISTRY_HOST` | Yes | `localhost:5000` | Registry hostname and port |
| `REGISTRY_PROTOCOL` | Yes | `http` | `http` or `https` |
| `REGISTRY_USERNAME` | No | - | Username for authenticated registries |
| `REGISTRY_PASSWORD` | No | - | Password for authenticated registries |

## How It Works

The application uses a **Node.js Express server** with `http-proxy-middleware` to proxy all registry API calls. This solves CORS issues that would otherwise prevent browsers from accessing Docker registries directly.

### Request Flow
```
Browser → /api/v2/_catalog → Node.js Proxy → Registry
Browser ← Response with CORS headers ← Node.js Proxy ← Registry
```

### Why This Works
- **No CORS Issues**: Proxy adds proper CORS headers automatically
- **Authentication**: Basic auth handled transparently by proxy
- **Any Registry**: Works with any Docker Registry v2 compatible API
- **Production Ready**: Uses proven `http-proxy-middleware` library

## Supported Registries

Works with any Docker Registry v2 compatible registry:
- **Docker Registry** (open source)
- **Harbor**
- **AWS ECR**
- **Azure Container Registry** 
- **Google Container Registry**
- **GitLab Container Registry**
- **Nexus Repository**
- **Artifactory**

## Troubleshooting

### "Cannot connect to registry proxy"
- Ensure you're accessing `http://your-server:8080`, not a dev server
- Check container logs: `docker logs container-name`
- Verify `REGISTRY_HOST` and `REGISTRY_PROTOCOL` are correct

### "Registry server error (502)"
- Registry is not accessible from the container
- Check if registry is running: `docker ps | grep registry`
- Test registry connectivity: `curl http://your-registry:5000/v2/`
- For Unraid: Use server IP, not `localhost`

### "No repositories found"
- Registry is accessible but empty (no images pushed yet)
- Authentication may be required but not configured
- Check registry has repositories: `curl http://your-registry:5000/v2/_catalog`

## Development

### Build from Source
```bash
git clone https://github.com/your-username/docker-registry-browser.git
cd docker-registry-browser
docker build -t docker-registry-browser .
```

### Local Development
```bash
# Install dependencies
npm install

# Start Angular dev server (for frontend development)
npm start

# Start Node.js proxy server (for backend testing)
npm run server
```

## Health Monitoring

The container provides health check endpoints:
- **`/health`** - Application health status
- **`/proxy-status`** - Proxy configuration status

## Security

- Runs as non-root user
- No sensitive data stored in container
- Registry credentials only used for API authentication
- All communication proxied through secure server

## License

MIT License - see LICENSE file for details.

## Support

- **GitHub Issues**: Report bugs and request features
- **Unraid Forums**: Community support for Unraid-specific questions
- **Documentation**: Check this README for common solutions

---

## Technical Details

- **Frontend**: Angular 17 with Material Design
- **Backend**: Node.js Express with http-proxy-middleware
- **Container**: Alpine Linux for minimal size
- **Architecture**: Multi-stage Docker build for optimized production image