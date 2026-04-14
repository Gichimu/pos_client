import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface StartShiftDialogResult {
  openingNotes?: string;
}

@Component({
  selector: 'app-start-shift-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './start-shift-dialog.component.html',
  styleUrl: './start-shift-dialog.component.scss',
})
export class StartShiftDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StartShiftDialogComponent>);

  readonly form = this.fb.group({
    openingNotes: [''],
  });

  confirm() {
    const notes = this.form.value.openingNotes?.trim();
    const result: StartShiftDialogResult = { openingNotes: notes || undefined };
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }
}
