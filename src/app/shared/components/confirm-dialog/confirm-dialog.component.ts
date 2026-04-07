import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-dialog__header">
        <div class="confirm-dialog__icon" [class.confirm-dialog__icon--danger]="data.danger">
          <mat-icon>{{ data.danger ? 'delete_outline' : 'help_outline' }}</mat-icon>
        </div>
        <h2 class="confirm-dialog__title">{{ data.title }}</h2>
        <p class="confirm-dialog__message">{{ data.message }}</p>
      </div>
      <div class="confirm-dialog__actions">
        <button mat-button class="cancel-btn" (click)="cancel()">Cancel</button>
        <button
          mat-flat-button
          class="confirm-btn"
          [class.confirm-btn--danger]="data.danger"
          (click)="confirm()"
        >
          {{ data.confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      background: #fff;
      border-radius: 16px;
      padding: 28px 24px 20px;
      min-width: 320px;
      max-width: 400px;
      text-align: center;
    }
    .confirm-dialog__header { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 24px; }
    .confirm-dialog__icon {
      width: 56px; height: 56px; border-radius: 14px;
      background: #fee2e2; display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #ef4444; }
    }
    .confirm-dialog__icon--danger { background: #fee2e2; mat-icon { color: #ef4444; } }
    .confirm-dialog__title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
    .confirm-dialog__message { font-size: 0.875rem; color: #64748b; margin: 0; line-height: 1.5; }
    .confirm-dialog__actions { display: flex; justify-content: center; gap: 10px; }
    .cancel-btn { font-family: 'Inter', sans-serif !important; font-weight: 500 !important; color: #64748b !important; letter-spacing: 0 !important; }
    .confirm-btn {
      font-family: 'Inter', sans-serif !important; font-weight: 600 !important;
      letter-spacing: 0 !important; border-radius: 8px !important;
      background-color: #2563eb !important; color: #fff !important;
    }
    .confirm-btn--danger { background-color: #ef4444 !important; }
  `],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  cancel() { this.dialogRef.close(false); }
  confirm() { this.dialogRef.close(true); }
}
