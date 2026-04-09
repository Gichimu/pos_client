// Inventory CRUD component
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectProducts } from '../../../store/products/products.selectors';
import { ProductsActions } from '../../../store/products/products.actions';
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

@Component({
  selector: 'app-inventory',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  private readonly store = inject(Store);
  private readonly categoryStore = inject(CategoryStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly products = toSignal(this.store.select(selectProducts), { initialValue: [] });

  readonly totalCount = computed(() => this.products().length);
  readonly lowStockCount = computed(() => this.products().filter((p) => p.currentStock < 5).length);
  readonly outOfStock = computed(() => this.products().filter((p) => p.currentStock === 0).length);

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
      ? this.products().filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q),
        )
      : this.products();
  });

  onSearch(value: string) {
    this.searchQuery.set(value);
  }

  formatCurrency(v: number) {
    return `$${v.toFixed(2)}`;
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
        this.store.dispatch(ProductsActions.addProduct({ product }));
        this.snackBar.open(`${product.name} added to inventory`, 'Dismiss', { duration: 3000 });
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
        this.store.dispatch(ProductsActions.updateProduct({ product: updated }));
        this.snackBar.open(`${updated.name} updated`, 'Dismiss', { duration: 3000 });
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
        this.store.dispatch(ProductsActions.deleteProduct({ id: product.id }));
        this.snackBar.open(`${product.name} removed`, 'Dismiss', { duration: 3000 });
      }
    });
  }
}
