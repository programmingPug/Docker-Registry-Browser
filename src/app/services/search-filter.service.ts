import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Repository, Tag, SearchFilter, SortOption, SearchHistory } from '../models/registry.model';

@Injectable({
  providedIn: 'root'
})
export class SearchFilterService {
  private searchHistoryKey = 'registry-browser-search-history';
  private favoritesKey = 'registry-browser-favorites';
  private maxHistoryItems = 10;

  private searchHistorySubject = new BehaviorSubject<SearchHistory[]>(this.loadSearchHistory());
  public searchHistory$ = this.searchHistorySubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavorites());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {}

  // Search History Management
  addSearchToHistory(query: string, results: number): void {
    const history = this.loadSearchHistory();
    const newSearch: SearchHistory = {
      query: query.trim(),
      timestamp: new Date(),
      results
    };

    // Remove duplicate queries
    const filteredHistory = history.filter(h => h.query !== newSearch.query);
    
    // Add new search at the beginning
    const updatedHistory = [newSearch, ...filteredHistory].slice(0, this.maxHistoryItems);
    
    this.saveSearchHistory(updatedHistory);
    this.searchHistorySubject.next(updatedHistory);
  }

  clearSearchHistory(): void {
    localStorage.removeItem(this.searchHistoryKey);
    this.searchHistorySubject.next([]);
  }

  private loadSearchHistory(): SearchHistory[] {
    try {
      const stored = localStorage.getItem(this.searchHistoryKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
    return [];
  }

  private saveSearchHistory(history: SearchHistory[]): void {
    try {
      localStorage.setItem(this.searchHistoryKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Favorites Management
  toggleFavorite(repositoryName: string): void {
    const favorites = this.loadFavorites();
    const index = favorites.indexOf(repositoryName);
    
    if (index === -1) {
      favorites.push(repositoryName);
    } else {
      favorites.splice(index, 1);
    }
    
    this.saveFavorites(favorites);
    this.favoritesSubject.next(favorites);
  }

  isFavorite(repositoryName: string): boolean {
    return this.loadFavorites().includes(repositoryName);
  }

  private loadFavorites(): string[] {
    try {
      const stored = localStorage.getItem(this.favoritesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  private saveFavorites(favorites: string[]): void {
    try {
      localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  // Repository Filtering
  filterRepositories(repositories: Repository[], filter: SearchFilter): Repository[] {
    return repositories.filter(repo => {
      // Name filter
      if (filter.name && !repo.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }

      // Size filters
      if (filter.minSize && repo.totalSize && repo.totalSize < filter.minSize) {
        return false;
      }
      if (filter.maxSize && repo.totalSize && repo.totalSize > filter.maxSize) {
        return false;
      }

      // Date filters
      if (filter.dateFrom && repo.lastModified) {
        const repoDate = new Date(repo.lastModified);
        if (repoDate < filter.dateFrom) {
          return false;
        }
      }
      if (filter.dateTo && repo.lastModified) {
        const repoDate = new Date(repo.lastModified);
        if (repoDate > filter.dateTo) {
          return false;
        }
      }

      return true;
    });
  }

  // Repository Sorting
  sortRepositories(repositories: Repository[], sortOption: SortOption): Repository[] {
    return [...repositories].sort((a, b) => {
      let comparison = 0;

      switch (sortOption.field) {
        case 'name':
          comparison = this.compareStrings(a.name, b.name);
          break;
        case 'size':
          comparison = (a.totalSize || 0) - (b.totalSize || 0);
          break;
        case 'created':
        case 'modified':
          const dateA = new Date(a.lastModified || 0);
          const dateB = new Date(b.lastModified || 0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }

      return sortOption.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Tag Sorting with Semantic Versioning Support
  sortTags(tags: Tag[], sortOption: SortOption): Tag[] {
    return [...tags].sort((a, b) => {
      let comparison = 0;

      switch (sortOption.field) {
        case 'name':
          // Try semantic version comparison first
          comparison = this.compareVersions(a.name, b.name);
          if (comparison === 0) {
            // Fall back to string comparison
            comparison = this.compareStrings(a.name, b.name);
          }
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'created':
        case 'modified':
          const dateA = new Date(a.lastModified || a.details?.created || 0);
          const dateB = new Date(b.lastModified || b.details?.created || 0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }

      return sortOption.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Global Search across repositories and tags
  globalSearch(repositories: Repository[], allTags: Map<string, Tag[]>, query: string): {
    repositories: Repository[];
    tags: Array<{ repository: string; tag: Tag; }>;
  } {
    const lowercaseQuery = query.toLowerCase();
    const matchingRepos: Repository[] = [];
    const matchingTags: Array<{ repository: string; tag: Tag; }> = [];

    // Search repositories
    repositories.forEach(repo => {
      if (repo.name.toLowerCase().includes(lowercaseQuery)) {
        matchingRepos.push(repo);
      }
    });

    // Search tags
    allTags.forEach((tags, repoName) => {
      tags.forEach(tag => {
        if (tag.name.toLowerCase().includes(lowercaseQuery)) {
          matchingTags.push({ repository: repoName, tag });
        }
      });
    });

    return { repositories: matchingRepos, tags: matchingTags };
  }

  // Quick filter presets
  getQuickFilters(): Array<{ name: string; filter: SearchFilter; }> {
    return [
      {
        name: 'Large Images (>500MB)',
        filter: { minSize: 500 * 1024 * 1024 }
      },
      {
        name: 'Recent (Last 30 days)',
        filter: { 
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      {
        name: 'Linux AMD64',
        filter: { architecture: 'amd64', os: 'linux' }
      }
    ];
  }

  // Helper methods
  private compareStrings(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  private compareVersions(a: string, b: string): number {
    // Simple semantic versioning comparison
    const versionRegex = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/;
    const matchA = a.match(versionRegex);
    const matchB = b.match(versionRegex);

    if (!matchA && !matchB) return 0;
    if (!matchA) return 1;
    if (!matchB) return -1;

    // Compare major.minor.patch
    for (let i = 1; i <= 3; i++) {
      const numA = parseInt(matchA[i], 10);
      const numB = parseInt(matchB[i], 10);
      if (numA !== numB) {
        return numA - numB;
      }
    }

    // Compare pre-release identifiers
    const preA = matchA[4];
    const preB = matchB[4];
    
    if (!preA && !preB) return 0;
    if (!preA) return 1; // Release versions come after pre-release
    if (!preB) return -1;
    
    return preA.localeCompare(preB);
  }
}
