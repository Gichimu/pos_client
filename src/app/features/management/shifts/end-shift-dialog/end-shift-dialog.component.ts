import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { saleStore } from '../../../../store/sales/sale.store';

export interface EndShiftDialogData {
  duration: string;
  revenue: number;
  activeCashiers: number;
  unconfirmedCount: number;
}

export interface EndShiftDialogResult {
  closingNotes?: string;
}

@Component({
  selector: 'app-end-shift-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './end-shift-dialog.component.html',
  styleUrl: './end-shift-dialog.component.scss',
})
export class EndShiftDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly saleStore = inject(saleStore);
  private readonly dialogRef = inject(MatDialogRef<EndShiftDialogComponent>);
  readonly data = inject<EndShiftDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    closingNotes: [''],
  });

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  confirm() {
    const notes = this.form.value.closingNotes?.trim();
    const result: EndShiftDialogResult = { closingNotes: notes || undefined };
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }
}
