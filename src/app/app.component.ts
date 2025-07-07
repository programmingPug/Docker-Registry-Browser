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
  registryUrl = '/api'; // Using proxy for CORS
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

  constructor(
    private registryService: DockerRegistryService,
    private environmentService: EnvironmentService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadRepositories();
  }

  get registryHost(): string {
    return this.environmentService.displayHost;
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

  async loadRepositories() {
    this.loading = true;
    this.error = '';
    try {
      this.repositories = await this.registryService.getRepositories(this.registryUrl);
    } catch (err: any) {
      this.error = `Failed to fetch repositories: ${err.message}`;
      this.repositories = [];
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
      this.tags = await this.registryService.getTags(this.registryUrl, repo.name);
    } catch (err: any) {
      this.error = `Failed to fetch tags: ${err.message}`;
      this.tags = [];
    }
    this.loading = false;
  }

  async loadImageDetails(tag: Tag) {
    if (!this.selectedRepo) return;
    
    this.loadingDetails = true;
    this.selectedTag = tag;
    this.showingDetails = true;
    
    try {
      if (!tag.details) {
        tag.details = await this.registryService.getImageDetails(
          this.registryUrl, 
          this.selectedRepo.name, 
          tag.name
        );
      }
    } catch (err: any) {
      this.error = `Failed to fetch image details: ${err.message}`;
    }
    this.loadingDetails = false;
  }

  closeDetails() {
    this.selectedTag = null;
    this.showingDetails = false;
  }

  getDockerPullCommand(repoName: string, tagName: string): string {
    return `docker pull ${this.registryHost}/${repoName}:${tagName}`;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.copyMessage = 'Copied to clipboard!';
    setTimeout(() => {
      this.copyMessage = '';
    }, 2000);
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
}
