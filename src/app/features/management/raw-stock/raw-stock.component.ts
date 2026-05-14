import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import {
  RawStockFormModalComponent,
  RawStockFormData,
} from './raw-stock-form-modal/raw-stock-form-modal.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { productStore } from '../../../store/products/product.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { RbacAllow } from '../../../core/directives/rbac-allow';
import { RAW_STOCK_CATEGORIES } from './raw-stock-form-modal/raw-stock-form-modal.component';
import { requisitionStore } from '../../../store/requisitions/requisition.store';
import { authStore } from '../../../store/auth/auth.store';

@Component({
  selector: 'app-raw-stock',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    StatusBadgeComponent,
    RbacAllow,
  ],
  templateUrl: './raw-stock.component.html',
  styleUrl: './raw-stock.component.scss',
})
export class RawStockComponent implements OnInit {
  private readonly store = inject(productStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly reqStore = inject(requisitionStore);
  private readonly auth = inject(authStore);
  private readonly route = inject(ActivatedRoute);

  /** Active stock-status filter (driven by query param or pill clicks). */
  readonly stockFilter = signal<'all' | 'low' | 'critical'>('all');

  ngOnInit(): void {
    this.store.loadProducts();
    const filterParam = this.route.snapshot.queryParamMap.get('filter');
    if (filterParam === 'low' || filterParam === 'critical') {
      this.stockFilter.set(filterParam);
    }
  }

  setStockFilter(f: 'all' | 'low' | 'critical'): void {
    this.stockFilter.set(f);
    this.pageIndex.set(0);
  }

  /** Only raw-stock tagged products. */
  private readonly rawProducts = computed(() =>
    this.store.products().filter((p) => p.productType === 'raw-stock'),
  );

  readonly totalCount = computed(() => this.rawProducts().length);
  readonly lowStockCount = computed(
    () => this.rawProducts().filter((p) => p.currentStock < 5).length,
  );
  readonly outOfStock = computed(
    () => this.rawProducts().filter((p) => p.currentStock === 0).length,
  );

  readonly displayedColumns = ['name', 'category', 'buyingPrice', 'currentStock', 'stockReorderStatus', 'actions'];

  searchQuery = signal('');

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const f = this.stockFilter();
    let products = this.rawProducts();

    if (f === 'low') products = products.filter((p) => p.stockReorderStatus === 'low');
    else if (f === 'critical') products = products.filter((p) => p.stockReorderStatus === 'critical');

    if (q) {
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
      );
    }
    return products;
  });

  // ── Pagination ──────────────────────────────────────────
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly pagedProducts = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + this.PAGE_SIZE);
  });

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  formatCurrency(v: number) {
    return `Ksh.${v.toFixed(2)}`;
  }

  resolveCategoryLabel(categoryValue: string): string {
    return RAW_STOCK_CATEGORIES.find((c) => c.value === categoryValue)?.label ?? categoryValue;
  }

  openAddDialog() {
    const ref = this.dialog.open<RawStockFormModalComponent, RawStockFormData, Product>(
      RawStockFormModalComponent,
      { data: {}, maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((product) => {
      if (product) {
        this.store.addProduct(product).subscribe({
          next: () => {
            this.sweetAlert.success(`"${product.name}" added to raw stock`);
          },
          error: (error: any) => {
            this.sweetAlert.error(
              `Failed to add item: ${error.error ? error.error.error : error.message}`,
            );
          },
        });
      }
    });
  }

  openEditDialog(product: Product) {
    const ref = this.dialog.open<RawStockFormModalComponent, RawStockFormData, Product>(
      RawStockFormModalComponent,
      { data: { product }, maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        const stockDelta = updated.currentStock - (product.currentStock ?? 0);
        if (stockDelta > 0) {
          this.reqStore.addRequisition({
            productId: updated._id ?? '',
            productName: updated.name,
            quantity: stockDelta,
            addedBy: this.auth.user()?._id,
            addedAt: new Date(),
          });
        }
        this.store.updateProduct(updated);
        this.sweetAlert.success(`"${updated.name}" updated`);
      }
    });
  }

  confirmDelete(product: Product) {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Remove Raw Stock Item',
          message: `Are you sure you want to remove "${product.name}" from raw stock? This cannot be undone.`,
          confirmLabel: 'Remove',
          danger: true,
        },
        width: '380px',
      },
    );
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteProduct(product._id!);
        this.sweetAlert.success(`"${product.name}" removed`);
      }
    });
  }
}
