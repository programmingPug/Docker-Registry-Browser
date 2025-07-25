import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogData } from '../models/registry.model';

@Component({
  selector: 'app-confirmation-dialog',
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>
        <mat-icon [color]="data.dangerous ? 'warn' : 'primary'">
          {{ data.dangerous ? 'warning' : 'help_outline' }}
        </mat-icon>
        {{ data.title }}
      </h2>
      
      <mat-dialog-content>
        <div class="dialog-content">
          <p>{{ data.message }}</p>
          
          <div *ngIf="data.itemName" class="item-highlight">
            <strong>{{ data.itemName }}</strong>
          </div>
          
          <div *ngIf="data.dangerous" class="warning-section">
            <mat-icon color="warn">error</mat-icon>
            <span>This action cannot be undone!</span>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText }}
        </button>
        <button 
          mat-raised-button 
          [color]="data.dangerous ? 'warn' : 'primary'"
          (click)="onConfirm()"
          [class.dangerous-button]="data.dangerous">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 400px;
      max-width: 600px;
    }
    
    .dialog-content {
      padding: 16px 0;
      line-height: 1.5;
    }
    
    .item-highlight {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
      font-family: 'Courier New', monospace;
      border-left: 4px solid #2196f3;
    }
    
    .warning-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background-color: #fff3e0;
      border-radius: 4px;
      border-left: 4px solid #ff9800;
    }
    
    .dangerous-button {
      background-color: #f44336 !important;
      color: white !important;
    }
    
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0;
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
