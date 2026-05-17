import { Component, computed, Input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { inject } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Product } from '../../../../core/models/product.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SweetAlertService } from '../../../../core/services/sweet-alert.service';

@Component({
  selector: 'app-product-table',
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatPaginatorModule,
    StatusBadgeComponent,
  ],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.scss',
})
export class ProductTableComponent implements OnChanges {
  @Input() products: Product[] = [];

  private readonly sweetAlert = inject(SweetAlertService);

  // ── Pagination ────────────────────────────────────────────
  private readonly productsSignal = signal<Product[]>([]);
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly pagedProducts = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.productsSignal().slice(start, start + this.PAGE_SIZE);
  });

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  displayedColumns = [
    'select',
    'sku',
    // 'buyingPrice',
    'sellingPrice',
    'currentStock',
    'stockReorderStatus',
    'actions',
  ];
  selection = new SelectionModel<Product>(true, []);

  ngOnChanges() {
    this.productsSignal.set(this.products);
    this.pageIndex.set(0);
    this.selection.clear();
  }

  isAllSelected() {
    return this.selection.selected.length === this.products.length;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.products);
    }
  }

  formatCurrency(value: number): string {
    return `Ksh.${value.toFixed(2)}`;
  }

  onEdit(product: Product) {
    this.sweetAlert.info(`Edit: ${product.name}`);
  }

  onDelete(product: Product) {
    this.sweetAlert.success(`Deleted: ${product.name}`);
  }

  onView(product: Product) {
    this.sweetAlert.info(`Viewing: ${product.name}`);
  }
}
