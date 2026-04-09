import { Component, inject, computed, signal, Signal } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatButtonModule, MatIconModule, StatCardComponent, ProductTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly productStore = inject(productStore);
  private readonly dialog = inject(MatDialog);

  readonly products = this.productStore.products as Signal<any[]>;

  readonly lowStockCount = computed(
    () => this.productStore.products().filter((p) => p.stockReorderStatus === 'low').length,
  );
  readonly criticalStockCount = computed(
    () => this.productStore.products().filter((p) => p.stockReorderStatus === 'critical').length,
  );

  readonly activeCashiers = signal(3);
  readonly salesToday = signal(2450.0);

  openGenerateReport() {
    this.dialog.open(GenerateReportModalComponent, {
      width: '400px',
      disableClose: false,
      panelClass: 'pos-dialog',
    });
  }
}
