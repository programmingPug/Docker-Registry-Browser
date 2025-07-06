import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Repository, Tag, RegistryResponse, TagsResponse, ImageDetails, ManifestResponse, ConfigResponse } from '../models/registry.model';

@Injectable({
  providedIn: 'root'
})
export class DockerRegistryService {
  constructor(private http: HttpClient) {}

  async getRepositories(registryUrl: string): Promise<Repository[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<RegistryResponse>(`${registryUrl}/v2/_catalog`)
      );
      return (response?.repositories || []).map(name => ({ name }));
    } catch (error) {
      throw new Error(`Failed to connect to registry: ${error}`);
    }
  }

  async getTags(registryUrl: string, repositoryName: string): Promise<Tag[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<TagsResponse>(`${registryUrl}/v2/${repositoryName}/tags/list`)
      );
      return (response?.tags || []).map(name => ({ name }));
    } catch (error) {
      throw new Error(`Failed to fetch tags for ${repositoryName}: ${error}`);
    }
  }

  async getImageDetails(registryUrl: string, repositoryName: string, tag: string): Promise<ImageDetails> {
    try {
      // Enhanced Accept header to support both Docker v2 and OCI manifest formats
      const manifestHeaders = new HttpHeaders({
        'Accept': [
          'application/vnd.docker.distribution.manifest.v2+json',
          'application/vnd.docker.distribution.manifest.list.v2+json',
          'application/vnd.oci.image.manifest.v1+json',
          'application/vnd.oci.image.index.v1+json'
        ].join(', ')
      });
      
      const manifest = await firstValueFrom(
        this.http.get<any>(
          `${registryUrl}/v2/${repositoryName}/manifests/${tag}`,
          { headers: manifestHeaders }
        )
      );

      console.log('Manifest response:', manifest);

      // Handle different manifest types
      if (this.isManifestList(manifest)) {
        // Handle manifest lists (multi-platform images)
        return await this.handleManifestList(registryUrl, repositoryName, tag, manifest);
      } else if (this.isImageManifest(manifest)) {
        // Handle single platform manifests
        return await this.handleImageManifest(registryUrl, repositoryName, manifest);
      } else {
        throw new Error(`Unsupported manifest type: ${manifest.mediaType}`);
      }
    } catch (error) {
      console.error('Error fetching image details:', error);
      throw new Error(`Failed to fetch image details for ${repositoryName}:${tag}: ${error}`);
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

  private async handleManifestList(registryUrl: string, repositoryName: string, tag: string, manifestList: any): Promise<ImageDetails> {
    // For manifest lists, we'll use the first manifest (usually linux/amd64)
    // You could enhance this to let users choose the platform
    const firstManifest = manifestList.manifests?.[0];
    
    if (!firstManifest) {
      throw new Error('No manifests found in manifest list');
    }

    console.log('Using manifest from list:', firstManifest);

    // Fetch the actual manifest using its digest
    const manifestHeaders = new HttpHeaders({
      'Accept': [
        'application/vnd.docker.distribution.manifest.v2+json',
        'application/vnd.oci.image.manifest.v1+json'
      ].join(', ')
    });

    const actualManifest = await firstValueFrom(
      this.http.get<any>(
        `${registryUrl}/v2/${repositoryName}/manifests/${firstManifest.digest}`,
        { headers: manifestHeaders }
      )
    );

    return await this.handleImageManifest(registryUrl, repositoryName, actualManifest, firstManifest);
  }

  private async handleImageManifest(registryUrl: string, repositoryName: string, manifest: any, platformInfo?: any): Promise<ImageDetails> {
    try {
      // Get the config blob
      const configDigest = manifest.config?.digest;
      if (!configDigest) {
        throw new Error('No config digest found in manifest');
      }

      const config = await firstValueFrom(
        this.http.get<ConfigResponse>(
          `${registryUrl}/v2/${repositoryName}/blobs/${configDigest}`
        )
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

  // Helper method to get available platforms for a manifest list
  async getAvailablePlatforms(registryUrl: string, repositoryName: string, tag: string): Promise<any[]> {
    try {
      const manifestHeaders = new HttpHeaders({
        'Accept': [
          'application/vnd.docker.distribution.manifest.list.v2+json',
          'application/vnd.oci.image.index.v1+json'
        ].join(', ')
      });
      
      const manifest = await firstValueFrom(
        this.http.get<any>(
          `${registryUrl}/v2/${repositoryName}/manifests/${tag}`,
          { headers: manifestHeaders }
        )
      );

      if (this.isManifestList(manifest)) {
        return manifest.manifests?.map((m: any) => ({
          digest: m.digest,
          platform: m.platform,
          size: m.size
        })) || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting platforms:', error);
      return [];
    }
  }
}
