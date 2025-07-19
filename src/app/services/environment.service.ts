import { Injectable } from '@angular/core';

declare global {
  interface Window {
    env?: {
      REGISTRY_HOST?: string;
      REGISTRY_PROTOCOL?: string;
      REGISTRY_USERNAME?: string;
      REGISTRY_PASSWORD?: string;
      REGISTRY_DISPLAY_URL?: string;
      USE_PROXY?: boolean;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private config: any = {};

  constructor() {
    // Load configuration from window object (set by env.js)
    this.config = window.env || {};
    
    // Log configuration for debugging (without sensitive data)
    console.log('Registry Configuration:', {
      host: this.registryHost,
      protocol: this.registryProtocol,
      hasUsername: !!this.registryUsername,
      hasPassword: !!this.registryPassword,
      useProxy: this.config.USE_PROXY || false
    });
  }

  get registryHost(): string {
    const host = this.config.REGISTRY_HOST || 'localhost:5000';
    // Ensure we don't have protocol in the host
    return host.replace(/^https?:\/\//, '');
  }

  get registryProtocol(): string {
    return this.config.REGISTRY_PROTOCOL || 'http';
  }

  get registryUsername(): string {
    return this.config.REGISTRY_USERNAME || '';
  }

  get registryPassword(): string {
    return this.config.REGISTRY_PASSWORD || '';
  }

  get useProxy(): boolean {
    return this.config.USE_PROXY || false;
  }

  // Get the full registry URL (used for proxy target and direct connection)
  get fullRegistryUrl(): string {
    return `${this.registryProtocol}://${this.registryHost}`;
  }

  // Get display host for docker commands (without protocol)
  get displayHost(): string {
    return this.registryHost;
  }

  // Check if authentication is configured
  get hasAuthentication(): boolean {
    return !!(this.registryUsername && this.registryPassword);
  }

  // Get registry info for display
  getRegistryInfo(): { host: string; protocol: string; secure: boolean; hasAuth: boolean; useProxy: boolean } {
    return {
      host: this.registryHost,
      protocol: this.registryProtocol,
      secure: this.registryProtocol === 'https',
      hasAuth: this.hasAuthentication,
      useProxy: this.useProxy
    };
  }
}
