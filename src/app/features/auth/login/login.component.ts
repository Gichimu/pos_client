import { Component, inject, Signal, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';
import { userStore } from '../../../store/users/user.store';
import { MOCK_CREDENTIALS, MOCK_USERS } from '../../../core/constants/roles.constants';
import { authStore } from '../../../store/auth/auth.store';

export type LoginStep = 'role' | 'credential';

export const PIN_PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;
export type PinPadKey = (typeof PIN_PAD_KEYS)[number];

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatRippleModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  store = inject(userStore);
  users = this.store.users as Signal<any[]>;

  authStore = inject(authStore);
  authUser = this.authStore.user as Signal<User | null>;

  readonly PIN_PAD_KEYS = PIN_PAD_KEYS;

  // ── Reactive form for SuperAdmin credentials ────────────────────────────
  readonly adminForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /** Convenience getters for template access. */
  get emailCtrl() {
    return this.adminForm.controls.email;
  }
  get passwordCtrl() {
    return this.adminForm.controls.password;
  }

  // Derive a signal from the email control so computed() can react to it
  private readonly adminEmail = toSignal(
    this.adminForm.controls.email.valueChanges.pipe(startWith(this.adminForm.controls.email.value)),
    { initialValue: this.adminForm.controls.email.value },
  );

  // ── Step / PIN signals (unchanged) ─────────────────────────────────────
  step = signal<LoginStep>('role');
  selectedRole = signal<UserRole | null>(null);
  pin = signal('');
  showPassword = signal(false);
  error = signal<string | null>(null);

  // ── Derived state ───────────────────────────────────────────────────────

  /**
   * For superAdmin: resolves the user whose email matches the form value (only
   * when the email passes format validation). For cashier: first active user of
   * that role, falling back to MOCK_USERS when the API is unavailable.
   */
  readonly selectedUser = computed(() => {
    const role = this.selectedRole();
    if (!role) return null;

    if (role === 'superAdmin') {
      const emailVal = (this.adminEmail() ?? '').trim();
      if (!emailVal || this.emailCtrl.errors?.['email'] || this.emailCtrl.errors?.['required']) {
        return null;
      }
      console.log('found users', this.users());
      const fromApi = this.users().find(
        (u) => u.role === 'superAdmin' && u.email === emailVal && u.status === 'active',
      );
      console.log('from api', fromApi);
      return (
        fromApi ??
        MOCK_USERS.find(
          (u) => u.role === 'superAdmin' && u.email === emailVal && u.status === 'active',
        ) ??
        null
      );
    }

    // const fromApi = this.users().find((u) => u.role === role && u.status === 'active');
    const fromApi = null; // Disable API lookup for cashiers to avoid confusion during development when API is unavailable.
    return fromApi ?? MOCK_USERS.find((u) => u.role === role && u.status === 'active') ?? null;
  });

  /** Array of 5 booleans indicating which PIN dots are filled. */
  readonly pinFilled = computed(() => [0, 1, 2, 3, 4].map((i) => i < this.pin().length));

  // ── Step navigation ─────────────────────────────────────────────────────

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
    this.error.set(null);
  }

  /** Advance from role selection to credential entry. */
  proceed() {
    if (!this.selectedRole()) return;
    this.adminForm.reset();
    this.pin.set('');
    this.error.set(null);
    this.step.set('credential');
  }

  back() {
    this.step.set('role');
    this.adminForm.reset();
    this.error.set(null);
  }

  // ── UI helpers ──────────────────────────────────────────────────────────

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  // ── Cashier PIN pad ─────────────────────────────────────────────────────

  onPinKey(digit: string) {
    if (this.pin().length >= 5) return;
    this.pin.update((p) => p + digit);
    this.error.set(null);
    if (this.pin().length === 5) {
      setTimeout(() => this.authenticate(), 280);
    }
  }

  onPinBackspace() {
    this.pin.update((p) => p.slice(0, -1));
    this.error.set(null);
  }

  // ── Authentication ──────────────────────────────────────────────────────

  authenticate() {
    const role = this.selectedRole();
    if (!role) return;

    if (role === 'superAdmin') {
      // Surface all validation errors immediately
      this.adminForm.markAllAsTouched();
      if (this.adminForm.invalid) return;

      const { email, password } = this.adminForm.getRawValue();

      // const user = this.selectedUser();
      // if (!user) {
      //   this.error.set('No active admin account found for this email. Hint: sarah@pos.com');
      //   return;
      // }

      // if (password !== MOCK_CREDENTIALS.superAdmin) {
      //   this.error.set('Incorrect password. Hint: admin123');
      //   return;
      // }

      this.authStore.login({ email, password } as User).subscribe({
        next: () => {
          console.log('auth user after login', this.authStore.user());
          this.authStore.isAuthenticated() && this.router.navigate(['/management']);
        },
        error: (error) => {
          this.error.set('Login failed. Please check your credentials.');
        },
      });
      return;
    }

    // Cashier PIN path
    if (this.pin() !== MOCK_CREDENTIALS.cashier) {
      this.error.set('Incorrect PIN. Hint: 12345');
      this.pin.set('');
      return;
    }

    const user = this.selectedUser();
    console.log('authenticating user', user);
    if (user) {
      this.authStore.login(user).subscribe({
        next: () => {
          console.log('auth user after login', this.authStore.user());
          this.authStore.isAuthenticated() && this.router.navigate(['/cashier']);
        },
        error: (error) => {
          this.error.set('Login failed. Please check your credentials.');
        },
      });
    }
  }
}
