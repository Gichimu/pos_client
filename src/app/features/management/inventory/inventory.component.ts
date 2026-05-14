// Inventory CRUD component
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
  InventoryFormModalComponent,
  ProductFormData,
} from './inventory-form-modal/inventory-form-modal.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ManageCategoriesModalComponent } from './manage-categories-modal/manage-categories-modal.component';
import { CategoryStore } from '../../../store/categories/category.store';
import { productStore } from '../../../store/products/product.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { requisitionStore } from '../../../store/requisitions/requisition.store';
import { authStore } from '../../../store/auth/auth.store';
import { RbacAllow } from '../../../core/directives/rbac-allow';

@Component({
  selector: 'app-inventory',
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
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  private readonly store = inject(productStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly reqStore = inject(requisitionStore);
  private readonly auth = inject(authStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.store.loadProducts();
    // Apply filter from query params (e.g. when navigated from dashboard or notifications)
    const filterParam = this.route.snapshot.queryParamMap.get('filter');
    if (filterParam === 'low' || filterParam === 'critical') {
      this.stockFilter.set(filterParam);
    }
  }

  /** Only show sellable menu products (exclude raw-stock items). */
  private readonly menuProducts = computed(() =>
    this.store.products().filter((p) => !p.productType || p.productType === 'menu'),
  );

  readonly totalCount = computed(() => this.menuProducts().length);
  readonly lowStockCount = computed(
    () => this.menuProducts().filter((p) => p.stockReorderStatus === 'low').length,
  );
  readonly criticalStockCount = computed(
    () => this.menuProducts().filter((p) => p.stockReorderStatus === 'critical').length,
  );

  readonly displayedColumns = [
    'image',
    'name',
    'category',
    'buyingPrice',
    'sellingPrice',
    'currentStock',
    'stockReorderStatus',
    'actions',
  ];

  searchQuery = signal('');
  /** Active stock-status filter for the pill tabs. */
  readonly stockFilter = signal<'all' | 'low' | 'critical'>('all');

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const f = this.stockFilter();
    let products = this.menuProducts();

    // Apply stock filter
    if (f === 'low') products = products.filter((p) => p.stockReorderStatus === 'low');
    else if (f === 'critical') products = products.filter((p) => p.stockReorderStatus === 'critical');

    // Apply search query
    if (q) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
    return products;
  });

  setStockFilter(filter: 'all' | 'low' | 'critical'): void {
    this.stockFilter.set(filter);
    this.pageIndex.set(0);
  }

  // ── Pagination ────────────────────────────────────────────
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly pagedProducts = computed(() => {
    console.log('filtered products', this.filteredProducts());
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + this.PAGE_SIZE);
  });

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  formatCurrency(v: number) {
    return `Ksh.${v.toFixed(2)}`;
  }

  getCategoryName(categoryId: string) {
    const category = this.categoryStore.categories().find((c) => c._id === categoryId);
    return category ? category.name : 'Unknown';
  }

  openManageCategoriesDialog() {
    this.dialog.open(ManageCategoriesModalComponent, { width: '460px', maxWidth: '95vw' });
  }

  openAddDialog() {
    const ref = this.dialog.open<InventoryFormModalComponent, ProductFormData, Product>(
      InventoryFormModalComponent,
      { data: {}, maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((product) => {
      if (product) {
        this.store.addProduct(product).subscribe({
          next: () => {
            this.sweetAlert.success(`${product.name} added to inventory`);
          },
          error: (error: any) => {
            this.sweetAlert.error(
              `Failed to add product: ${error.error ? error.error.error : error.message}`,
            );
          },
        });
      }
    });
  }

  openEditDialog(product: Product) {
    const ref = this.dialog.open<InventoryFormModalComponent, ProductFormData, Product>(
      InventoryFormModalComponent,
      { data: { product }, maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        // Detect a stock addition and record it as a requisition
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
        this.sweetAlert.success(`${updated.name} updated`);
      }
    });
  }

  confirmDelete(product: Product) {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Product',
          message: `Are you sure you want to remove "${product.name}" from inventory? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
        width: '380px',
      },
    );
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteProduct(product._id!);
        this.sweetAlert.success(`${product.name} removed`);
      }
    });
  }
}
