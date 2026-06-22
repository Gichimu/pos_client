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
import { productStore } from '../../../store/products/product.store';
import { requisitionStore } from '../../../store/requisitions/requisition.store';
import { authStore } from '../../../store/auth/auth.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { StockAdjustDialogComponent } from './stock-adjust-dialog.component';
import {
  RawStockFormModalComponent,
  RawStockFormData,
} from './raw-stock-form-modal/raw-stock-form-modal.component';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ProductHistoryDialogComponent } from '../../management/inventory/product-history-dialog/product-history-dialog.component';
import { RbacAllow } from '../../../core/directives/rbac-allow';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    StatusBadgeComponent,
    RawStockFormModalComponent,
    ProductHistoryDialogComponent,
    RbacAllow,
  ],
  templateUrl: './stock-management.component.html',
  styleUrl: './stock-table.scss',
})
export class StockManagementComponent implements OnInit {
  private readonly store = inject(productStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly reqStore = inject(requisitionStore);
  private readonly auth = inject(authStore);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<'add' | 'deduct'>('add');

  ngOnInit(): void {
    this.store.loadProducts();

    const filterParam = this.route.snapshot.queryParamMap.get('filter');
    if (filterParam === 'low' || filterParam === 'critical') {
      this.stockFilter.set(filterParam as 'low' | 'critical');
    }

    const modeParam = this.route.snapshot.queryParamMap.get('mode');
    if (modeParam === 'add' || modeParam === 'deduct') {
      this.mode.set(modeParam);
    }
  }

  readonly displayedColumns = ['name', 'category', 'currentStock', 'stockReorderStatus', 'actions'];

  searchQuery = signal('');
  readonly stockFilter = signal<'all' | 'low' | 'critical'>('all');
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const f = this.stockFilter();
    let products = this.store.products().filter((p) => p.productType === 'raw-stock');

    if (f === 'low') products = products.filter((p) => p.stockReorderStatus === 'low');
    else if (f === 'critical')
      products = products.filter((p) => p.stockReorderStatus === 'critical');

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

  readonly pagedProducts = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + this.PAGE_SIZE);
  });

  setMode(m: 'add' | 'deduct') {
    this.mode.set(m);
    this.pageIndex.set(0);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  openHistoryDialog(product: Product) {
    this.dialog.open(ProductHistoryDialogComponent, {
      data: { product },
      width: '640px',
      maxWidth: '95vw',
    });
  }

  setStockFilter(filter: 'all' | 'low' | 'critical'): void {
    this.stockFilter.set(filter);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  openNewItemDialog() {
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

  openAdjustDialog(product: Product) {
    const mode = this.mode();
    const ref = this.dialog.open(StockAdjustDialogComponent, {
      data: { product, mode },
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((delta: number | undefined) => {
      if (delta) {
        const updatedProduct = {
          ...product,
          currentStock: (product.currentStock ?? 0) + delta,
        };

        if (mode === 'add') {
          // Record requisition
          this.reqStore.addRequisition({
            productId: updatedProduct._id ?? '',
            productName: updatedProduct.name,
            quantity: delta,
            addedBy: this.auth.user()?._id,
            addedAt: new Date(),
          });
        }

        this.store.updateProduct(updatedProduct);
        const msg =
          mode === 'add'
            ? `Added ${delta} ${product.unit || ''} to ${product.name}`
            : `Deducted ${Math.abs(delta)} ${product.unit || ''} from ${product.name}`;
        this.sweetAlert.success(msg);
      }
    });
  }
}
