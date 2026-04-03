import { Component, Input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Product } from '../../../../core/models/product.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

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
    StatusBadgeComponent,
  ],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.scss',
})
export class ProductTableComponent implements OnChanges {
  @Input() products: Product[] = [];

  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = ['select', 'sku', 'buyingPrice', 'sellingPrice', 'currentStock', 'stockReorderStatus', 'actions'];
  selection = new SelectionModel<Product>(true, []);

  ngOnChanges() {
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
    return `$${value.toFixed(2)}`;
  }

  onEdit(product: Product) {
    this.snackBar.open(`Edit: ${product.name}`, 'Dismiss', { duration: 2500 });
  }

  onDelete(product: Product) {
    this.snackBar.open(`Deleted: ${product.name}`, 'Undo', { duration: 3000 });
  }

  onView(product: Product) {
    this.snackBar.open(`Viewing: ${product.name}`, 'Close', { duration: 2500 });
  }
}
