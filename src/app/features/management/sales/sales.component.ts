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

const today = new Date();
const h = (hour: number, min: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, min);

const MOCK_SALES: any[] = [
  {
    _id: 's1',
    productId: '1',
    productName: 'Coffee Bocat',
    productSku: 'COF-001',
    productImage: 'https://picsum.photos/seed/coffee1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 4,
    unitPrice: 3.0,
    totalAmount: 12.0,
    subTotal: 12.0,
    transactionDate: h(8, 15),
    confirmed: false,
  },
  {
    _id: 's2',
    productId: '2',
    productName: 'Switch Sandwich',
    productSku: 'SAN-001',
    productImage: 'https://picsum.photos/seed/sandwich1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 3,
    unitPrice: 2.0,
    totalAmount: 6.0,
    subTotal: 6.0,
    transactionDate: h(8, 42),
    confirmed: false,
  },
  {
    _id: 's3',
    productId: '5',
    productName: 'Beat Buffein',
    productSku: 'BEV-002',
    productImage: 'https://picsum.photos/seed/beat1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 6,
    unitPrice: 3.0,
    totalAmount: 18.0,
    subTotal: 18.0,
    transactionDate: h(9, 10),
    confirmed: true,
  },
  {
    _id: 's4',
    productId: '8',
    productName: 'Latte Special',
    productSku: 'BEV-003',
    productImage: 'https://picsum.photos/seed/latte1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 2,
    unitPrice: 4.5,
    totalAmount: 9.0,
    subTotal: 9.0,
    transactionDate: h(9, 35),
    confirmed: true,
  },
  {
    _id: 's5',
    productId: '3',
    productName: 'Flowny Pastry',
    productSku: 'PAS-001',
    productImage: 'https://picsum.photos/seed/pastry1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 5,
    unitPrice: 3.0,
    totalAmount: 15.0,
    subTotal: 15.0,
    transactionDate: h(10, 5),
    confirmed: false,
  },
  {
    _id: 's6',
    productId: '6',
    productName: 'Pastry Iclt',
    productSku: 'PAS-003',
    productImage: 'https://picsum.photos/seed/pastry3/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 7,
    unitPrice: 4.0,
    totalAmount: 28.0,
    subTotal: 28.0,
    transactionDate: h(10, 22),
    confirmed: false,
  },
  {
    _id: 's7',
    productId: '7',
    productName: 'Sandwicies',
    productSku: 'SAN-002',
    productImage: 'https://picsum.photos/seed/sandwich2/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 3,
    unitPrice: 4.0,
    totalAmount: 12.0,
    subTotal: 12.0,
    transactionDate: h(11, 0),
    confirmed: false,
  },
  {
    _id: 's8',
    productId: '1',
    productName: 'Coffee Bocat',
    productSku: 'COF-001',
    productImage: 'https://picsum.photos/seed/coffee1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 8,
    unitPrice: 3.0,
    totalAmount: 24.0,
    subTotal: 24.0,
    transactionDate: h(11, 30),
    confirmed: false,
  },
  {
    _id: 's9',
    productId: '4',
    productName: 'Pastry',
    productSku: 'PAS-002',
    productImage: 'https://picsum.photos/seed/pastry2/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 4,
    unitPrice: 3.0,
    totalAmount: 12.0,
    subTotal: 12.0,
    transactionDate: h(12, 15),
    confirmed: false,
  },
  {
    _id: 's10',
    productId: '5',
    productName: 'Beat Buffein',
    productSku: 'BEV-002',
    productImage: 'https://picsum.photos/seed/beat1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 3,
    unitPrice: 3.0,
    totalAmount: 9.0,
    subTotal: 9.0,
    transactionDate: h(13, 0),
    confirmed: false,
  },
];

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

  /** The currently open shift, or null. */
  readonly activeShift = computed(() => this.shiftStore.activeShift());

  readonly today = new Date();

  /** Mutable list of sale items — confirmed state is toggled in-place. */
  // items = signal<any[]>(MOCK_SALES);

  // Assuming 'allSales' is your array of nested objects from Screenshot 1
  items = computed(
    () =>
      this.salesStore.items()?.flatMap((sale: any) =>
        sale.items.map((item: any) => ({
          _id: item._id, // Using the sub-item ID
          parentSaleId: sale._id, // Reference to the parent sale
          shiftId: sale.shiftId ?? null, // Forward shift id for lock checks
          saleId: sale.saleId,
          productId: item.productId,
          productName: this.getProduct(item.productId)?.name || 'Unknown Product', // Assuming you have this or need to look it up
          productSku: this.getProduct(item.productId)?.name || 'N/A',
          productImage: `https://picsum.photos/seed/${item.productId}/60/60`,
          cashierId: sale.cashierId?._id,
          cashierName:
            this.getUser(sale.cashierId?._id)?.firstName +
              ' ' +
              this.getUser(sale.cashierId?._id)?.lastName || 'Unknown',
          cashierAvatar: `https://i.pravatar.cc/32?u=${sale.cashierId?._id}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.subTotal,
          subTotal: item.subTotal,
          transactionDate: new Date(sale.createdAt),
          confirmed: item.confirmed,
        })),
      ) || [],
  );

  /** Active status filter. */
  filterStatus = signal<FilterStatus>('all');

  /** Line-item _id currently awaiting delete confirmation (two-step inline confirm). */
  pendingDeleteItemId = signal<string | null>(null);

  /** Active cashier filter — null means "All Cashiers". */
  filterCashierId = signal<string | null>(null);

  /** Cashier list sourced from the full user store — stable across page changes. */
  readonly cashierOptions = computed(() =>
    this.userStore
      .users()
      // .filter((u) => u.role === 'cashier') --- IGNORE ---
      .map((u) => ({
        id: u._id!,
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.avatar ?? '',
      })),
  );

  // ── Pagination (read from store) ─────────────────────────────────────────

  readonly currentPage = computed(() => this.salesStore.currentPage());
  readonly totalPages = computed(() => this.salesStore.totalPages());
  readonly totalItems = computed(() => this.salesStore.totalItems());
  readonly pageSize = computed(() => this.salesStore.pageSize());
  readonly isLoading = computed(() => this.salesStore.isLoading());

  // ── Computed summary stats ───────────────────────────────────────────────

  readonly totalRevenue = computed(
    () => this.items()?.reduce((sum, i) => sum + i.totalAmount, 0) || 0,
  );

  readonly totalQty = computed(() => this.items()?.reduce((sum, i) => sum + i.quantity, 0) || 0);

  readonly confirmedCount = computed(() => this.items()?.filter((i) => i.confirmed).length || 0);
  readonly pendingCount = computed(() => this.items()?.filter((i) => !i.confirmed).length || 0);

  readonly allConfirmed = computed(() => {
    const list = this.items();
    return list?.length > 0 && list.every((i) => i.confirmed);
  });

  // ── Filtered list for table ──────────────────────────────────────────────

  ngOnInit(): void {
    // Reset local filters and reload page 1 every time this route is entered.
    // The store is a root singleton so its own onInit only fires once at app startup;
    // this is the correct place to trigger a fresh fetch on each navigation.
    this.filterStatus.set('all');
    this.filterCashierId.set(null);
    this.salesStore.loadPage(1, null);
  }

  readonly filteredItems = computed(() => {
    const status = this.filterStatus();
    const cashierId = this.filterCashierId();
    let result = this.items();
    if (cashierId) result = result.filter((i) => i.cashierId === cashierId);
    if (status === 'confirmed') return result.filter((i) => i.confirmed);
    if (status === 'pending') return result.filter((i) => !i.confirmed);
    return result;
  });

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

  // ── Actions ─────────────────────────────────────────────────────────────

  /**
   * Returns true when the shift that owns this item is Closed.
   * Items with no shiftId are considered unlocked (backward compat).
   */
  isShiftClosed(item: any): boolean {
    if (!item.shiftId) return false;
    const shift = this.shiftStore.shifts().find((s) => s._id === item.shiftId);
    return shift?.status === 'Closed';
  }

  setFilter(status: FilterStatus) {
    this.filterStatus.set(status);
  }

  setCashierFilter(cashierId: string | null) {
    this.filterCashierId.set(cashierId);
    this.salesStore.loadPage(1, cashierId);
  }

  onPageChange(event: PageEvent) {
    // pageIndex is 0-based in Material Paginator
    this.salesStore.loadPage(event.pageIndex + 1, this.filterCashierId());
  }

  getUser(userId: String) {
    return this.userStore.users().find((user) => user._id === userId);
  }

  getProduct(productId: String) {
    return this.productStore.products().find((product) => product._id === productId);
  }

  toggleConfirm(item: any) {
    if (item.confirmed) {
      // Undo is not gated — could be extended later
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
      console.log('payment method result', result, item._id, item.parentSaleId);
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
      // Second click — confirmed, proceed with deletion
      this.pendingDeleteItemId.set(null);
      this.salesStore.deleteLineItem(item._id, item.parentSaleId).subscribe({
        next: () => {
          // Restore inventory for the removed line item
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
      // First click — enter confirmation state for this item
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
