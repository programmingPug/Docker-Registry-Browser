export interface Repository {
  name: string;
}

export interface Tag {
  name: string;
  details?: ImageDetails;
}

export interface RegistryResponse {
  repositories: string[];
}

export interface TagsResponse {
  name: string;
  tags: string[];
}

export interface ImageDetails {
  digest: string;
  mediaType: string;
  size: number;
  created: string;
  architecture: string;
  os: string;
  layers: LayerInfo[];
  config: ImageConfig;
}

export interface LayerInfo {
  digest: string;
  size: number;
  mediaType: string;
}

export interface ImageConfig {
  labels?: { [key: string]: string };
  env?: string[];
  cmd?: string[];
  entrypoint?: string[];
  workingDir?: string;
  user?: string;
  exposedPorts?: { [key: string]: any };
  volumes?: { [key: string]: any };
}

export interface ManifestResponse {
  schemaVersion: number;
  mediaType: string;
  config: {
    digest: string;
    mediaType: string;
    size: number;
  };
  layers: {
    digest: string;
    mediaType: string;
    size: number;
  }[];
}

export interface ConfigResponse {
  created: string;
  architecture: string;
  os: string;
  config: ImageConfig;
  history: {
    created: string;
    created_by: string;
    empty_layer?: boolean;
  }[];
}