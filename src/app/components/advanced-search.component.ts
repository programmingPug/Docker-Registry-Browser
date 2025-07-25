import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchFilter, SortOption } from '../models/registry.model';
import { SearchFilterService } from '../services/search-filter.service';

@Component({
  selector: 'app-advanced-search',
  template: `
    <mat-card class="search-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>search</mat-icon>
          Advanced Search & Filters
        </mat-card-title>
        <div class="search-actions">
          <button mat-icon-button (click)="toggleExpanded()" matTooltip="Toggle advanced filters">
            <mat-icon>{{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="clearFilters()" matTooltip="Clear all filters">
            <mat-icon>clear</mat-icon>
          </button>
        </div>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Basic Search -->
        <div class="basic-search">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search repositories and tags</mat-label>
            <input matInput 
                   [(ngModel)]="filter.name" 
                   (ngModelChange)="onFilterChange()"
                   placeholder="Type to search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          
          <!-- Quick Filters -->
          <div class="quick-filters">
            <mat-chip-listbox>
              <mat-chip-option 
                *ngFor="let quickFilter of quickFilters" 
                (click)="applyQuickFilter(quickFilter.filter)"
                [selected]="isQuickFilterActive(quickFilter.filter)">
                {{ quickFilter.name }}
              </mat-chip-option>
            </mat-chip-listbox>
          </div>
        </div>

        <!-- Advanced Filters (Expandable) -->
        <div *ngIf="expanded" class="advanced-filters">
          <mat-divider></mat-divider>
          
          <div class="filter-row">
            <!-- Size Filters -->
            <mat-form-field appearance="outline">
              <mat-label>Min Size (MB)</mat-label>
              <input matInput 
                     type="number" 
                     [(ngModel)]="minSizeMB" 
                     (ngModelChange)="onSizeChange()"
                     placeholder="0">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Max Size (MB)</mat-label>
              <input matInput 
                     type="number" 
                     [(ngModel)]="maxSizeMB" 
                     (ngModelChange)="onSizeChange()"
                     placeholder="∞">
            </mat-form-field>
          </div>

          <div class="filter-row">
            <!-- Date Filters -->
            <mat-form-field appearance="outline">
              <mat-label>From Date</mat-label>
              <input matInput 
                     [matDatepicker]="fromPicker" 
                     [(ngModel)]="filter.dateFrom"
                     (ngModelChange)="onFilterChange()">
              <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>To Date</mat-label>
              <input matInput 
                     [matDatepicker]="toPicker" 
                     [(ngModel)]="filter.dateTo"
                     (ngModelChange)="onFilterChange()">
              <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="filter-row">
            <!-- Architecture & OS -->
            <mat-form-field appearance="outline">
              <mat-label>Architecture</mat-label>
              <mat-select [(ngModel)]="filter.architecture" (ngModelChange)="onFilterChange()">
                <mat-option value="">Any</mat-option>
                <mat-option value="amd64">AMD64</mat-option>
                <mat-option value="arm64">ARM64</mat-option>
                <mat-option value="arm">ARM</mat-option>
                <mat-option value="386">386</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Operating System</mat-label>
              <mat-select [(ngModel)]="filter.os" (ngModelChange)="onFilterChange()">
                <mat-option value="">Any</mat-option>
                <mat-option value="linux">Linux</mat-option>
                <mat-option value="windows">Windows</mat-option>
                <mat-option value="darwin">macOS</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Sort Options -->
        <div class="sort-section">
          <mat-divider></mat-divider>
          <div class="sort-controls">
            <mat-form-field appearance="outline">
              <mat-label>Sort By</mat-label>
              <mat-select [(ngModel)]="sortOption.field" (ngModelChange)="onSortChange()">
                <mat-option value="name">Name</mat-option>
                <mat-option value="size">Size</mat-option>
                <mat-option value="modified">Last Modified</mat-option>
              </mat-select>
            </mat-form-field>
            
            <button mat-icon-button 
                    (click)="toggleSortDirection()" 
                    matTooltip="Toggle sort direction">
              <mat-icon>{{ sortOption.direction === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
            </button>
          </div>
        </div>

        <!-- Search History -->
        <div *ngIf="searchHistory.length > 0" class="search-history">
          <mat-divider></mat-divider>
          <h4>Recent Searches</h4>
          <div class="history-chips">
            <mat-chip-listbox>
              <mat-chip-option 
                *ngFor="let search of searchHistory.slice(0, 5)" 
                (click)="applyHistorySearch(search)">
                {{ search.query }} ({{ search.results }})
              </mat-chip-option>
            </mat-chip-listbox>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .search-card {
      margin-bottom: 16px;
    }
    
    .search-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
    
    .basic-search {
      margin-bottom: 16px;
    }
    
    .search-field {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .quick-filters {
      margin-bottom: 16px;
    }
    
    .advanced-filters {
      padding-top: 16px;
    }
    
    .filter-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .filter-row mat-form-field {
      flex: 1;
    }
    
    .sort-section {
      padding-top: 16px;
    }
    
    .sort-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .sort-controls mat-form-field {
      flex: 1;
    }
    
    .search-history {
      padding-top: 16px;
    }
    
    .search-history h4 {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
    }
    
    .history-chips mat-chip-option {
      margin-right: 8px;
      margin-bottom: 8px;
    }
    
    mat-card-header {
      display: flex;
      align-items: center;
    }
    
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class AdvancedSearchComponent {
  @Input() filter: SearchFilter = {};
  @Input() sortOption: SortOption = { field: 'name', direction: 'asc' };
  @Output() filterChange = new EventEmitter<SearchFilter>();
  @Output() sortChange = new EventEmitter<SortOption>();

  expanded = false;
  minSizeMB: number | null = null;
  maxSizeMB: number | null = null;
  quickFilters: Array<{ name: string; filter: SearchFilter }> = [];
  searchHistory: any[] = [];

  constructor(private searchFilterService: SearchFilterService) {
    this.quickFilters = this.searchFilterService.getQuickFilters();
    this.searchFilterService.searchHistory$.subscribe(history => {
      this.searchHistory = history;
    });
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  onFilterChange(): void {
    this.filterChange.emit(this.filter);
  }

  onSortChange(): void {
    this.sortChange.emit(this.sortOption);
  }

  onSizeChange(): void {
    this.filter.minSize = this.minSizeMB ? this.minSizeMB * 1024 * 1024 : undefined;
    this.filter.maxSize = this.maxSizeMB ? this.maxSizeMB * 1024 * 1024 : undefined;
    this.onFilterChange();
  }

  toggleSortDirection(): void {
    this.sortOption.direction = this.sortOption.direction === 'asc' ? 'desc' : 'asc';
    this.onSortChange();
  }

  applyQuickFilter(quickFilter: SearchFilter): void {
    this.filter = { ...this.filter, ...quickFilter };
    this.updateSizeFields();
    this.onFilterChange();
  }

  isQuickFilterActive(quickFilter: SearchFilter): boolean {
    return Object.keys(quickFilter).every(key => 
      this.filter[key as keyof SearchFilter] === quickFilter[key as keyof SearchFilter]
    );
  }

  applyHistorySearch(search: any): void {
    this.filter = { name: search.query };
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filter = {};
    this.minSizeMB = null;
    this.maxSizeMB = null;
    this.sortOption = { field: 'name', direction: 'asc' };
    this.onFilterChange();
    this.onSortChange();
  }

  private updateSizeFields(): void {
    this.minSizeMB = this.filter.minSize ? this.filter.minSize / (1024 * 1024) : null;
    this.maxSizeMB = this.filter.maxSize ? this.filter.maxSize / (1024 * 1024) : null;
  }
}
