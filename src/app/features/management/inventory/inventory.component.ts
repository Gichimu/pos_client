// Inventory CRUD component
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
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
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  private readonly store = inject(productStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly totalCount = computed(() => this.store.products().length);
  readonly lowStockCount = computed(
    () => this.store.products().filter((p) => p.currentStock < 5).length,
  );
  readonly outOfStock = computed(
    () => this.store.products().filter((p) => p.currentStock === 0).length,
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

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.store
          .products()
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q),
          )
      : this.store.products();
  });

  // ── Pagination ────────────────────────────────────────────
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

  getCategoryName(categoryId: string) {
    const category = this.categoryStore.categories().find((c) => c._id === categoryId);
    return category ? category.name : 'Unknown';
  }

  openManageCategoriesDialog() {
    this.dialog.open(ManageCategoriesModalComponent, { width: '460px' });
  }

  openAddDialog() {
    const ref = this.dialog.open<InventoryFormModalComponent, ProductFormData, Product>(
      InventoryFormModalComponent,
      { data: {} },
    );
    ref.afterClosed().subscribe((product) => {
      if (product) {
        this.store.addProduct(product).subscribe({
          next: () => {
            this.sweetAlert.success(`${product.name} added to inventory`);
          },
          error: (error: any) => {
            this.sweetAlert.error(`Failed to add product: ${error.error ? error.error.error : error.message}`);
          },
        });
      }
    });
  }

  openEditDialog(product: Product) {
    const ref = this.dialog.open<InventoryFormModalComponent, ProductFormData, Product>(
      InventoryFormModalComponent,
      { data: { product } },
    );
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
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
