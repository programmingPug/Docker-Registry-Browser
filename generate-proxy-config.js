const fs = require('fs');
const path = require('path');

// Get registry configuration from environment variables
const registryHost = process.env.REGISTRY_HOST || 'localhost:5000';
const registryProtocol = process.env.REGISTRY_PROTOCOL || 'http';
const registryUrl = `${registryProtocol}://${registryHost}`;

console.log(`Configuring proxy for registry: ${registryUrl}`);

// Create dynamic proxy configuration
const proxyConfig = {
  "/api/*": {
    "target": registryUrl,
    "secure": registryProtocol === 'https',
    "changeOrigin": true,
    "logLevel": "debug",
    "headers": {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
    "pathRewrite": {
      "^/api": ""
    }
  }
};

// Add basic auth if credentials are provided
if (process.env.REGISTRY_USERNAME && process.env.REGISTRY_PASSWORD) {
  const auth = Buffer.from(`${process.env.REGISTRY_USERNAME}:${process.env.REGISTRY_PASSWORD}`).toString('base64');
  proxyConfig["/api/*"].headers.Authorization = `Basic ${auth}`;
  console.log('Added basic authentication to proxy');
}

// Write the configuration file
const configPath = path.join(__dirname, 'proxy.conf.json');
fs.writeFileSync(configPath, JSON.stringify(proxyConfig, null, 2));

console.log('Proxy configuration updated successfully');
console.log('Configuration:', JSON.stringify(proxyConfig, null, 2));

module.exports = proxyConfig;
