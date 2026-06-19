import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { LogService } from '../../../../core/services/log.service';
import { ActivityLog } from '../../../../core/models/log.model';
import { Product } from '../../../../core/models/product.model';
import { userStore } from '../../../../store/users/user.store';

export interface ProductHistoryDialogData {
  product: Product;
}

@Component({
  selector: 'app-product-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
  ],
  templateUrl: './product-history-dialog.component.html',
  styleUrl: './product-history-dialog.component.scss',
})
export class ProductHistoryDialogComponent implements OnInit {
  private readonly logService = inject(LogService);
  private readonly dialogRef = inject(MatDialogRef<ProductHistoryDialogComponent>);
  readonly data = inject<ProductHistoryDialogData>(MAT_DIALOG_DATA);
  userstore = inject(userStore);

  logs = signal<ActivityLog[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchHistory();
  }

  fetchHistory(): void {
    if (!this.data.product._id) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.logService.fetchLogsByTarget(this.data.product._id).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch product history:', err);
        this.error.set('Failed to load history. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getChanges(log: ActivityLog): { field: string; old: any; new: any }[] {
    if (!log.changes || !log.changes.newValue) return [];

    const changes: { field: string; old: any; new: any }[] = [];
    const oldVal = log.changes.oldValue || {};
    const newVal = log.changes.newValue;

    Object.keys(newVal).forEach((key) => {
      if (oldVal[key] !== newVal[key]) {
        changes.push({
          field: this.formatFieldName(key),
          old: oldVal[key],
          new: newVal[key],
        });
      }
    });

    return changes;
  }

  private formatFieldName(key: string): string {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  getActionIcon(type: string): string {
    switch (type) {
      case 'creation':
        return 'add_circle';
      case 'deletion':
        return 'delete';
      case 'mutation':
        return 'edit';
      default:
        return 'history';
    }
  }

  mapUserIdToName(userId: string): string {
    return this.userstore.users().find((user) => user._id === userId)?.firstName || 'Admin User';
  }
}
