import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../core/models/product.model';

export interface StockAdjustData {
  product: Product;
  mode: 'add' | 'deduct';
}

@Component({
  selector: 'app-stock-adjust-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="rs-modal">
      <div class="rs-modal__header">
        <div class="rs-modal__header-left">
          <div class="rs-modal__icon">
            <mat-icon>{{ data.mode === 'add' ? 'add_circle' : 'remove_circle' }}</mat-icon>
          </div>
          <div>
            <h2 class="rs-modal__title">{{ data.mode === 'add' ? 'Add' : 'Deduct' }} Stock</h2>
            <p class="rs-modal__subtitle">{{ data.product.name }}</p>
          </div>
        </div>
        <button mat-icon-button class="close-btn" (click)="cancel()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="rs-modal__body">
        <form [formGroup]="form" class="rs-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-field">
              <mat-label>Current Stock</mat-label>
              <mat-icon matPrefix>warehouse</mat-icon>
              <input matInput type="number" [value]="data.product.currentStock" readonly />
              <mat-icon matSuffix class="lock-icon">lock</mat-icon>
              <mat-hint>Read-only</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-field">
              <mat-label>Unit</mat-label>
              <mat-icon matPrefix>straighten</mat-icon>
              <input matInput [value]="data.product.unit || 'pcs'" readonly />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-field add-stock-field">
            <mat-label>{{ data.mode === 'add' ? 'Add to' : 'Deduct from' }} Stock</mat-label>
            <mat-icon matPrefix>{{ data.mode === 'add' ? 'add_circle_outline' : 'remove_circle_outline' }}</mat-icon>
            <input matInput type="number" formControlName="quantity" min="1" placeholder="0" />
            @if (data.product.unit) {
              <span matSuffix class="units-suffix">{{ data.product.unit }}</span>
            }
            @if (form.controls.quantity.value > 0) {
              <mat-hint class="add-hint">
                {{ data.mode === 'add' ? '↑' : '↓' }} New total: {{ newTotal }} {{ data.product.unit || '' }}
              </mat-hint>
            }
            @if (form.controls.quantity.errors?.['required']) {
              <mat-error>Quantity is required</mat-error>
            }
            @if (form.controls.quantity.errors?.['min']) {
              <mat-error>Minimum quantity is 1</mat-error>
            }
            @if (data.mode === 'deduct' && form.controls.quantity.errors?.['max']) {
              <mat-error>Cannot deduct more than current stock ({{ data.product.currentStock }})</mat-error>
            }
          </mat-form-field>

          @if (form.controls.quantity.value > 0) {
            <div class="stock-preview">
              <mat-icon>check_circle</mat-icon>
              <span>
                Stock will update from <strong>{{ data.product.currentStock }}</strong> →
                <strong>{{ newTotal }} {{ data.product.unit || '' }}</strong> on save
              </span>
            </div>
          }
        </form>
      </div>

      <div class="rs-modal__footer">
        <button mat-stroked-button class="cancel-btn" (click)="cancel()">Cancel</button>
        <button mat-flat-button class="save-btn" [disabled]="form.invalid" (click)="confirm()">
          <mat-icon>check</mat-icon>
          Confirm {{ data.mode === 'add' ? 'Addition' : 'Deduction' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rs-modal { width: 500px; max-width: 95vw; display: flex; flex-direction: column; max-height: 90vh; }
    .rs-modal__header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
    .rs-modal__header-left { display: flex; align-items: center; gap: 14px; overflow: hidden; }
    .rs-modal__icon { width: 40px; height: 40px; border-radius: 10px; background: #ecfdf5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { color: #059669; font-size: 20px; width: 20px; height: 20px; } }
    .rs-modal__title { font-size: 1rem; font-weight: 700; margin: 0; }
    .rs-modal__subtitle { font-size: 0.85rem; color: var(--color-text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rs-modal__body { padding: 20px 24px; overflow-y: auto; }
    .rs-modal__footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--color-border); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .flex-field, .full-field { width: 100%; }
    .lock-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; color: #cbd5e1 !important; }
    .units-suffix { font-size: 0.85rem; color: var(--color-text-muted); padding-right: 4px; }
    
    ::ng-deep .add-stock-field {
      .mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing { border-color: var(--color-primary) !important; border-width: 1.5px !important; }
      .mat-mdc-form-field-icon-prefix mat-icon { color: var(--color-primary) !important; }
      .add-hint { color: var(--color-primary) !important; font-weight: 500 !important; }
    }

    .stock-preview { display: flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; color: #15803d; margin-top: 12px; mat-icon { font-size: 16px; width: 16px; height: 16px; color: #16a34a; } }
    .save-btn { background-color: #059669 !important; color: #fff !important; }

    @media (max-width: 479px) {
      .rs-modal { width: 100%; }
      .form-row { grid-template-columns: 1fr; gap: 0; }
    }
  `]
})
export class StockAdjustDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StockAdjustDialogComponent>);
  readonly data = inject<StockAdjustData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    quantity: [1, [
      Validators.required, 
      Validators.min(1),
      ...(this.data.mode === 'deduct' ? [Validators.max(this.data.product.currentStock || 0)] : [])
    ]],
  });

  get newTotal() {
    const delta = this.form.getRawValue().quantity;
    return (this.data.product.currentStock || 0) + (this.data.mode === 'add' ? delta : -delta);
  }

  cancel() {
    this.dialogRef.close();
  }

  confirm() {
    if (this.form.valid) {
      const delta = this.form.getRawValue().quantity;
      this.dialogRef.close(this.data.mode === 'add' ? delta : -delta);
    }
  }
}
