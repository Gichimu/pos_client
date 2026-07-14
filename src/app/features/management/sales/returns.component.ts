import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { saleStore } from '../../../store/sales/sale.store';
import { productStore } from '../../../store/products/product.store';
import { userStore } from '../../../store/users/user.store';
import { shiftStore } from '../../../store/shifts/shift.store';
import { ReceiptService } from '../../../core/services/receipt.service';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="returns-page page-enter">
      <div class="returns-header">
        <div class="header-content">
          <h2 class="title">Pending Returns</h2>
          <p class="desc">
            Review and confirm returned items to update inventory and adjust sales records.
          </p>
        </div>
      </div>

      <div class="table-wrap">
        @if (isLoading()) {
          <div class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        }

        @if (pendingReturns().length === 0 && !isLoading()) {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>assignment_return</mat-icon>
            </div>
            <p class="empty-title">No pending returns</p>
            <p class="empty-desc">Returned items will appear here for final confirmation.</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="pendingReturns()" class="returns-table">
              <ng-container matColumnDef="saleId">
                <th mat-header-cell *matHeaderCellDef>Sale #</th>
                <td mat-cell *matCellDef="let ret">
                  <span class="sale-id">{{ getSaleNumber(ret) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let ret">{{ getProductName(ret) }}</td>
              </ng-container>

              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef class="num-col">Qty</th>
                <td mat-cell *matCellDef="let ret" class="num-col">{{ ret.quantity }}</td>
              </ng-container>

              <!-- <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef class="num-col">Refund Amount</th>
                <td mat-cell *matCellDef="let ret" class="num-col">
                  {{ formatCurrency(getTotal(ret)) }}
                </td>
              </ng-container> -->

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let ret" class="action-col">
                  <button
                    mat-flat-button
                    color="primary"
                    (click)="confirmReturn(ret)"
                    matTooltip="Confirm return, restore stock, and reprint receipt"
                  >
                    <mat-icon>check_circle</mat-icon>
                    Confirm Return
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns" class="return-row"></tr>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .returns-page {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .returns-header {
        margin-bottom: 32px;
        .title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 8px;
        }
        .desc {
          color: var(--color-text-muted);
          font-size: 0.95rem;
        }
      }
      .table-wrap {
        background: #fff;
        border-radius: 16px;
        border: 1px solid var(--color-border);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        position: relative;
      }
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }
      .table-container {
        overflow-x: auto;
      }
      .returns-table {
        width: 100%;
        .mat-mdc-header-cell {
          background: #f8fafc;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          padding: 16px;
        }
        .mat-mdc-cell {
          padding: 16px;
          font-size: 0.9rem;
        }
      }
      .num-col {
        text-align: right;
      }
      .action-col {
        text-align: right;
      }
      .sale-id {
        background: #eff6ff;
        color: #1e40af;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-family: monospace;
      }
      .return-row:hover {
        background: #fdfdfd;
      }
      .empty-state {
        padding: 100px 24px;
        text-align: center;
        .empty-icon {
          margin-bottom: 24px;
          mat-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            color: var(--color-border);
          }
        }
        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 8px;
        }
        .empty-desc {
          color: var(--color-text-muted);
          font-size: 0.95rem;
        }
      }
    `,
  ],
})
export class ReturnsComponent implements OnInit {
  readonly salesStore = inject(saleStore);
  readonly userStore = inject(userStore);
  readonly productStore = inject(productStore);
  readonly shiftStore = inject(shiftStore);
  private readonly receiptService = inject(ReceiptService);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly pendingReturns = computed(() => this.salesStore.pendingReturns());
  readonly isLoading = computed(() => this.salesStore.isLoading());

  readonly displayedColumns = ['saleId', 'product', 'qty', 'actions'];

  ngOnInit() {
    this.salesStore.loadPendingReturns();
  }

  getProductName(ret: any): string {
    if (ret.productName) return ret.productName;
    const p = this.productStore.products().find((product) => product._id === ret.productId);
    return p ? p.name : 'Unknown Product';
  }

  getSaleNumber(ret: any): string | undefined {
    if (ret.saleIdLabel) return `#${ret.saleIdLabel}`;
    const s = this.salesStore.items().find((sale) => sale._id === ret.saleId);
    // return ret.saleId ? `#${s?.saleId.slice(-6).toUpperCase()}` : 'N/A';
    return s ? s.saleId : 'N/A';
  }

  getTotal(ret: any): number {
    const sale = this.salesStore.items().find((s) => ret.saleId === s._id);
    if (!sale) return ret;
    const item = sale?.items.find((i) => i._id === ret.itemId);
    return item ? item.quantity * item.unitPrice : 0;
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  confirmReturn(ret: any) {
    this.salesStore.confirmReturn(ret._id).subscribe({
      next: (updatedSale) => {
        // Restore stock
        if (ret.productId && ret.quantity) {
          this.productStore.adjustStock(ret.productId, ret.quantity);
        }

        // Reprint receipt
        const cashier = this.userStore.users().find((u) => u._id === updatedSale.cashierId) || null;
        const shift = this.shiftStore.shifts().find((s) => s._id === updatedSale.shiftId) || null;

        updatedSale.items.length > 0 &&
          this.receiptService.print({
            sale: updatedSale,
            cashier,
            shift,
            cartSnapshot: updatedSale.items.map((i: any) => ({
              product: {
                _id: i.productId,
                name:
                  i.productName ??
                  this.productStore.products().find((product) => product._id === i.productId)
                    ?.name ??
                  'Unknown Product',
                sellingPrice: i.unitPrice,
                sku: i.productSku,
                imageUrl: '',
                buyingPrice: 0,
                currentStock: 0,
                stockReorderLevel: 0,
              } as any,
              quantity: i.quantity,
            })),
            // grandTotal: updatedSale.totalAmount,
            grandTotal: updatedSale.items.reduce(
              (sum: number, item: any) => sum + item.quantity * item.unitPrice,
              0,
            ),
          });

        this.sweetAlert.success(`Return confirmed. Receipt reprinted.`);
      },
      error: () => this.sweetAlert.error('Failed to confirm return'),
    });
  }
}
