import { Component, Input, signal, ViewChild, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-password-reauthentication-field',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="password-field">
      <mat-label>Your password</mat-label>
      <input
        #passwordInput
        matInput
        [type]="showPassword() ? 'text' : 'password'"
        [formControl]="control"
        autocomplete="current-password"
        [attr.aria-describedby]="errorMessage ? 'refund-password-error' : 'refund-password-help'"
        required
      />
      <button
        mat-icon-button
        matSuffix
        type="button"
        class="password-field__toggle"
        [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="showPassword()"
        (click)="showPassword.update((visible) => !visible)"
      >
        <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      @if (errorMessage) {
        <mat-error id="refund-password-error">{{ errorMessage }}</mat-error>
      }
    </mat-form-field>
    @if (!errorMessage) {
      <p id="refund-password-help" class="password-field__hint">
        Enter your password to approve this refund.
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .password-field {
        width: 100%;
        margin-bottom: 0;
      }
      .password-field__toggle {
        color: var(--color-text-muted);
      }
      .password-field__toggle:hover,
      .password-field__toggle:focus-visible {
        color: var(--color-primary);
      }
      .password-field__hint {
        margin: -12px 0 0;
        color: var(--color-text-muted);
        font-size: 0.8rem;
        line-height: 1.45;
      }
    `,
  ],
})
export class PasswordReauthenticationFieldComponent {
  @Input({ required: true }) control!: FormControl<string>;
  @Input() errorMessage = '';
  readonly showPassword = signal(false);
  @ViewChild('passwordInput') private passwordInput?: ElementRef<HTMLInputElement>;

  focus(): void {
    this.passwordInput?.nativeElement.focus();
  }
}
