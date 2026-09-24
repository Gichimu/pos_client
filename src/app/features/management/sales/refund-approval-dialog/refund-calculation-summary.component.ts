import { Component, Input } from '@angular/core';
import { RefundExpectedAmountLabel } from './refund-approval.models';

@Component({
  selector: 'app-refund-calculation-summary',
  standalone: true,
  template: `
    <dl class="refund-summary" aria-label="Refund calculation">
      <div class="refund-summary__row">
        <dt>Received</dt>
        <dd>{{ formatCurrency(received) }}</dd>
      </div>
      <div class="refund-summary__row">
        <dt>{{ expectedAmountLabel }}</dt>
        <dd>− {{ formatCurrency(expectedAmount) }}</dd>
      </div>
      <div class="refund-summary__row refund-summary__row--total">
        <dt>Refund to return</dt>
        <dd>{{ formatCurrency(refundAmount) }}</dd>
      </div>
    </dl>
  `,
  styles: [
    `
      :host {
        --refund-summary-ink: #9a3412;
        --refund-summary-rule: #fdba74;
        display: block;
      }
      .refund-summary {
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: 10px;
        background: var(--color-surface);
      }
      .refund-summary__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 11px 14px;
      }
      .refund-summary__row dt {
        color: var(--color-text-muted);
        font-size: 0.8rem;
      }
      .refund-summary__row dd {
        margin: 0;
        color: var(--color-text);
        font-size: 0.9rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .refund-summary__row--total {
        border-top: 1px dashed var(--refund-summary-rule);
        background: #fffaf5;
      }
      .refund-summary__row--total dt {
        color: var(--color-text);
        font-size: 0.85rem;
        font-weight: 700;
      }
      .refund-summary__row--total dd {
        color: var(--refund-summary-ink);
        font-size: 1.1rem;
        font-weight: 800;
      }
      @media (max-width: 479px) {
        .refund-summary__row {
          align-items: flex-start;
          padding: 10px 12px;
        }
        .refund-summary__row--total {
          padding-top: 12px;
          padding-bottom: 12px;
        }
      }
    `,
  ],
})
export class RefundCalculationSummaryComponent {
  @Input({ required: true }) received = 0;
  @Input({ required: true }) expectedAmount = 0;
  @Input({ required: true }) refundAmount = 0;
  @Input({ required: true }) expectedAmountLabel: RefundExpectedAmountLabel = 'Sale total';

  formatCurrency(value: number): string {
    return `Ksh.${value.toFixed(2)}`;
  }
}
