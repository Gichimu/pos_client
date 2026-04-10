import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethod } from '../../../core/models/sale.model';

export interface PaymentMethodDialogData {
  itemId: string;
  productName: string;
  totalAmount: number;
}

export interface PaymentMethodDialogResult {
  paymentMethod: PaymentMethod;
}

interface PaymentOption {
  method: PaymentMethod;
  icon: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-payment-method-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pmDialog__header" mat-dialog-title>
      <div class="pmDialog__header-icon-wrap">
        <span class="material-icons pmDialog__header-icon">payments</span>
      </div>
      <div>
        <p class="pmDialog__title">Select Payment Method</p>
        <p class="pmDialog__subtitle">
          {{ data.productName }} &mdash;
          <strong>{{ formatCurrency(data.totalAmount) }}</strong>
        </p>
      </div>
    </div>

    <mat-dialog-content>
      <div class="pmDialog__options">
        @for (option of paymentOptions; track option.method) {
          <button
            class="pmDialog__option"
            [class.pmDialog__option--selected]="selectedMethod() === option.method"
            (click)="select(option.method)"
            [attr.aria-pressed]="selectedMethod() === option.method"
          >
            @if (selectedMethod() === option.method) {
              <span class="pmDialog__option-check material-icons">check_circle</span>
            }
            <div
              class="pmDialog__option-icon-wrap"
              [class.pmDialog__option-icon-wrap--selected]="selectedMethod() === option.method"
            >
              <span class="material-icons pmDialog__option-icon">{{ option.icon }}</span>
            </div>
            <span class="pmDialog__option-label">{{ option.label }}</span>
            <span class="pmDialog__option-desc">{{ option.description }}</span>
          </button>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!selectedMethod()" (click)="confirm()">
        <span class="material-icons">check</span>
        Confirm
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      /* ── Header ───────────────────────────────── */
      .pmDialog__header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 24px 0;
      }

      .pmDialog__header-icon-wrap {
        flex-shrink: 0;
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: #eef2ff;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pmDialog__header-icon {
        font-size: 26px;
        color: #6366f1;
      }

      .pmDialog__title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0 0 4px;
        color: #111827;
        line-height: 1.2;
      }

      .pmDialog__subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
      }

      /* ── Option cards ─────────────────────────── */
      .pmDialog__options {
        display: flex;
        gap: 16px;
        padding: 8px 0 4px;
      }

      .pmDialog__option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 28px 12px 24px;
        border: 2px solid #e5e7eb;
        border-radius: 14px;
        background: #f9fafb;
        cursor: pointer;
        position: relative;
        transition:
          border-color 0.18s,
          background 0.18s,
          box-shadow 0.18s;
        font-family: inherit;
      }

      .pmDialog__option:hover {
        border-color: #a5b4fc;
        background: #eef2ff;
      }

      .pmDialog__option--selected {
        border-color: #6366f1;
        background: #eef2ff;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
      }

      .pmDialog__option-icon-wrap {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: #fff;
        border: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
          background 0.18s,
          border-color 0.18s;
      }

      .pmDialog__option-icon-wrap--selected {
        background: #e0e7ff;
        border-color: #c7d2fe;
      }

      .pmDialog__option-icon {
        font-size: 26px;
        color: #6366f1;
      }

      .pmDialog__option-label {
        font-size: 0.95rem;
        font-weight: 700;
        color: #111827;
        line-height: 1;
      }

      .pmDialog__option-desc {
        font-size: 0.75rem;
        color: #9ca3af;
        text-align: center;
        line-height: 1.5;
      }

      .pmDialog__option-check {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 18px;
        color: #6366f1;
      }
    `,
  ],
})
export class PaymentMethodDialogComponent {
  selectedMethod = signal<PaymentMethod | null>(null);

  readonly paymentOptions: PaymentOption[] = [
    {
      method: 'Cash',
      icon: 'payments',
      label: 'Cash',
      description: 'Physical cash payment',
    },
    {
      method: 'M-Pesa',
      icon: 'phone_android',
      label: 'M-Pesa',
      description: 'Mobile money transfer',
    },
    {
      method: 'PDQ',
      icon: 'credit_card',
      label: 'PDQ',
      description: 'Card / POS terminal',
    },
  ];

  constructor(
    private readonly dialogRef: MatDialogRef<
      PaymentMethodDialogComponent,
      PaymentMethodDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public readonly data: PaymentMethodDialogData,
  ) {}

  select(method: PaymentMethod): void {
    this.selectedMethod.set(method);
  }

  confirm(): void {
    const method = this.selectedMethod();
    if (!method) return;
    this.dialogRef.close({ paymentMethod: method });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }
}
