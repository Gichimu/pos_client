import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { inject } from '@angular/core';
import { saleStore } from '../../../store/sales/sale.store';
import { userStore } from '../../../store/users/user.store';
import { productStore } from '../../../store/products/product.store';
import { shiftStore } from '../../../store/shifts/shift.store';
import {
  PaymentMethodDialogComponent,
  PaymentMethodDialogData,
  PaymentMethodDialogResult,
} from './payment-method-dialog.component';

type FilterStatus = 'all' | 'pending' | 'confirmed';

@Component({
  selector: 'app-sales',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  readonly salesStore = inject(saleStore);
  readonly userStore = inject(userStore);
  readonly productStore = inject(productStore);
  readonly shiftStore = inject(shiftStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly today = new Date();

  /** The currently open shift, or null. */
  readonly activeShift = computed(() => this.shiftStore.activeShift());

  readonly isLoading = computed(() => this.salesStore.isLoading());

  // ── Flat line-item list derived from all sale documents ──────────────────

  /**
   * Flattens all sale documents into a single list of enriched line items.
   * This is the source of truth for the table and all stat cards.
   */
  readonly items = computed(() =>
    this.salesStore.items().flatMap((sale) =>
      sale.items.map((item) => ({
        _id: item._id,
        parentSaleId: sale._id,
        shiftId: sale.shiftId ?? null,
        saleId: (sale as any).saleId,
        productId: item.productId,
        productName: this.getProduct(item.productId!)?.name ?? 'Unknown Product',
        productSku: this.getProduct(item.productId!)?.sku ?? 'N/A',
        productImage: `https://picsum.photos/seed/${item.productId}/60/60`,
        cashierId: (sale as any).cashierId?._id,
        cashierName:
          (() => {
            const u = this.getUser((sale as any).cashierId?._id);
            return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
          })(),
        cashierAvatar: `https://i.pravatar.cc/32?u=${(sale as any).cashierId?._id}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.subTotal,
        subTotal: item.subTotal,
        transactionDate: new Date((sale as any).createdAt),
        confirmed: item.confirmed,
        paymentMethod: item.paymentMethod ?? null,
      })),
    ),
  );

  // ── Filters ──────────────────────────────────────────────────────────────

  filterStatus = signal<FilterStatus>('all');
  filterCashierId = signal<string | null>(null);

  /** Line-item _id currently awaiting delete confirmation. */
  pendingDeleteItemId = signal<string | null>(null);

  readonly cashierOptions = computed(() =>
    this.userStore.users().map((u) => ({
      id: u._id!,
      name: `${u.firstName} ${u.lastName}`,
      avatar: u.avatar ?? '',
    })),
  );

  // ── Filtered list (status + cashier) — used for stat cards + paginator ──

  readonly filteredItems = computed(() => {
    const status = this.filterStatus();
    const cashierId = this.filterCashierId();
    let result = this.items();
    if (cashierId) result = result.filter((i) => i.cashierId === cashierId);
    if (status === 'confirmed') return result.filter((i) => i.confirmed);
    if (status === 'pending') return result.filter((i) => !i.confirmed);
    return result;
  });

  // ── Client-side pagination ───────────────────────────────────────────────

  readonly PAGE_SIZE = 10;
  readonly pageIndex = signal(0);

  /** The slice of filteredItems shown on the current page. */
  readonly pagedItems = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredItems().slice(start, start + this.PAGE_SIZE);
  });

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  // ── Stat cards — aggregate over the FULL filtered set ───────────────────

  readonly totalRevenue = computed(() =>
    this.filteredItems().reduce((sum, i) => sum + i.totalAmount, 0),
  );
  readonly totalQty = computed(() =>
    this.filteredItems().reduce((sum, i) => sum + i.quantity, 0),
  );
  readonly confirmedCount = computed(() => this.filteredItems().filter((i) => i.confirmed).length);
  readonly pendingCount = computed(() => this.filteredItems().filter((i) => !i.confirmed).length);
  readonly allConfirmed = computed(() => {
    const list = this.filteredItems();
    return list.length > 0 && list.every((i) => i.confirmed);
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.filterStatus.set('all');
    this.filterCashierId.set(null);
    this.pageIndex.set(0);
    this.salesStore.loadSales(null);
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  readonly displayedColumns = [
    'image',
    'saleId',
    'product',
    'cashier',
    'qty',
    'unitPrice',
    'total',
    'time',
    'status',
    'actions',
  ];

  isShiftClosed(item: any): boolean {
    if (!item.shiftId) return false;
    const shift = this.shiftStore.shifts().find((s: any) => s._id === item.shiftId);
    return (shift as any)?.status === 'Closed';
  }

  setFilter(status: FilterStatus) {
    this.filterStatus.set(status);
    this.pageIndex.set(0);
  }

  setCashierFilter(cashierId: string | null) {
    this.filterCashierId.set(cashierId);
    this.pageIndex.set(0);
    // Re-fetch from API with cashier filter so backend can optimise the query
    this.salesStore.loadSales(cashierId);
  }

  getUser(userId: string) {
    return this.userStore.users().find((user) => user._id === userId);
  }

  getProduct(productId: string) {
    return this.productStore.products().find((product) => product._id === productId);
  }

  toggleConfirm(item: any) {
    if (item.confirmed) {
      this.salesStore.unconfirmItem(item._id, item.parentSaleId).subscribe({
        next: () => {
          this.snackBar.open(`${item.productName} marked as pending`, 'Dismiss', {
            duration: 2500,
          });
        },
        error: () => {
          this.snackBar.open(
            `Failed to unconfirm ${item.productName}. Please try again.`,
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
      return;
    }

    const dialogRef = this.dialog.open<
      PaymentMethodDialogComponent,
      PaymentMethodDialogData,
      PaymentMethodDialogResult
    >(PaymentMethodDialogComponent, {
      data: {
        itemId: item._id,
        productName: item.productName,
        totalAmount: item.totalAmount,
      },
      width: '520px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.salesStore.confirmItem(item._id, item.parentSaleId, result.paymentMethod).subscribe({
        next: () => {
          this.snackBar.open(
            `${item.productName} confirmed via ${result.paymentMethod}`,
            'Dismiss',
            { duration: 2500 },
          );
        },
        error: () => {
          this.snackBar.open(
            `Failed to confirm ${item.productName}. Please try again.`,
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  confirmAll() {
    this.snackBar.open('All line items confirmed', 'Dismiss', { duration: 2500 });
  }

  deleteItem(item: any) {
    if (this.pendingDeleteItemId() === item._id) {
      this.pendingDeleteItemId.set(null);
      this.salesStore.deleteLineItem(item._id, item.parentSaleId).subscribe({
        next: () => {
          if (item.productId && item.quantity) {
            this.productStore.adjustStock(item.productId, item.quantity);
          }
          this.snackBar.open(`${item.productName} removed`, 'Dismiss', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Failed to delete item. Please try again.', 'Dismiss', {
            duration: 3000,
          });
        },
      });
    } else {
      this.pendingDeleteItemId.set(item._id);
    }
  }

  cancelDelete() {
    this.pendingDeleteItemId.set(null);
  }

  // ── Formatters ───────────────────────────────────────────────────────────

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
