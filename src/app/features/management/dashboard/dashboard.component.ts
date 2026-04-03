import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ProductTableComponent } from './product-table/product-table.component';
import { GenerateReportModalComponent } from './generate-report-modal/generate-report-modal.component';
import { selectProducts } from '../../../store/products/products.selectors';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    StatCardComponent,
    ProductTableComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly products = toSignal(this.store.select(selectProducts), {
    initialValue: [],
  });

  readonly lowStockCount = computed(
    () => this.products().filter((p) => p.currentStock < 5).length
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
