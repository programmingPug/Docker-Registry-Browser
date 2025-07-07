import { Injectable } from '@angular/core';

declare global {
  interface Window {
    env: {
      REGISTRY_HOST: string;
      REGISTRY_PROTOCOL: string;
      REGISTRY_USERNAME: string;
      REGISTRY_PASSWORD: string;
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
  }

  get registryHost(): string {
    return this.config.REGISTRY_HOST || 'localhost:5000';
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

  get fullRegistryUrl(): string {
    return `${this.registryProtocol}://${this.registryHost}`;
  }

  // Get display host (without protocol) for commands
  get displayHost(): string {
    return this.registryHost;
  }
}
