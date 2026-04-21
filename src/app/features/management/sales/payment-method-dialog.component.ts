import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PaymentMethod } from '../../../core/models/sale.model';

export interface PaymentMethodDialogData {
  saleId: string;
  saleIdLabel: string;
  totalAmount: number;
}

export interface PaymentMethodDialogResult {
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  mpesaAmount?: number;
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
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="pmDialog__header" mat-dialog-title>
      <div class="pmDialog__header-icon-wrap">
        <span class="material-icons pmDialog__header-icon">payments</span>
      </div>
      <div>
        <p class="pmDialog__title">Select Payment Method</p>
        <p class="pmDialog__subtitle">
          {{ data.saleIdLabel }} &mdash;
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
            [class.pmDialog__option--split]="option.method === 'Split'"
            (click)="select(option.method)"
            [attr.aria-pressed]="selectedMethod() === option.method"
          >
            @if (selectedMethod() === option.method) {
              <span class="pmDialog__option-check material-icons">check_circle</span>
            }
            <div
              class="pmDialog__option-icon-wrap"
              [class.pmDialog__option-icon-wrap--selected]="selectedMethod() === option.method"
              [class.pmDialog__option-icon-wrap--split]="option.method === 'Split'"
            >
              <span class="material-icons pmDialog__option-icon">{{ option.icon }}</span>
            </div>
            <span class="pmDialog__option-label">{{ option.label }}</span>
            <span class="pmDialog__option-desc">{{ option.description }}</span>
          </button>
        }
      </div>

      <!-- Split payment inputs — visible only when Split is selected -->
      @if (selectedMethod() === 'Split') {
        <div class="pmDialog__split">
          <div class="pmDialog__split-header">
            <span class="material-icons">call_split</span>
            <span>Enter amounts for each payment method</span>
          </div>

          <div class="pmDialog__split-fields">
            <mat-form-field appearance="outline" class="pmDialog__split-field">
              <mat-label>Cash amount</mat-label>
              <span matPrefix class="pmDialog__prefix">Ksh&nbsp;</span>
              <input
                matInput
                type="number"
                min="0"
                [max]="data.totalAmount"
                [(ngModel)]="cashAmountRaw"
                (ngModelChange)="onCashChange($event)"
                placeholder="0.00"
              />
              <span class="material-icons pmDialog__field-icon" matSuffix>payments</span>
            </mat-form-field>

            <mat-form-field appearance="outline" class="pmDialog__split-field">
              <mat-label>M-Pesa amount</mat-label>
              <span matPrefix class="pmDialog__prefix">Ksh&nbsp;</span>
              <input
                matInput
                type="number"
                min="0"
                [max]="data.totalAmount"
                [(ngModel)]="mpesaAmountRaw"
                (ngModelChange)="onMpesaChange($event)"
                placeholder="0.00"
              />
              <span class="material-icons pmDialog__field-icon" matSuffix>phone_android</span>
            </mat-form-field>
          </div>

          <!-- Balance indicator -->
          <div class="pmDialog__split-balance" [class.pmDialog__split-balance--ok]="splitValid()" [class.pmDialog__split-balance--err]="!splitValid()">
            <span class="material-icons">{{ splitValid() ? 'check_circle' : 'error_outline' }}</span>
            @if (splitValid()) {
              <span>Amounts match &mdash; {{ formatCurrency(data.totalAmount) }}</span>
            } @else {
              <span>
                Total entered: {{ formatCurrency(splitTotal()) }} &mdash;
                {{ splitRemaining() > 0 ? formatCurrency(splitRemaining()) + ' remaining' : formatCurrency(-splitRemaining()) + ' over' }}
              </span>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!canConfirm()" (click)="confirm()">
        <span class="material-icons">check</span>
        Confirm Payment
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
        gap: 12px;
        padding: 8px 0 4px;
        flex-wrap: wrap;
      }

      .pmDialog__option {
        flex: 1;
        min-width: 90px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 22px 10px 18px;
        border: 2px solid #e5e7eb;
        border-radius: 14px;
        background: #f9fafb;
        cursor: pointer;
        position: relative;
        transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
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

      /* Split option has a distinct amber accent when selected */
      .pmDialog__option--split.pmDialog__option--selected {
        border-color: #f59e0b;
        background: #fffbeb;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
      }

      .pmDialog__option-icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #fff;
        border: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.18s, border-color 0.18s;
      }

      .pmDialog__option-icon-wrap--selected {
        background: #e0e7ff;
        border-color: #c7d2fe;
      }

      .pmDialog__option-icon-wrap--split.pmDialog__option-icon-wrap--selected {
        background: #fef3c7;
        border-color: #fde68a;
      }

      .pmDialog__option-icon {
        font-size: 24px;
        color: #6366f1;
      }

      .pmDialog__option--split .pmDialog__option-icon {
        color: #d97706;
      }

      .pmDialog__option-label {
        font-size: 0.88rem;
        font-weight: 700;
        color: #111827;
        line-height: 1;
      }

      .pmDialog__option-desc {
        font-size: 0.7rem;
        color: #9ca3af;
        text-align: center;
        line-height: 1.4;
      }

      .pmDialog__option-check {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 16px;
        color: #6366f1;
      }

      .pmDialog__option--split .pmDialog__option-check {
        color: #f59e0b;
      }

      /* ── Split amount inputs ───────────────────── */
      .pmDialog__split {
        margin-top: 16px;
        padding: 16px;
        border-radius: 12px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .pmDialog__split-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        color: #92400e;
        margin-bottom: 14px;

        .material-icons { font-size: 18px; color: #d97706; }
      }

      .pmDialog__split-fields {
        display: flex;
        gap: 12px;
      }

      .pmDialog__split-field {
        flex: 1;
        font-family: 'Inter', sans-serif;
      }

      .pmDialog__prefix {
        font-size: 0.85rem;
        color: #6b7280;
        font-weight: 500;
      }

      .pmDialog__field-icon {
        font-size: 18px;
        color: #9ca3af;
      }

      /* ── Balance indicator ────────────────────── */
      .pmDialog__split-balance {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;

        .material-icons { font-size: 16px; }

      }

      .pmDialog__split-balance--ok {
        background: #d1fae5;
        color: #065f46;
        .material-icons { color: #10b981; }
      }

      .pmDialog__split-balance--err {
        background: #fee2e2;
        color: #991b1b;
        .material-icons { color: #ef4444; }
      }
    `,
  ],
})
export class PaymentMethodDialogComponent {
  selectedMethod = signal<PaymentMethod | null>(null);

  /** Raw ngModel values for the split inputs */
  cashAmountRaw: number | null = null;
  mpesaAmountRaw: number | null = null;

  cashAmount = signal(0);
  mpesaAmount = signal(0);

  readonly splitTotal = computed(() => this.cashAmount() + this.mpesaAmount());
  readonly splitRemaining = computed(() => this.data.totalAmount - this.splitTotal());
  readonly splitValid = computed(() => Math.abs(this.splitRemaining()) < 0.01);

  readonly canConfirm = computed(() => {
    const method = this.selectedMethod();
    if (!method) return false;
    if (method === 'Split') return this.splitValid();
    return true;
  });

  readonly paymentOptions: PaymentOption[] = [
    { method: 'Cash',   icon: 'payments',      label: 'Cash',   description: 'Physical cash' },
    { method: 'M-Pesa', icon: 'phone_android',  label: 'M-Pesa', description: 'Mobile money' },
    { method: 'PDQ',    icon: 'credit_card',    label: 'PDQ',    description: 'Card / terminal' },
    { method: 'Split',  icon: 'call_split',     label: 'Split',  description: 'Cash + M-Pesa' },
  ];

  constructor(
    private readonly dialogRef: MatDialogRef<PaymentMethodDialogComponent, PaymentMethodDialogResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: PaymentMethodDialogData,
  ) {}

  select(method: PaymentMethod): void {
    this.selectedMethod.set(method);
    // Pre-fill split amounts if switching to Split
    if (method === 'Split' && this.cashAmount() === 0 && this.mpesaAmount() === 0) {
      this.cashAmountRaw = 0;
      this.mpesaAmountRaw = 0;
    }
  }

  onCashChange(val: number | null): void {
    const cash = Math.max(0, Number(val) || 0);
    this.cashAmount.set(cash);
    // Auto-fill remaining into M-Pesa
    const remaining = Math.max(0, this.data.totalAmount - cash);
    this.mpesaAmount.set(+remaining.toFixed(2));
    this.mpesaAmountRaw = +remaining.toFixed(2);
  }

  onMpesaChange(val: number | null): void {
    const mpesa = Math.max(0, Number(val) || 0);
    this.mpesaAmount.set(mpesa);
  }

  confirm(): void {
    const method = this.selectedMethod();
    if (!method || !this.canConfirm()) return;
    const result: PaymentMethodDialogResult = { paymentMethod: method };
    if (method === 'Split') {
      result.cashAmount = +this.cashAmount().toFixed(2);
      result.mpesaAmount = +this.mpesaAmount().toFixed(2);
    }
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }
}
