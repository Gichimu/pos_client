import { Component, computed, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { saleStore } from '../../../store/sales/sale.store';
import { userStore } from '../../../store/users/user.store';
import { productStore } from '../../../store/products/product.store';
import { shiftStore } from '../../../store/shifts/shift.store';
import { SaleItem } from '../../../core/models/sale.model';
import { User } from '../../../core/models/user.model';
import { Shift } from '../../../core/models/shift.model';
import { ReceiptService } from '../../../core/services/receipt.service';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import {
  PaymentMethodDialogComponent,
  PaymentMethodDialogData,
  PaymentMethodDialogResult,
} from './payment-method-dialog.component';
import { SaleDetailsDialogComponent } from './sale-details-dialog.component';
import moment from 'moment';

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
    MatCheckboxModule,
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  readonly salesStore = inject(saleStore);
  readonly userStore = inject(userStore);
  readonly productStore = inject(productStore);
  readonly shiftStore = inject(shiftStore);
  private readonly receiptService = inject(ReceiptService);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly dialog = inject(MatDialog);

  readonly today = new Date();

  readonly activeShift = computed(() => this.shiftStore.activeShift());
  readonly isLoading = computed(() => this.salesStore.isLoading());

  // ── Filters ──────────────────────────────────────────────────────────────
  filterStatus = signal<FilterStatus>('all');
  filterCashierId = signal<string | null>(null);

  /** Sale _id awaiting the two-step delete confirmation. */
  pendingDeleteSaleId = signal<string | null>(null);

  // ── Bulk selection ───────────────────────────────────────────────────────
  selectedIds = signal<Set<string>>(new Set<string>());

  readonly hasSelection = computed(() => this.selectedIds().size > 0);

  readonly selectedTotal = computed(() => {
    const ids = this.selectedIds();
    return this.salesStore
      .items()
      .filter((s) => s._id && ids.has(s._id))
      .reduce((sum, s) => sum + s.totalAmount, 0);
  });

  readonly pendingOnPage = computed(() => this.pagedItems().filter((s) => !s.confirmed));

  readonly allPendingOnPageSelected = computed(() => {
    const pending = this.pendingOnPage();
    if (pending.length === 0) return false;
    return pending.every((s) => this.selectedIds().has(s._id!));
  });

  readonly somePendingOnPageSelected = computed(() => {
    const pending = this.pendingOnPage();
    return pending.some((s) => this.selectedIds().has(s._id!)) && !this.allPendingOnPageSelected();
  });

  readonly totalPendingFiltered = computed(
    () => this.filteredItems().filter((s) => !s.confirmed).length,
  );

  readonly isGlobalSelectionActive = computed(() => {
    const total = this.totalPendingFiltered();
    return total > 0 && this.selectedIds().size === total;
  });

  readonly showGlobalSelectPrompt = computed(() => {
    return (
      this.allPendingOnPageSelected() &&
      !this.isGlobalSelectionActive() &&
      this.filteredItems().length > this.PAGE_SIZE
    );
  });

  readonly cashierOptions = computed(() =>
    this.userStore.users().map((u) => ({
      id: u._id!,
      name: `${u.firstName} ${u.lastName}`,
    })),
  );

  // readonly filteredItems = computed(() => {
  //   const status = this.filterStatus();
  //   const cashierId = this.filterCashierId();
  //   let result = this.salesStore.items();
  //   if (cashierId) {
  //     result = result.filter((sale) => {
  //       const c = (sale as any).cashierId;
  //       const id = typeof c === 'string' ? c : c?._id;
  //       return id === cashierId;
  //     });
  //   }
  //   if (status === 'confirmed') return result.filter((s) => s.confirmed);
  //   if (status === 'pending') return result.filter((s) => !s.confirmed);

  //   result = result.filter((s) => s.shiftId === this.activeShift()?._id);

  //   return result;
  // });
  readonly filteredItems = computed(() => {
    const currentShift = this.activeShift();

    // Hard Gate: If there is no active shift running right now, return an empty array instantly
    if (!currentShift || !currentShift._id) {
      return [];
    }

    console.log('Applying filters to sales items. Current shift:', currentShift);

    const status = this.filterStatus();
    const cashierId = this.filterCashierId();
    let result = this.salesStore.items();

    // 1. ALWAYS filter by the active open shift FIRST (No early returns can bypass this now)
    result = result.filter((s) => s.shiftId === currentShift._id);

    // 2. Filter by Cashier ID if selected
    if (cashierId) {
      result = result.filter((sale) => {
        const c = (sale as any).cashierId;
        const id = typeof c === 'string' ? c : c?._id;
        return id === cashierId;
      });
    }

    // 3. Finally, apply status variations right at the end of the pipeline
    if (status === 'confirmed') {
      return result.filter((s) => s.confirmed);
    }
    if (status === 'pending') {
      return result.filter((s) => !s.confirmed);
    }

    return result;
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  readonly PAGE_SIZE = 10;
  readonly pageIndex = signal(0);

  readonly pagedItems = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredItems().slice(start, start + this.PAGE_SIZE);
  });

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    // Persist selection across pages
  }

  // ── Stat cards ───────────────────────────────────────────────────────────
  readonly totalRevenue = computed(() =>
    this.filteredItems().reduce((sum, s) => sum + s.totalAmount, 0),
  );
  readonly cashRevenue = computed(() => {
    return this.filteredItems()
      .filter((s) => s.confirmed)
      .reduce((sum, s) => {
        const pm = (s as any).paymentMethod;
        if (pm === 'Cash') return sum + s.totalAmount;
        if (pm === 'Split') return sum + ((s as any).splitAmounts?.cashAmount || 0);
        return sum;
      }, 0);
  });
  readonly mpesaRevenue = computed(() => {
    return this.filteredItems()
      .filter((s) => s.confirmed)
      .reduce((sum, s) => {
        const pm = (s as any).paymentMethod;
        if (pm === 'M-Pesa') return sum + s.totalAmount;
        if (pm === 'Split') return sum + ((s as any).splitAmounts?.mpesaAmount || 0);
        return sum;
      }, 0);
  });
  readonly pdqRevenue = computed(() => {
    return this.filteredItems()
      .filter((s) => s.confirmed)
      .reduce((sum, s) => {
        const pm = (s as any).paymentMethod;
        if (pm === 'PDQ') return sum + s.totalAmount;
        return sum;
      }, 0);
  });
  readonly totalSalesCount = computed(() => this.filteredItems().length);
  readonly totalQty = computed(() =>
    this.filteredItems().reduce(
      (sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0),
      0,
    ),
  );
  readonly confirmedCount = computed(() => this.filteredItems().filter((s) => s.confirmed).length);
  readonly pendingCount = computed(() => this.filteredItems().filter((s) => !s.confirmed).length);

  // ── Payment method totals ────────────────────────────────────────────────
  readonly paymentTotals = computed(() => {
    const items = this.filteredItems().filter((s) => s.confirmed);
    const totals = {
      Cash: 0,
      'M-Pesa': 0,
      PDQ: 0,
    };

    items.forEach((sale) => {
      const pm = sale.paymentMethod;
      if (!pm) return;

      if (pm === 'Split') {
        totals.Cash += (sale as any).splitAmounts.cashAmount || 0;
        totals['M-Pesa'] += (sale as any).splitAmounts?.mpesaAmount || 0;
      } else if (pm === 'Cash' || pm === 'M-Pesa' || pm === 'PDQ') {
        totals[pm] += sale.totalAmount;
      }
    });

    return [
      { label: 'Cash', value: totals.Cash, icon: 'payments', class: 'cash' },
      { label: 'M-Pesa', value: totals['M-Pesa'], icon: 'phone_android', class: 'mpesa' },
      { label: 'PDQ/Card', value: totals.PDQ, icon: 'credit_card', class: 'pdq' },
    ];
  });

  // ── Columns ──────────────────────────────────────────────────────────────
  readonly displayedColumns = [
    'select',
    'saleId',
    'cashier',
    'details',
    'total',
    'date',
    'status',
    'actions',
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const startDate = moment().subtract(2, 'day').startOf('day').toISOString();
    const endDate = moment().endOf('day').toISOString();
    console.log('loading sales with active shift filter:', this.activeShift());
    this.filterStatus.set('all');
    this.filterCashierId.set(null);
    this.pageIndex.set(0);
    this.salesStore.loadSales({ startDate, endDate });
  }

  // ── Filter helpers ───────────────────────────────────────────────────────
  setFilter(status: FilterStatus) {
    this.filterStatus.set(status);
    this.pageIndex.set(0);
    this.clearSelection();
  }

  setCashierFilter(cashierId: string | null) {
    this.filterCashierId.set(cashierId);
    this.pageIndex.set(0);
    this.clearSelection();
    this.salesStore.loadSales({ cashierId });
  }

  // ── Row helpers ───────────────────────────────────────────────────────────
  getCashierName(sale: SaleItem): string {
    const c = (sale as any).cashierId;
    if (!c) return 'Unknown';
    const id = typeof c === 'string' ? c : c._id;
    const user = this.userStore.users().find((u) => u._id === id);
    if (user) return `${user.firstName} ${user.lastName}`;
    if (typeof c === 'object')
      return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Unknown';
    return 'Unknown';
  }

  getCashierAvatar(sale: SaleItem): string {
    const c = (sale as any).cashierId;
    const id = typeof c === 'string' ? c : (c?._id ?? 'user');
    return `https://i.pravatar.cc/32?u=${id}`;
  }

  /** Total number of units in the sale (sum of item quantities). */
  getItemCount(sale: SaleItem): number {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSaleDate(sale: SaleItem): Date {
    return new Date((sale as any).createdAt ?? Date.now());
  }

  getSaleIdLabel(sale: SaleItem): string {
    return sale.saleId ? `#${sale.saleId}` : `#${(sale._id ?? '').slice(-6).toUpperCase()}`;
  }

  // ── Details ─────────────────────────────────────────────────────────────

  openDetails(sale: SaleItem): void {
    this.dialog.open(SaleDetailsDialogComponent, {
      data: { sales: [sale] },
      width: '600px',
      maxWidth: '95vw',
    });
  }

  viewSelectedDetails(): void {
    const ids = this.selectedIds();
    const selectedSales = this.salesStore.items().filter((s) => s._id && ids.has(s._id));

    console.log('Viewing details for selected sales:', selectedSales);

    this.dialog.open(SaleDetailsDialogComponent, {
      data: { sales: selectedSales },
      width: '600px',
      maxWidth: '95vw',
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  isShiftClosed(sale: SaleItem): boolean {
    if (!sale.shiftId) return false;
    const shift = (this.shiftStore.shifts() as Shift[]).find((s) => s._id === sale.shiftId);
    return (shift as any)?.status === 'Closed';
  }

  toggleConfirm(sale: SaleItem): void {
    if (sale.confirmed) {
      this.salesStore.unconfirmSale(sale._id!).subscribe({
        next: () => this.sweetAlert.info(`Sale ${this.getSaleIdLabel(sale)} marked as pending`),
        error: () => this.sweetAlert.error('Failed to unconfirm sale. Please try again.'),
      });
      return;
    }

    const dialogRef = this.dialog.open<
      PaymentMethodDialogComponent,
      PaymentMethodDialogData,
      PaymentMethodDialogResult
    >(PaymentMethodDialogComponent, {
      data: {
        saleId: sale._id!,
        saleIdLabel: this.getSaleIdLabel(sale),
        totalAmount: sale.totalAmount,
      },
      width: '560px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const splitAmounts =
        result.paymentMethod === 'Split'
          ? { cashAmount: result.cashAmount!, mpesaAmount: result.mpesaAmount! }
          : undefined;

      this.salesStore.confirmSale(sale._id!, result.paymentMethod, splitAmounts).subscribe({
        next: () =>
          this.sweetAlert.success(
            `Sale ${this.getSaleIdLabel(sale)} confirmed via ${result.paymentMethod}`,
          ),
        error: () => this.sweetAlert.error('Failed to confirm sale. Please try again.'),
      });
    });
  }

  getSalePaymentMethod(sale: SaleItem): string | null {
    return (sale as any).paymentMethod ?? null;
  }

  deleteSale(sale: SaleItem): void {
    if (this.pendingDeleteSaleId() === sale._id) {
      this.pendingDeleteSaleId.set(null);
      this.salesStore.deleteSale(sale._id!).subscribe({
        next: () => this.sweetAlert.success('Sale deleted successfully'),
        error: () => this.sweetAlert.error('Failed to delete sale. Please try again.'),
      });
    } else {
      this.pendingDeleteSaleId.set(sale._id!);
    }
  }

  cancelDelete(): void {
    this.pendingDeleteSaleId.set(null);
  }

  voidSale(sale: SaleItem): void {
    Swal.fire({
      title: 'Void this sale?',
      html: `Sale <strong>${this.getSaleIdLabel(sale)}</strong> will be voided,
             stock will be restored, and a void receipt will be printed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, void it',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.salesStore.voidSale(sale._id!).subscribe({
        next: () => {
          // Restore stock for every item in the voided sale
          sale.items.forEach((item) => {
            if (item.productId && item.quantity) {
              this.productStore.adjustStock(item.productId, item.quantity);
            }
          });

          // Print void receipt
          const cashier = this.resolveCashier(sale);
          const shift = this.resolveShift(sale);
          this.receiptService.printVoid({ sale, cashier, shift });

          this.sweetAlert.success(`Sale ${this.getSaleIdLabel(sale)} voided — stock restored`);
        },
        error: () => this.sweetAlert.error('Failed to void sale. Please try again.'),
      });
    });
  }

  // ── Bulk selection actions ────────────────────────────────────────────────

  toggleRow(sale: SaleItem): void {
    if (sale.confirmed) return;
    const next = new Set(this.selectedIds());
    if (next.has(sale._id!)) {
      next.delete(sale._id!);
    } else {
      next.add(sale._id!);
    }
    this.selectedIds.set(next);
  }

  toggleAll(): void {
    const pending = this.pendingOnPage();
    const allSelected = this.allPendingOnPageSelected();
    const next = new Set(this.selectedIds());
    if (allSelected) {
      pending.forEach((s) => next.delete(s._id!));
    } else {
      pending.forEach((s) => next.add(s._id!));
    }
    this.selectedIds.set(next);
  }

  selectAllGlobal(): void {
    const next = new Set<string>();
    this.filteredItems()
      .filter((s) => !s.confirmed)
      .forEach((s) => next.add(s._id!));
    this.selectedIds.set(next);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set<string>());
  }

  confirmSelection(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    const combinedTotal = this.salesStore
      .items()
      .filter((s) => s._id && ids.includes(s._id))
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const dialogRef = this.dialog.open<
      PaymentMethodDialogComponent,
      PaymentMethodDialogData,
      PaymentMethodDialogResult
    >(PaymentMethodDialogComponent, {
      data: {
        saleId: '',
        saleIdLabel: `${ids.length} sale${ids.length > 1 ? 's' : ''}`,
        totalAmount: combinedTotal,
        isBulk: true,
        bulkCount: ids.length,
      },
      width: '560px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.salesStore.confirmBulk(ids, result.paymentMethod).subscribe({
        next: () => {
          this.sweetAlert.success(
            `${ids.length} sale${ids.length > 1 ? 's' : ''} confirmed via ${result.paymentMethod}`,
          );
          this.clearSelection();
        },
        error: () => this.sweetAlert.error('Some sales failed to confirm. Please try again.'),
      });
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private resolveCashier(sale: SaleItem): User | null {
    const c = (sale as any).cashierId;
    if (!c) return null;
    const id = typeof c === 'string' ? c : c._id;
    return this.userStore.users().find((u) => u._id === id) ?? null;
  }

  private resolveShift(sale: SaleItem): Shift | null {
    if (!sale.shiftId) return null;
    return (this.shiftStore.shifts() as Shift[]).find((s) => s._id === sale.shiftId) ?? null;
  }

  getUser(userId: string) {
    return this.userStore.users().find((u) => u._id === userId);
  }

  // ── Formatters ───────────────────────────────────────────────────────────
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

  formatDate(date: Date): string {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getProductName(productId: string): string {
    const p = this.productStore.products().find((product) => product._id === productId);
    return p ? p.name : 'Unknown Product';
  }
}
