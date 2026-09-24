import { Component, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { authStore } from '../../../../store/auth/auth.store';
import { RefundApprovalDialogData, RefundApprovalStatus } from './refund-approval.models';
import { RefundConfirmation } from '../../../../core/models/refund.model';
import { StaffIdentityLineComponent } from './staff-identity-line.component';
import { RefundCalculationSummaryComponent } from './refund-calculation-summary.component';
import { PasswordReauthenticationFieldComponent } from './password-reauthentication-field.component';

@Component({
  selector: 'app-refund-approval-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StaffIdentityLineComponent,
    RefundCalculationSummaryComponent,
    PasswordReauthenticationFieldComponent,
  ],
  templateUrl: './refund-approval-dialog.component.html',
  styleUrl: './refund-approval-dialog.component.scss',
})
export class RefundApprovalDialogComponent implements OnDestroy {
  readonly data = inject<RefundApprovalDialogData>(MAT_DIALOG_DATA);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(authStore);
  private readonly dialogRef = inject(
    MatDialogRef<RefundApprovalDialogComponent, RefundConfirmation>,
  );
  @ViewChild(PasswordReauthenticationFieldComponent)
  private passwordField?: PasswordReauthenticationFieldComponent;

  readonly status = signal<RefundApprovalStatus>('idle');
  readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly isSubmitting = signal(false);

  get passwordError(): string {
    return this.status() === 'invalid-password' ? 'Password could not be verified. Try again.' : '';
  }

  get requestError(): string {
    return this.status() === 'request-error'
      ? 'Refund approval could not be completed. Your sale has not been changed.'
      : '';
  }

  constructor() {
    this.dialogRef.disableClose = false;
  }

  formatCurrency(value: number): string {
    return `Ksh.${value.toFixed(2)}`;
  }

  cancel(): void {
    if (!this.isSubmitting()) this.dialogRef.close();
  }

  approve(): void {
    if (this.isSubmitting()) return;
    if (this.passwordControl.invalid) {
      this.passwordControl.markAsTouched();
      this.passwordField?.focus();
      return;
    }

    const password = this.passwordControl.value;
    const email = this.authStore.user()?.email;
    this.isSubmitting.set(true);
    this.dialogRef.disableClose = true;

    this.authService
      .reauthenticate({
        password,
        email: email || '',
        purpose: 'mpesa-overpayment-refund',
        saleId: this.data.saleId,
        refundAmount: this.data.refundAmount,
      })
      .subscribe({
        next: (result) => {
          this.passwordControl.reset('');
          if (!result.verified || !result.approvalToken) {
            this.status.set('invalid-password');
            this.passwordControl.markAsTouched();
            this.passwordField?.focus();
            this.setIdle();
            return;
          }

          this.dialogRef.close({
            amount: this.data.refundAmount,
            approvalToken: result.approvalToken,
          });
          this.setIdle();
        },
        error: (error: { status?: number }) => {
          this.passwordControl.reset('');
          this.status.set(error.status === 401 ? 'invalid-password' : 'request-error');
          this.passwordField?.focus();
          this.setIdle();
        },
      });
  }

  ngOnDestroy(): void {
    this.passwordControl.reset('');
  }

  private setIdle(): void {
    this.isSubmitting.set(false);
    this.dialogRef.disableClose = false;
  }
}
