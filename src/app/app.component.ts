import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DockerRegistryService } from './services/docker-registry.service';
import { EnvironmentService } from './services/environment.service';
import { SearchFilterService } from './services/search-filter.service';
import { Repository, Tag, ImageDetails, SearchFilter, SortOption, DeleteResult } from './models/registry.model';
import { PushCommandsDialogComponent } from './components/push-commands-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  repositories: Repository[] = [];
  filteredRepositories: Repository[] = [];
  selectedRepo: Repository | null = null;
  tags: Tag[] = [];
  filteredTags: Tag[] = [];
  loading = false;
  loadingDetails = false;
  error = '';
  searchTerm = '';
  copyMessage = '';
  selectedTag: Tag | null = null;
  showingDetails = false;
  connectionStatus: { success: boolean; message: string } | null = null;
  
  // New v1.2.0 properties
  searchFilter: SearchFilter = {};
  sortOption: SortOption = { field: 'name', direction: 'asc' };
  globalSearchMode = false;
  globalSearchResults: any = null;
  favorites: string[] = [];
  searchHistory: any[] = [];

  constructor(
    private registryService: DockerRegistryService,
    private environmentService: EnvironmentService,
    private searchFilterService: SearchFilterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.testConnectionAndLoad();
    
    // Subscribe to favorites changes
    this.searchFilterService.favorites$.subscribe(favorites => {
      this.favorites = favorites;
      this.updateRepositoryFavorites();
    });
    
    // Subscribe to search history changes
    this.searchFilterService.searchHistory$.subscribe(history => {
      this.searchHistory = history;
    });
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
      
      // Apply favorites to repositories
      this.updateRepositoryFavorites();
      
      // Apply current filters
      this.applyFilters();
      
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
      
      // Apply current filters and sorting to tags
      this.applyTagFilters();
      
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

  // Retry connection
  async retryConnection() {
    await this.testConnectionAndLoad();
  }

  // Manual refresh
  async refresh() {
    await this.loadRepositories();
  }

  // New v1.2.0 methods
  
  // Filter and search methods
  onFilterChange(filter: SearchFilter): void {
    this.searchFilter = filter;
    this.applyFilters();
    
    // Add to search history if there's a name search
    if (filter.name && filter.name.trim()) {
      this.searchFilterService.addSearchToHistory(
        filter.name.trim(), 
        this.filteredRepositories.length
      );
    }
  }

  onSortChange(sortOption: SortOption): void {
    this.sortOption = sortOption;
    this.applyFilters();
    this.applyTagFilters();
  }

  applyFilters(): void {
    let filtered = this.searchFilterService.filterRepositories(this.repositories, this.searchFilter);
    filtered = this.searchFilterService.sortRepositories(filtered, this.sortOption);
    this.filteredRepositories = filtered;
  }

  applyTagFilters(): void {
    let filtered = [...this.tags];
    
    // Apply name filter if searching
    if (this.searchFilter.name) {
      const searchTerm = this.searchFilter.name.toLowerCase();
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    filtered = this.searchFilterService.sortTags(filtered, this.sortOption);
    this.filteredTags = filtered;
  }

  updateRepositoryFavorites(): void {
    this.repositories.forEach(repo => {
      repo.isFavorite = this.searchFilterService.isFavorite(repo.name);
    });
  }

  toggleFavorite(repository: Repository): void {
    this.searchFilterService.toggleFavorite(repository.name);
  }

  // Delete operations
  async deleteTag(repository: Repository, tag: Tag): Promise<void> {
    const isLastTag = await this.registryService.isLastTag(repository.name);
    
    const dialogData = {
      title: isLastTag ? 'Delete Repository' : 'Delete Tag',
      message: isLastTag 
        ? `This is the last tag in repository "${repository.name}". Deleting it will remove the entire repository.` 
        : `Are you sure you want to delete tag "${tag.name}" from repository "${repository.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      itemName: `${repository.name}:${tag.name}`
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;

    this.loading = true;
    try {
      const result = await this.registryService.deleteTag(repository.name, tag.name);
      
      if (result.success) {
        this.snackBar.open(result.message, 'Close', { duration: 3000 });
        
        if (isLastTag) {
          // Repository was deleted, refresh repository list
          await this.loadRepositories();
          this.selectedRepo = null;
          this.tags = [];
          this.filteredTags = [];
        } else {
          // Just reload tags for current repository
          await this.loadTags(repository);
        }
      } else {
        this.error = result.message;
      }
    } catch (error: any) {
      this.error = `Delete failed: ${error.message}`;
    }
    
    this.loading = false;
  }

  async deleteRepository(repository: Repository): Promise<void> {
    const dialogData = {
      title: 'Delete Repository',
      message: `Are you sure you want to delete the entire repository "${repository.name}"? This will delete ALL tags in this repository.`,
      confirmText: 'Delete Repository',
      cancelText: 'Cancel',
      dangerous: true,
      itemName: repository.name
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;

    this.loading = true;
    try {
      const result = await this.registryService.deleteRepository(repository.name);
      
      if (result.success) {
        this.snackBar.open(result.message, 'Close', { duration: 5000 });
        
        // Refresh repository list
        await this.loadRepositories();
        
        // Clear selection if deleted repo was selected
        if (this.selectedRepo?.name === repository.name) {
          this.selectedRepo = null;
          this.tags = [];
          this.filteredTags = [];
        }
      } else {
        this.error = result.message;
      }
    } catch (error: any) {
      this.error = `Delete failed: ${error.message}`;
    }
    
    this.loading = false;
  }
}
