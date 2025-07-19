// server.js - Node.js Express proxy server for Docker Registry Browser
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Environment variables
const REGISTRY_HOST = process.env.REGISTRY_HOST || 'localhost:5000';
const REGISTRY_PROTOCOL = process.env.REGISTRY_PROTOCOL || 'http';
const REGISTRY_USERNAME = process.env.REGISTRY_USERNAME || '';
const REGISTRY_PASSWORD = process.env.REGISTRY_PASSWORD || '';

const registryUrl = `${REGISTRY_PROTOCOL}://${REGISTRY_HOST}`;

console.log('=== Docker Registry Browser Node.js Proxy ===');
console.log('Target Registry:', registryUrl);
console.log('Has Authentication:', !!(REGISTRY_USERNAME && REGISTRY_PASSWORD));

// Serve static files from the Angular build
app.use(express.static(path.join(__dirname, 'dist/docker-registry-browser')));

// Create proxy middleware with comprehensive options
const proxyOptions = {
  target: registryUrl,
  changeOrigin: true,
  secure: false, // Allow self-signed certificates
  pathRewrite: {
    '^/api': '', // Remove /api prefix
  },
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  
  onProxyReq: (proxyReq, req, res) => {
    // Add auth header if configured
    if (REGISTRY_USERNAME && REGISTRY_PASSWORD) {
      const auth = Buffer.from(`${REGISTRY_USERNAME}:${REGISTRY_PASSWORD}`).toString('base64');
      proxyReq.setHeader('Authorization', `Basic ${auth}`);
    }
    
    // Log requests for debugging
    console.log(`[PROXY] ${req.method} ${req.url} -> ${registryUrl}${req.url.replace('/api', '')}`);
    
    // Ensure proper headers
    proxyReq.setHeader('User-Agent', 'Docker-Registry-Browser/1.0');
  },
  
  onProxyRes: (proxyRes, req, res) => {
    // Add comprehensive CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Docker-Content-Digest, Docker-Distribution-Api-Version, X-Registry-Auth, WWW-Authenticate');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Log successful responses
    console.log(`[PROXY] Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  
  onError: (err, req, res) => {
    console.error(`[PROXY ERROR] ${req.method} ${req.url}:`, err.message);
    
    // Send detailed error response
    res.status(502).json({
      error: 'Registry proxy error',
      message: err.message,
      code: err.code,
      target: registryUrl,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }
};

// Registry API proxy - this handles all /api/* requests
app.use('/api', createProxyMiddleware(proxyOptions));

// Handle CORS preflight requests explicitly
app.options('/api/*', (req, res) => {
  console.log('[CORS] Handling OPTIONS preflight request');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    registry: registryUrl,
    hasAuth: !!(REGISTRY_USERNAME && REGISTRY_PASSWORD),
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Proxy status endpoint for debugging
app.get('/proxy-status', (req, res) => {
  res.json({
    proxy_target: registryUrl,
    status: 'configured',
    has_auth: !!(REGISTRY_USERNAME && REGISTRY_PASSWORD),
    proxy_middleware: 'http-proxy-middleware',
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

// Test registry connection endpoint
app.get('/test-registry', (req, res) => {
  // Simple test endpoint - actual testing is done by the proxy
  res.json({
    message: 'Registry connection testing is handled by the proxy',
    registry: registryUrl,
    hasAuth: !!(REGISTRY_USERNAME && REGISTRY_PASSWORD),
    timestamp: new Date().toISOString()
  });
});

// Catch-all handler: send back Angular's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/docker-registry-browser/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 80;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== Server Started ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Registry proxy: /api/* -> ${registryUrl}/*`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Proxy status: http://localhost:${PORT}/proxy-status`);
  console.log('======================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
