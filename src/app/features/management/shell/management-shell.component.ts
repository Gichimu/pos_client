import { Component, inject, signal, computed, Signal } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { AuthService } from '../../../core/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { authStore } from '../../../store/auth/auth.store';
import { User } from '../../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-management-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './management-shell.component.html',
  styleUrl: './management-shell.component.scss',
})
export class ManagementShellComponent {
  private readonly store = inject(authStore);
  private readonly authStore = inject(authStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly currentUser = this.store.user as Signal<User | null>;

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) route = route.firstChild;
        return route.snapshot.data['title'] ?? 'Dashboard';
      }),
    ),
    { initialValue: 'Dashboard' },
  );

  readonly navItems: NavItem[] = [
    { label: 'Overview', icon: 'home', path: '/management/dashboard' },
    { label: 'Inventory', icon: 'inventory_2', path: '/management/inventory' },
    { label: 'Staff Management', icon: 'people', path: '/management/staff' },
    { label: 'Sales', icon: 'receipt_long', path: '/management/sales' },
    { label: 'Reports', icon: 'bar_chart', path: '/management/reports' },
  ];

  notifications = signal(3);

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }

  goToCashier() {
    this.router.navigate(['/cashier']);
  }
}
