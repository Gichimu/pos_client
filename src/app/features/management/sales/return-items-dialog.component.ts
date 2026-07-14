import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SaleItem, LineItem } from '../../../core/models/sale.model';
import { saleStore } from '../../../store/sales/sale.store';
import { productStore } from '../../../store/products/product.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { ReceiptService } from '../../../core/services/receipt.service';
import { shiftStore } from '../../../store/shifts/shift.store';
import { userStore } from '../../../store/users/user.store';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-return-items-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>assignment_return</mat-icon>
        Partial Return - {{ getSaleIdLabel(data.sale) }}
      </h2>
      <!-- <button
        mat-stroked-button
        color="warn"
        class="return-all-btn"
        (click)="returnEntireSale()"
        matTooltip="Return every item in this bill"
      >
        <mat-icon>assignment_return</mat-icon>
        Return Entire Bill
      </button> -->
    </div>
    <mat-dialog-content class="details-content">
      <p class="dialog-desc">
        Select an item to mark it for return or use the button above to return the entire bill.
      </p>

      <div class="table-container">
        <table mat-table [dataSource]="saleItems()" class="items-table">
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
            <td mat-cell *matCellDef="let item" class="num-col">
              {{ formatCurrency(item.unitPrice) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item" class="action-col">
              <button
                mat-stroked-button
                color="warn"
                (click)="returnItem(item)"
                matTooltip="Mark this item for return"
              >
                <mat-icon>keyboard_return</mat-icon>
                Return
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>

      <div class="sale-footer">
        <span class="total-label">Adjusted Total</span>
        <span class="total-val">{{ formatCurrency(adjustedTotal()) }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: 24px;
      }
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: var(--color-text);
        margin: 0;
        mat-icon {
          color: var(--color-warn);
        }
      }
      .return-all-btn {
        font-weight: 600;
        border-width: 2px !important;
      }
      .dialog-desc {
        font-size: 0.9rem;
        color: var(--color-text-muted);
        margin-bottom: 20px;
      }
      .details-content {
        min-width: 600px;
        max-width: 95vw;
        padding: 20px 24px !important;
      }
      .table-container {
        border: 1px solid var(--color-border);
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }
      .items-table {
        width: 100%;
        .mat-mdc-header-cell {
          background: #f8fafc;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 600;
          padding: 12px;
        }
        .mat-mdc-cell {
          font-size: 0.85rem;
          padding: 12px;
        }
      }
      .num-col {
        text-align: right;
      }
      .action-col {
        text-align: right;
      }
      .sale-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        padding-top: 16px;
      }
      .total-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-text-muted);
      }
      .total-val {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-primary);
      }
      .dialog-actions {
        padding: 16px 24px !important;
        border-top: 1px solid var(--color-border);
      }
    `,
  ],
})
export class ReturnItemsDialogComponent {
  readonly data = inject<{ sale: SaleItem }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ReturnItemsDialogComponent>);
  private readonly saleStore = inject(saleStore);
  private readonly userStore = inject(userStore);
  private readonly shiftStore = inject(shiftStore);
  private readonly productStore = inject(productStore);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly receiptService = inject(ReceiptService);

  readonly saleItems = signal<LineItem[]>(this.data.sale.items);
  readonly adjustedTotal = computed(() =>
    this.saleItems().reduce((sum, item) => sum + item.subTotal, 0),
  );

  readonly displayedColumns = ['product', 'qty', 'price', 'actions'];

  close() {
    this.dialogRef.close();
  }

  getProductName(item: LineItem): string {
    if (item.productName) return item.productName;
    const p = this.productStore.products().find((product) => product._id === item.productId);
    return p ? p.name : 'Unknown Product';
  }

  getSaleIdLabel(sale: SaleItem): string {
    return sale.saleId ? `#${sale.saleId}` : `#${(sale._id ?? '').slice(-6).toUpperCase()}`;
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  returnItem(item: LineItem) {
    if (!item._id) return;
    this.saleStore.returnItem(this.data.sale._id!, item._id).subscribe({
      next: (updatedSale) => {
        this.sweetAlert.success(`Item marked for return`);
        this.saleItems.set(updatedSale.items);
        this.data.sale.items = updatedSale.items; // update local data to refresh table
        this.data.sale.totalAmount = updatedSale.totalAmount;

        if (updatedSale.items.length === 0) {
          this.close();
        }

        // Reprint receipt
        const cashier = this.userStore.users().find((u) => u._id === updatedSale.cashierId) || null;
        const shift = this.shiftStore.shifts().find((s) => s._id === updatedSale.shiftId) || null;

        // this.receiptService.print({
        //   sale: updatedSale,
        //   cashier,
        //   shift,
        //   cartSnapshot: updatedSale.items.map((i: any) => ({
        //     product: {
        //       _id: i.productId,
        //       name: i.productName,
        //       sellingPrice: i.unitPrice,
        //       sku: i.productSku,
        //       imageUrl: '',
        //       buyingPrice: 0,
        //       currentStock: 0,
        //       stockReorderLevel: 0,
        //     } as any,
        //     quantity: i.quantity,
        //   })),
        //   grandTotal: updatedSale.totalAmount,
        // });
      },
      error: () => this.sweetAlert.error('Failed to return item'),
      // complete: () => {
      //   this.dialogRef.close();
      // },
    });
  }

  returnEntireSale() {
    Swal.fire({
      title: 'Return entire bill?',
      text: 'This will mark every item in this sale as returned.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, return all',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.saleStore.returnEntireSale(this.data.sale._id!).subscribe({
        next: () => {
          this.sweetAlert.success('Entire bill marked for return');
          this.close();
        },
        error: () => this.sweetAlert.error('Failed to return entire sale'),
      });
    });
  }
}
