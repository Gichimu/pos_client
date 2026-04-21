import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { authStore } from '../../../store/auth/auth.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';

/** Cross-field validator: newPassword and confirmPassword must match. */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value ?? '';
  const confirm = group.get('confirmPassword')?.value ?? '';
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-confirm-account',
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-account.component.html',
  styleUrl: './confirm-account.component.scss',
})
export class ConfirmAccountComponent implements OnInit {
  private readonly authStore = inject(authStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly pendingUser = this.authStore.pendingUser;

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  get pwCtrl() { return this.form.controls.newPassword; }
  get confirmCtrl() { return this.form.controls.confirmPassword; }

  ngOnInit(): void {
    // Guard: if no pending user, redirect back to login
    if (!this.authStore.pendingUser()) {
      this.router.navigate(['/login']);
    }
  }

  togglePassword() { this.showPassword.update((v) => !v); }
  toggleConfirmPassword() { this.showConfirmPassword.update((v) => !v); }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    const { newPassword } = this.form.getRawValue();

    this.authStore.confirmAccount(newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.sweetAlert.success('Account activated! Please log in with your new password.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to activate account. Please try again.');
      },
    });
  }

  cancel() {
    this.authStore.clearPendingUser();
    this.router.navigate(['/login']);
  }
}
