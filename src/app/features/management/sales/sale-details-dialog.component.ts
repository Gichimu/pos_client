import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { SaleItem, LineItem } from '../../../core/models/sale.model';
import { productStore } from '../../../store/products/product.store';

export interface SaleDetailsDialogData {
  sales: SaleItem[];
}

@Component({
  selector: 'app-sale-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>receipt_long</mat-icon>
      Sale Review
    </h2>
    <mat-dialog-content class="details-content">
      @for (sale of data.sales; track sale._id) {
        <div class="sale-section">
          <div class="sale-header">
            <div class="sale-meta">
              <span class="sale-id-badge">{{ getSaleIdLabel(sale) }}</span>
              <span class="sale-date">
                <mat-icon>schedule</mat-icon>
                {{ formatDateTime(getSaleDate(sale)) }}
              </span>
            </div>
          </div>
          
          <div class="table-container">
            <table mat-table [dataSource]="sale.items" class="items-table">
              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let item">{{ getProductName(item) }}</td>
              </ng-container>

              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef class="num-col">Qty</th>
                <td mat-cell *matCellDef="let item" class="num-col">{{ item.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef class="num-col">Price</th>
                <td mat-cell *matCellDef="let item" class="num-col">{{ formatCurrency(item.unitPrice) }}</td>
              </ng-container>

              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef class="num-col">Subtotal</th>
                <td mat-cell *matCellDef="let item" class="num-col">{{ formatCurrency(item.subTotal) }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>

          <div class="sale-footer">
            <span class="total-label">Sale Total</span>
            <span class="total-val">{{ formatCurrency(calculateSaleTotal(sale)) }}</span>
          </div>
        </div>
        @if (!$last) {
          <div class="section-divider"></div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-flat-button color="primary" (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: var(--color-text);
      mat-icon { color: var(--color-primary); }
    }
    .details-content {
      min-width: 540px;
      max-width: 95vw;
      padding: 20px 24px !important;
    }
    .sale-section {
      background: #fafafa;
      border-radius: 12px;
      border: 1px solid var(--color-border);
      padding: 16px;
      margin-bottom: 12px;
    }
    .sale-header {
      margin-bottom: 16px;
    }
    .sale-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sale-id-badge {
      background: #eef2ff;
      color: #4338ca;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
    }
    .sale-date {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .table-container {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
      background: #fff;
    }
    .items-table {
      width: 100%;
      .mat-mdc-header-cell {
        background: #f8fafc;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
        color: var(--color-text-muted);
        padding: 8px 12px;
      }
      .mat-mdc-cell {
        font-size: 0.82rem;
        padding: 8px 12px;
        border-bottom-color: #f1f5f9;
      }
      tr:last-child .mat-mdc-cell { border-bottom: none; }
    }
    .num-col { text-align: right; }
    .sale-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding-top: 8px;
    }
    .total-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .total-val {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    .section-divider {
      height: 24px;
    }
    .dialog-actions {
      padding: 16px 24px !important;
      border-top: 1px solid var(--color-border);
    }
    @media (max-width: 600px) {
      .details-content { min-width: 100%; }
      .sale-meta { flex-direction: column; align-items: flex-start; gap: 8px; }
    }
  `]
})
export class SaleDetailsDialogComponent {
  readonly data = inject<SaleDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SaleDetailsDialogComponent>);
  private readonly productStore = inject(productStore);

  readonly displayedColumns = ['product', 'qty', 'price', 'subtotal'];

  close() {
    this.dialogRef.close();
  }

  getProductName(item: LineItem): string {
    if (item.productName) return item.productName;
    const p = this.productStore.products().find((product) => product._id === item.productId);
    return p ? p.name : 'Unknown Product';
  }

  getSaleDate(sale: SaleItem): Date {
    return new Date((sale as any).createdAt ?? Date.now());
  }

  getSaleIdLabel(sale: SaleItem): string {
    return sale.saleId ? `#${sale.saleId}` : `#${(sale._id ?? '').slice(-6).toUpperCase()}`;
  }

  calculateSaleTotal(sale: SaleItem): number {
    return sale.items.reduce((sum, item) => sum + item.subTotal, 0);
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
