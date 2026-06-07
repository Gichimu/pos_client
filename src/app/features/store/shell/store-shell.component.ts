import { Component, inject, signal, computed, Signal, OnInit } from '@angular/core';
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
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { authStore } from '../../../store/auth/auth.store';
import { User, UserRole } from '../../../core/models/user.model';
import { productStore } from '../../../store/products/product.store';

interface NavItem {
  label: string;
  icon: string;
  path?: string;
  roles?: UserRole[];
  children?: NavItem[];
}

@Component({
  selector: 'app-store-shell',
  standalone: true,
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
  templateUrl: './store-shell.component.html',
  styleUrl: './store-shell.component.scss',
})
export class StoreShellComponent implements OnInit {
  private readonly authStore = inject(authStore);
  private readonly productStore = inject(productStore);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly currentUser = this.authStore.user as Signal<User | null>;

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
    {
      label: 'Dashboard',
      icon: 'home',
      path: '/store/dashboard',
    },
    {
      label: 'Inventory',
      icon: 'warehouse',
      path: '/store/inventory',
    },
  ];

  readonly expandedGroups = signal<Set<string>>(new Set<string>());
  readonly sidebarOpen = signal(false);

  private sortAlerts(products: ReturnType<typeof this.productStore.products>) {
    return products
      .filter((p) => p.stockReorderStatus === 'low' || p.stockReorderStatus === 'critical')
      .sort((a, b) => {
        if (a.stockReorderStatus === 'critical' && b.stockReorderStatus !== 'critical') return -1;
        if (b.stockReorderStatus === 'critical' && a.stockReorderStatus !== 'critical') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  readonly stockAlerts = computed(() =>
    this.sortAlerts(this.productStore.products().filter((p) => p.productType === 'raw-stock')),
  );

  readonly notificationCount = computed(() => this.stockAlerts().length);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleGroup(label: string): void {
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  private autoExpandGroupForUrl(url: string): void {
    if (url.includes('/store/inventory')) {
      this.expandedGroups.update((s) => {
        const next = new Set(s);
        next.add('Inventory');
        return next;
      });
    }
  }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }

  navigateToStock(filter: string): void {
    this.router.navigate(['/store/inventory'], { queryParams: { filter, mode: 'add' } });
  }

  ngOnInit() {
    this.productStore.loadProducts();
    this.autoExpandGroupForUrl(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.autoExpandGroupForUrl(e.urlAfterRedirects));
  }
}
