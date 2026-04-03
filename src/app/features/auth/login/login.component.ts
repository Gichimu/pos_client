import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { MOCK_USERS } from '../../../core/constants/roles.constants';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatRippleModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  selectedRole = signal<UserRole | null>(null);

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
  }

  login() {
    const role = this.selectedRole();
    if (!role) return;
    const user = MOCK_USERS.find((u) => u.role === role);
    if (user) {
      this.authService.login(user);
      this.router.navigate([role === 'superAdmin' ? '/management' : '/cashier']);
    }
  }
}
