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

## Quick Start

### Option 1: Docker Run

```bash
docker run -d \
  --name docker-registry-browser \
  -p 8080:80 \
  --add-host=host.docker.internal:host-gateway \
  -e REGISTRY_HOST=localhost:5000 \
  -e REGISTRY_PROTOCOL=http \
  your-dockerhub-username/docker-registry-browser:latest
```

### Option 2: Docker Compose

```bash
git clone https://github.com/your-username/docker-registry-browser.git
cd docker-registry-browser
docker-compose up -d
```

### Option 3: Build from Source

```bash
git clone https://github.com/your-username/docker-registry-browser.git
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
**Solution**: 
1. Verify `REGISTRY_HOST` is correct
2. Check if registry is accessible from container
3. For local registries, ensure `--add-host=host.docker.internal:host-gateway` is set

### CORS Issues

**Problem**: API requests blocked by CORS
**Solution**: The nginx configuration includes CORS headers, but ensure your registry allows cross-origin requests

### Authentication Issues

**Problem**: 401 Unauthorized errors
**Solution**: Set `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` environment variables

### Manifest Issues

**Problem**: "OCI index found" errors
**Solution**: This should be resolved in the current version which supports OCI manifests

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

### v1.0.0
- Initial release
- Support for Docker v2 and OCI manifests
- Responsive design
- Push command generation
- Dark/Light mode
- Multi-platform image support
