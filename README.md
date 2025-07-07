# Docker Registry Browser - Production Deployment

A modern, responsive web interface for browsing Docker registries with support for both Docker v2 and OCI manifest formats.

## Features

- Browse repositories and tags
- View detailed image information (layers, environment, labels, etc.)
- Copy docker pull commands
- Push command generator with examples
- Dark/Light mode toggle
- Fully responsive design
- Support for OCI and Docker v2 manifests
- Multi-platform image support

## Prerequisites

- Docker installed and running
- Access to a Docker registry (local or remote)
- Network connectivity to the registry

## Quick Start

### Option 1: Docker Run

```bash
docker run -d \
  --name docker-registry-browser \
  -p 8080:80 \
  --add-host=host.docker.internal:host-gateway \
  -e REGISTRY_HOST=localhost:5000 \
  -e REGISTRY_PROTOCOL=http \
  programmingpug/docker-registry-browser:latest
```

### Option 2: Docker Compose

```bash
git clone https://github.com/programmingPug/docker-registry-browser.git
cd docker-registry-browser
docker-compose up -d
```

### Option 3: Build from Source

```bash
git clone https://github.com/programmingPug/docker-registry-browser.git
cd docker-registry-browser
docker build -t docker-registry-browser .
docker run -d -p 8080:80 --add-host=host.docker.internal:host-gateway docker-registry-browser
```

## Unraid Installation

### Method 1: Community Applications (Recommended)

1. In Unraid, go to **Apps** tab
2. Search for "Docker Registry Browser"
3. Click **Install**
4. Configure the settings and click **Apply**

### Method 2: Manual Template

1. In Unraid, go to **Docker** tab
2. Click **Add Container**
3. Set **Template** to the template URL or upload the XML template
4. Configure the required settings
5. Click **Apply**

### Method 3: Docker Compose (Unraid 6.12+)

1. Install the "Compose Manager" plugin
2. Create a new compose stack with the provided `docker-compose.yml`
3. Deploy the stack

## Supported Registries

This browser works with any Docker Registry v2 compatible registry, including:

- **Local Docker Registry** - Self-hosted registry containers
- **Harbor** - Open source cloud native registry
- **AWS ECR** - Amazon Elastic Container Registry
- **Azure Container Registry** - Microsoft's container registry
- **Google Container Registry** - Google Cloud's container registry
- **GitLab Container Registry** - GitLab's integrated registry
- **Nexus Repository** - Sonatype's repository manager
- **Artifactory** - JFrog's universal repository manager
- **Docker Hub** - (limited support for browsing)

### Registry Requirements

- Docker Registry API v2 support
- CORS headers configured (for web access)
- Network accessibility from the browser container

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REGISTRY_HOST` | `localhost:5000` | Docker registry hostname and port |
| `REGISTRY_PROTOCOL` | `http` | Protocol (http/https) |
| `REGISTRY_USERNAME` | - | Registry username (optional) |
| `REGISTRY_PASSWORD` | - | Registry password (optional) |

### Unraid Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| **WebUI Port** | `8080` | Port for web interface |
| **Registry Host** | `localhost:5000` | Your registry address |
| **Registry Protocol** | `http` | http or https |
| **Registry Username** | - | Optional authentication |
| **Registry Password** | - | Optional authentication |

## Usage

1. Access the web interface at `http://your-server:8080`
2. Browse repositories on the left panel
3. Select a repository to view its tags
4. Click the info button to view detailed image information
5. Use the menu for push commands and settings
6. Toggle dark/light mode using the theme button in the toolbar

## Features Guide

### Dark Mode
- Toggle between light and dark themes using the moon/sun icon in the toolbar
- Theme preference is saved locally and persists between sessions
- All UI components are properly themed for optimal visibility in both modes

### Browsing Images
- Repository list shows all available repositories
- Click a repository to load its tags
- Search repositories using the search field
- View tag details by clicking the info button

### Push Commands
- Access via the menu (three dots) in the toolbar
- Get step-by-step instructions for pushing images
- Copy commands to clipboard
- Includes multi-architecture build instructions

### Image Details
- View comprehensive image information
- See layer details, environment variables, labels
- Check image size, architecture, and creation date
- Inspect exposed ports and volumes

## Troubleshooting

### Registry Connection Issues

**Problem**: Cannot connect to registry  
**Solutions**:
- Verify `REGISTRY_HOST` is correct (hostname:port format)
- Check if registry is accessible from container
- For local registries, ensure `--add-host=host.docker.internal:host-gateway` is set
- Test registry connectivity: `curl http://your-registry:5000/v2/`

### CORS Issues

**Problem**: API requests blocked by CORS  
**Solutions**:
- The nginx configuration includes CORS headers
- Ensure your registry allows cross-origin requests
- For development, use the included proxy configuration

### Authentication Issues

**Problem**: 401 Unauthorized errors  
**Solutions**:
- Set `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` environment variables
- Verify credentials are correct for your registry
- Check if registry requires authentication

### Manifest Issues

**Problem**: "OCI index found" or manifest parsing errors  
**Solutions**:
- Current version supports OCI manifests
- Ensure registry supports Docker Registry API v2
- Check if image manifests are properly formatted

### Port Conflicts

**Problem**: Port 8080 already in use  
**Solutions**:
- Change the host port: `-p 8081:80` instead of `-p 8080:80`
- Stop conflicting services or use different ports
- Check what's using the port: `netstat -tlnp | grep 8080`

## Development

### Building

```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production
npm run build

# Build Docker image
docker build -t docker-registry-browser .
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Health Check

The container includes a health check endpoint at `/health` that returns:
- `200 OK` with "healthy" response when running properly
- Checks every 30 seconds with 3 retries

## Security

- Runs as non-root user (nginx:nginx)
- Includes security headers
- No sensitive data stored in container
- Registry credentials passed via environment variables

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.1.0
- Updated Angular to v17
- Improved error handling
- Enhanced UI/UX
- Better multi-platform support
- Optimized build process

### v1.0.0
- Initial release
- Support for Docker v2 and OCI manifests
- Responsive design
- Push command generation
- Dark/Light mode
- Multi-platform image support
