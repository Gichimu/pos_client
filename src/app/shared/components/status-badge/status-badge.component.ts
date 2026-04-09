import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockReorderStatus } from '../../../core/models/product.model';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  template: ` <span class="badge" [class]="badgeClass">{{ label }}</span> `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 14px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #fff;
        white-space: nowrap;
        letter-spacing: 0.01em;
      }
      .badge--critical {
        background-color: #ef4444;
      }
      .badge--low {
        background-color: #f59e0b;
      }
      .badge--good {
        background-color: #22c55e;
      }
      // .badge--pasout {
      //   background-color: #8b5cf6;
      // }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() status: StockReorderStatus = 'good';

  get badgeClass(): string {
    return `badge--${this.status}`;
  }

  get label(): string {
    const labels: Record<StockReorderStatus, string> = {
      low: 'Low',
      critical: 'Critical',
      good: 'Good',
    };
    return labels[this.status];
  }
}
