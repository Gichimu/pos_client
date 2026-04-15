import { Component, inject, computed, signal, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ProductTableComponent } from './product-table/product-table.component';
import { GenerateReportModalComponent } from './generate-report-modal/generate-report-modal.component';
import { productStore } from '../../../store/products/product.store';
import { userStore } from '../../../store/users/user.store';
import { saleStore } from '../../../store/sales/sale.store';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatButtonModule, MatIconModule, StatCardComponent, ProductTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly productStore = inject(productStore);
  private readonly dialog = inject(MatDialog);
  readonly userStore = inject(userStore);
  readonly salesStore = inject(saleStore);

  readonly products = this.productStore.products as Signal<any[]>;

  readonly lowStockCount = computed(
    () => this.productStore.products().filter((p) => p.stockReorderStatus === 'low').length,
  );
  readonly criticalStockCount = computed(
    () => this.productStore.products().filter((p) => p.stockReorderStatus === 'critical').length,
  );

  readonly activeCashiers = computed(
    () =>
      this.userStore
        .users()
        .filter((u) => u.roles.includes('cashier'))
        .filter((cashier) => cashier.status === 'active').length,
  );
  readonly salesToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.salesStore
      .items()
      .filter((s) => {
        if (!s.createdAt) return false;
        const d = new Date(s.createdAt);
        return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === today;
      })
      .flatMap((s) => s.items)
      .filter((item) => item.confirmed)
      .reduce((sum, item) => sum + item.subTotal, 0);
  });

  openGenerateReport() {
    this.dialog.open(GenerateReportModalComponent, {
      width: '400px',
      disableClose: false,
      panelClass: 'pos-dialog',
    });
  }
}
