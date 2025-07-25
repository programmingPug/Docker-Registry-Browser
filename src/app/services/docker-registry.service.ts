import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { Repository, Tag, RegistryResponse, TagsResponse, ImageDetails, ManifestResponse, ConfigResponse, DeleteResult } from '../models/registry.model';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root'
})
export class DockerRegistryService {
  private readonly requestTimeout = 30000; // 30 seconds

  constructor(
    private http: HttpClient,
    private environmentService: EnvironmentService
  ) {}

  private get baseUrl(): string {
    // ALWAYS use proxy - this solves CORS issues
    console.log('Using proxy endpoint /api to avoid CORS issues');
    console.log('Proxy target:', this.environmentService.fullRegistryUrl);
    return '/api';
  }

  private getRequestOptions(): { headers: HttpHeaders } {
    // When using proxy, don't add auth headers - the server handles it
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return { headers };
  }

  private handleError(error: any, operation: string): never {
    console.error(`${operation} failed:`, error);
    
    let errorMessage = `${operation} failed`;
    
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage = `Cannot connect to registry proxy. Please check if the Docker Registry Browser server is running properly. Target registry: ${this.environmentService.fullRegistryUrl}`;
          break;
        case 401:
          errorMessage = 'Registry authentication failed. Please check your username and password in the container environment.';
          break;
        case 404:
          errorMessage = `Registry endpoint not found. Please verify your registry host and protocol. Target: ${this.environmentService.fullRegistryUrl}`;
          break;
        case 502:
          errorMessage = `Proxy cannot reach the registry at ${this.environmentService.fullRegistryUrl}. Please check your REGISTRY_HOST and REGISTRY_PROTOCOL settings.`;
          break;
        case 500:
        case 503:
        case 504:
          errorMessage = `Registry server error. Please check if your registry at ${this.environmentService.fullRegistryUrl} is running correctly.`;
          break;
        default:
          errorMessage = `Registry error (${error.status}): ${error.message || 'Unknown error'}`;
      }
      
      // Add helpful debugging info
      if (error.status === 0) {
        errorMessage += '\n\nTroubleshooting:\n1. Make sure you\'re accessing the app through the Docker container, not the dev server\n2. Check that REGISTRY_HOST and REGISTRY_PROTOCOL are correct\n3. Verify your registry is accessible';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }

  async getRepositories(): Promise<Repository[]> {
    try {
      const url = `${this.baseUrl}/v2/_catalog`;
      console.log('Fetching repositories from:', url);
      console.log('Registry target (via proxy):', this.environmentService.fullRegistryUrl);
      
      const response = await firstValueFrom(
        this.http.get<RegistryResponse>(url, this.getRequestOptions())
          .pipe(timeout(this.requestTimeout))
      );
      
      console.log('Registry response:', response);
      
      const repositories = (response?.repositories || []).map(name => ({ name }));
      console.log(`Found ${repositories.length} repositories`);
      
      return repositories;
    } catch (error) {
      this.handleError(error, 'Fetching repositories');
    }
  }

  async getTags(repositoryName: string): Promise<Tag[]> {
    try {
      const url = `${this.baseUrl}/v2/${repositoryName}/tags/list`;
      console.log(`Fetching tags for repository: ${repositoryName} from: ${url}`);
      
      const response = await firstValueFrom(
        this.http.get<TagsResponse>(url, this.getRequestOptions())
          .pipe(timeout(this.requestTimeout))
      );
      
      const tags = (response?.tags || []).map(name => ({ name }));
      console.log(`Found ${tags.length} tags for ${repositoryName}`);
      
      return tags;
    } catch (error) {
      this.handleError(error, `Fetching tags for ${repositoryName}`);
    }
  }

  async getImageDetails(repositoryName: string, tag: string): Promise<ImageDetails> {
    try {
      console.log(`Fetching image details for: ${repositoryName}:${tag}`);
      
      // Enhanced Accept header to support both Docker v2 and OCI manifest formats
      const manifestHeaders = new HttpHeaders({
        'Accept': [
          'application/vnd.docker.distribution.manifest.v2+json',
          'application/vnd.docker.distribution.manifest.list.v2+json',
          'application/vnd.oci.image.manifest.v1+json',
          'application/vnd.oci.image.index.v1+json'
        ].join(', ')
      });

      const url = `${this.baseUrl}/v2/${repositoryName}/manifests/${tag}`;
      console.log('Fetching manifest from:', url);
      
      const manifest = await firstValueFrom(
        this.http.get<any>(url, { headers: manifestHeaders })
          .pipe(timeout(this.requestTimeout))
      );

      console.log('Manifest response:', manifest);

      // Handle different manifest types
      if (this.isManifestList(manifest)) {
        return await this.handleManifestList(repositoryName, tag, manifest);
      } else if (this.isImageManifest(manifest)) {
        return await this.handleImageManifest(repositoryName, manifest);
      } else {
        throw new Error(`Unsupported manifest type: ${manifest.mediaType}`);
      }
    } catch (error) {
      this.handleError(error, `Fetching image details for ${repositoryName}:${tag}`);
    }
  }

  private isManifestList(manifest: any): boolean {
    return manifest.mediaType === 'application/vnd.docker.distribution.manifest.list.v2+json' ||
           manifest.mediaType === 'application/vnd.oci.image.index.v1+json';
  }

  private isImageManifest(manifest: any): boolean {
    return manifest.mediaType === 'application/vnd.docker.distribution.manifest.v2+json' ||
           manifest.mediaType === 'application/vnd.oci.image.manifest.v1+json';
  }

  private async handleManifestList(repositoryName: string, tag: string, manifestList: any): Promise<ImageDetails> {
    // For manifest lists, use the first manifest (usually linux/amd64)
    const firstManifest = manifestList.manifests?.[0];
    
    if (!firstManifest) {
      throw new Error('No manifests found in manifest list');
    }

    console.log('Using first manifest from list:', firstManifest);

    // Fetch the actual manifest using its digest
    const manifestHeaders = new HttpHeaders({
      'Accept': [
        'application/vnd.docker.distribution.manifest.v2+json',
        'application/vnd.oci.image.manifest.v1+json'
      ].join(', ')
    });

    const url = `${this.baseUrl}/v2/${repositoryName}/manifests/${firstManifest.digest}`;
    console.log('Fetching actual manifest from:', url);

    const actualManifest = await firstValueFrom(
      this.http.get<any>(url, { headers: manifestHeaders })
        .pipe(timeout(this.requestTimeout))
    );

    return await this.handleImageManifest(repositoryName, actualManifest, firstManifest);
  }

  private async handleImageManifest(repositoryName: string, manifest: any, platformInfo?: any): Promise<ImageDetails> {
    try {
      // Get the config blob
      const configDigest = manifest.config?.digest;
      if (!configDigest) {
        throw new Error('No config digest found in manifest');
      }

      const url = `${this.baseUrl}/v2/${repositoryName}/blobs/${configDigest}`;
      console.log('Fetching config from:', url);

      const config = await firstValueFrom(
        this.http.get<ConfigResponse>(url, this.getRequestOptions())
          .pipe(timeout(this.requestTimeout))
      );

      console.log('Config response:', config);

      // Calculate total size
      const layers = manifest.layers || [];
      const totalSize = layers.reduce((sum: number, layer: any) => sum + (layer.size || 0), 0) + (manifest.config?.size || 0);

      return {
        digest: configDigest,
        mediaType: manifest.mediaType,
        size: totalSize,
        created: config.created || new Date().toISOString(),
        architecture: config.architecture || platformInfo?.platform?.architecture || 'unknown',
        os: config.os || platformInfo?.platform?.os || 'unknown',
        layers: layers.map((layer: any) => ({
          digest: layer.digest,
          size: layer.size || 0,
          mediaType: layer.mediaType || 'application/vnd.docker.image.rootfs.diff.tar.gzip'
        })),
        config: config.config || {}
      };
    } catch (error) {
      console.error('Error handling image manifest:', error);
      throw error;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  }

  // Delete operations
  async deleteTag(repositoryName: string, tag: string): Promise<DeleteResult> {
    try {
      // First, get the manifest to obtain the digest
      const manifestUrl = `${this.baseUrl}/v2/${repositoryName}/manifests/${tag}`;
      console.log(`Getting manifest for deletion: ${manifestUrl}`);
      
      const manifestHeaders = new HttpHeaders({
        'Accept': [
          'application/vnd.docker.distribution.manifest.v2+json',
          'application/vnd.docker.distribution.manifest.list.v2+json',
          'application/vnd.oci.image.manifest.v1+json',
          'application/vnd.oci.image.index.v1+json'
        ].join(', ')
      });

      const manifestResponse = await firstValueFrom(
        this.http.get(manifestUrl, { 
          headers: manifestHeaders,
          observe: 'response' // Get full response to access headers
        }).pipe(timeout(this.requestTimeout))
      );

      // Get the digest from the Docker-Content-Digest header
      const digest = manifestResponse.headers.get('Docker-Content-Digest');
      if (!digest) {
        throw new Error('Could not obtain manifest digest for deletion');
      }

      // Now delete using the digest
      const deleteUrl = `${this.baseUrl}/v2/${repositoryName}/manifests/${digest}`;
      console.log(`Deleting manifest: ${deleteUrl}`);
      
      await firstValueFrom(
        this.http.delete(deleteUrl, this.getRequestOptions())
          .pipe(timeout(this.requestTimeout))
      );

      console.log(`Successfully deleted tag: ${repositoryName}:${tag}`);
      return {
        success: true,
        message: `Tag ${tag} deleted successfully`,
        deletedItem: `${repositoryName}:${tag}`
      };
    } catch (error) {
      console.error('Delete tag failed:', error);
      let errorMessage = `Failed to delete tag ${repositoryName}:${tag}`;
      
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 404:
            errorMessage = `Tag ${tag} not found in repository ${repositoryName}`;
            break;
          case 405:
            errorMessage = 'Delete operation not supported by this registry';
            break;
          case 401:
          case 403:
            errorMessage = 'Insufficient permissions to delete tags';
            break;
          default:
            errorMessage = `Delete failed (${error.status}): ${error.message || 'Unknown error'}`;
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async deleteRepository(repositoryName: string): Promise<DeleteResult> {
    try {
      console.log(`Attempting to delete repository: ${repositoryName}`);
      
      // Get all tags first
      const tags = await this.getTags(repositoryName);
      
      if (tags.length === 0) {
        return {
          success: false,
          message: 'Repository appears to be empty or already deleted'
        };
      }

      // Delete all tags
      let deletedCount = 0;
      let errors: string[] = [];
      
      for (const tag of tags) {
        try {
          const result = await this.deleteTag(repositoryName, tag.name);
          if (result.success) {
            deletedCount++;
          } else {
            errors.push(`${tag.name}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`${tag.name}: ${error}`);
        }
      }

      if (deletedCount === tags.length) {
        console.log(`Successfully deleted repository: ${repositoryName}`);
        return {
          success: true,
          message: `Repository ${repositoryName} deleted successfully (${deletedCount} tags removed)`,
          deletedItem: repositoryName
        };
      } else {
        return {
          success: false,
          message: `Partially deleted repository ${repositoryName}: ${deletedCount}/${tags.length} tags deleted. Errors: ${errors.join(', ')}`
        };
      }
    } catch (error) {
      console.error('Delete repository failed:', error);
      return {
        success: false,
        message: `Failed to delete repository ${repositoryName}: ${error}`
      };
    }
  }

  // Check if tag is the last one in repository
  async isLastTag(repositoryName: string): Promise<boolean> {
    try {
      const tags = await this.getTags(repositoryName);
      return tags.length <= 1;
    } catch (error) {
      console.error('Failed to check tag count:', error);
      return false;
    }
  }

  // Test registry connectivity via proxy
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = `${this.baseUrl}/v2/`;
      console.log('Testing connection to:', url);
      console.log('Target registry (via proxy):', this.environmentService.fullRegistryUrl);
      
      await firstValueFrom(
        this.http.get(url, this.getRequestOptions())
          .pipe(timeout(10000)) // 10 second timeout for connectivity test
      );
      return { success: true, message: 'Registry connection successful via proxy' };
    } catch (error) {
      let errorMsg = 'Connection failed: Unable to reach registry via proxy';
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          errorMsg = 'Cannot connect to proxy server. Make sure you\'re accessing the app through the Docker container.';
        } else if (error.status === 502) {
          errorMsg = `Proxy cannot reach registry at ${this.environmentService.fullRegistryUrl}. Check REGISTRY_HOST and REGISTRY_PROTOCOL.`;
        } else {
          errorMsg = `Connection failed (${error.status}): ${error.message || 'Unknown error'}`;
        }
      }
      
      console.error('Connection test failed:', error);
      return { success: false, message: errorMsg };
    }
  }
}
