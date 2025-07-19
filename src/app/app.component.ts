import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DockerRegistryService } from './services/docker-registry.service';
import { EnvironmentService } from './services/environment.service';
import { Repository, Tag, ImageDetails } from './models/registry.model';
import { PushCommandsDialogComponent } from './components/push-commands-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  repositories: Repository[] = [];
  selectedRepo: Repository | null = null;
  tags: Tag[] = [];
  loading = false;
  loadingDetails = false;
  error = '';
  searchTerm = '';
  copyMessage = '';
  selectedTag: Tag | null = null;
  showingDetails = false;
  connectionStatus: { success: boolean; message: string } | null = null;

  constructor(
    private registryService: DockerRegistryService,
    private environmentService: EnvironmentService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.testConnectionAndLoad();
  }

  get registryInfo() {
    return this.environmentService.getRegistryInfo();
  }

  get registryHost(): string {
    return this.environmentService.displayHost;
  }

  async testConnectionAndLoad() {
    this.loading = true;
    this.error = '';
    
    try {
      // Test connection first
      console.log('Testing registry connection...');
      this.connectionStatus = await this.registryService.testConnection();
      
      if (this.connectionStatus.success) {
        console.log('Connection successful, loading repositories...');
        await this.loadRepositories();
      } else {
        this.error = `Registry connection failed: ${this.connectionStatus.message}`;
        console.error('Connection failed:', this.connectionStatus.message);
      }
    } catch (err: any) {
      this.error = `Failed to connect to registry: ${err.message}`;
      console.error('Connection error:', err);
    }
    
    this.loading = false;
  }

  async loadRepositories() {
    this.loading = true;
    this.error = '';
    
    try {
      console.log('Loading repositories...');
      this.repositories = await this.registryService.getRepositories();
      console.log(`Loaded ${this.repositories.length} repositories`);
      
      if (this.repositories.length === 0) {
        this.error = 'No repositories found in the registry. Make sure your registry contains some images.';
      }
    } catch (err: any) {
      this.error = err.message;
      this.repositories = [];
      console.error('Failed to load repositories:', err);
    }
    
    this.loading = false;
  }

  async loadTags(repo: Repository) {
    this.loading = true;
    this.error = '';
    this.selectedRepo = repo;
    this.selectedTag = null;
    this.showingDetails = false;
    
    try {
      console.log(`Loading tags for repository: ${repo.name}`);
      this.tags = await this.registryService.getTags(repo.name);
      console.log(`Loaded ${this.tags.length} tags`);
      
      if (this.tags.length === 0) {
        this.error = `No tags found for repository ${repo.name}`;
      }
    } catch (err: any) {
      this.error = err.message;
      this.tags = [];
      console.error('Failed to load tags:', err);
    }
    
    this.loading = false;
  }

  async loadImageDetails(tag: Tag) {
    if (!this.selectedRepo) return;
    
    this.loadingDetails = true;
    this.selectedTag = tag;
    this.showingDetails = true;
    this.error = '';
    
    try {
      if (!tag.details) {
        console.log(`Loading details for: ${this.selectedRepo.name}:${tag.name}`);
        tag.details = await this.registryService.getImageDetails(
          this.selectedRepo.name, 
          tag.name
        );
        console.log('Image details loaded:', tag.details);
      }
    } catch (err: any) {
      this.error = err.message;
      console.error('Failed to load image details:', err);
    }
    
    this.loadingDetails = false;
  }

  closeDetails() {
    this.selectedTag = null;
    this.showingDetails = false;
    this.error = '';
  }

  openPushCommandsDialog() {
    this.dialog.open(PushCommandsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        registryHost: this.registryHost,
        selectedRepo: this.selectedRepo?.name
      }
    });
  }

  getDockerPullCommand(repoName: string, tagName: string): string {
    return `docker pull ${this.registryHost}/${repoName}:${tagName}`;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copyMessage = 'Copied to clipboard!';
      setTimeout(() => {
        this.copyMessage = '';
      }, 2000);
    }).catch(() => {
      this.copyMessage = 'Failed to copy';
      setTimeout(() => {
        this.copyMessage = '';
      }, 2000);
    });
  }

  formatBytes = (bytes: number): string => {
    return this.registryService.formatBytes(bytes);
  }

  formatDate = (dateString: string): string => {
    return this.registryService.formatDate(dateString);
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  hasObjectKeys(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  getLabelValue(labels: { [key: string]: string } | undefined, key: string): string {
    return labels?.[key] || 'N/A';
  }

  get filteredRepositories(): Repository[] {
    return this.repositories.filter(repo => 
      repo.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Retry connection
  async retryConnection() {
    await this.testConnectionAndLoad();
  }

  // Manual refresh
  async refresh() {
    await this.loadRepositories();
  }
}
