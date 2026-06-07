import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { productStore } from '../../../store/products/product.store';

@Component({
  selector: 'app-store-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './store-dashboard.component.html',
  styleUrl: './store-dashboard.component.scss',
})
export class StoreDashboardComponent {
  productStore = inject(productStore);
  private readonly router = inject(Router);

  private readonly rawStockProducts = computed(() =>
    this.productStore.products().filter((p) => p.productType === 'raw-stock'),
  );

  readonly totalItems = computed(() => this.rawStockProducts().length);
  readonly lowStockItems = computed(
    () =>
      this.rawStockProducts().filter(
        (p) => p.currentStock < p.stockReorderLevel && p.currentStock > 0.3 * p.stockReorderLevel,
      ).length,
  );
  readonly criticalStockItems = computed(
    () =>
      this.rawStockProducts().filter(
        (p) => p.currentStock < p.stockReorderLevel && p.currentStock < 0.3 * p.stockReorderLevel,
      ).length,
  );

  navigateToStock(filter?: string): void {
    this.router.navigate(['/store/inventory'], { queryParams: filter ? { filter, mode: 'add' } : { mode: 'add' } });
  }
}
