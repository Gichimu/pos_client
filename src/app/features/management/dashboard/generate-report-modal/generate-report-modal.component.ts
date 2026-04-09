import { Component, inject, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { productStore } from '../../../../store/products/product.store';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-generate-report-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
  ],
  templateUrl: './generate-report-modal.component.html',
  styleUrl: './generate-report-modal.component.scss',
})
export class GenerateReportModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GenerateReportModalComponent>);
  private readonly store = inject(Store);
  private readonly productStore = inject(productStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly products = this.productStore.products as Signal<Product[]>;

  readonly loading = signal(false);

  readonly form = this.fb.group({
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    products: [[] as string[], Validators.required],
  });

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    // Simulate async report generation
    setTimeout(() => {
      this.loading.set(false);
      this.dialogRef.close(this.form.value);
      this.snackBar.open('Sales report generated successfully!', 'Dismiss', {
        duration: 3000,
      });
    }, 1200);
  }
}
