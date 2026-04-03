import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-inventory',
  imports: [MatIconModule],
  template: `
    <div class="stub-page">
      <div class="stub-page__icon">
        <mat-icon>inventory_2</mat-icon>
      </div>
      <h2 class="stub-page__title">Inventory</h2>
      <p class="stub-page__desc">Manage your products, categories, and stock levels here.</p>
    </div>
  `,
  styles: [`
    .stub-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      gap: 12px;
    }
    .stub-page__icon {
      width: 80px;
      height: 80px;
      background: #dbeafe;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: #2563eb; }
    }
    .stub-page__title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .stub-page__desc { color: #64748b; font-size: 0.9rem; max-width: 320px; margin: 0; }
  `],
})
export class InventoryComponent {}
