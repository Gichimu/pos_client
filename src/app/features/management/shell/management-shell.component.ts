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
import { RbacAllow } from '../../../core/directives/rbac-allow';
import { productStore } from '../../../store/products/product.store';
import { userStore } from '../../../store/users/user.store';

interface NavItem {
  label: string;
  icon: string;
  path?: string;
  roles?: UserRole[];
  /** Child items render as an expandable sub-menu */
  children?: NavItem[];
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
    RbacAllow,
  ],
  templateUrl: './management-shell.component.html',
  styleUrl: './management-shell.component.scss',
})
export class ManagementShellComponent implements OnInit {
  private readonly store = inject(authStore);
  private readonly authStore = inject(authStore);
  private readonly authService = inject(AuthService);
  private readonly productStore = inject(productStore);
  private readonly usersStore = inject(userStore);
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
    {
      label: 'Overview',
      icon: 'home',
      roles: ['superAdmin', 'manager'] as UserRole[],
      path: '/management/dashboard',
    },
    {
      label: 'Inventory',
      icon: 'inventory_2',
      roles: ['superAdmin', 'manager'] as UserRole[],
      children: [
        {
          label: 'Menu',
          icon: 'restaurant_menu',
          roles: ['superAdmin', 'manager'] as UserRole[],
          path: '/management/inventory',
        },
        {
          label: 'Stock',
          icon: 'inventory',
          roles: ['superAdmin', 'manager'] as UserRole[],
          path: '/management/stock',
        },
        {
          label: 'Recipes',
          icon: 'receipt_long',
          roles: ['superAdmin', 'manager'] as UserRole[],
          path: '/management/recipe',
        },
      ],
    },
    {
      label: 'Staff Management',
      icon: 'people',
      roles: ['superAdmin'] as UserRole[],
      path: '/management/staff',
    },
    {
      label: 'Shifts',
      icon: 'schedule',
      roles: ['superAdmin', 'manager'] as UserRole[],
      path: '/management/shifts',
    },
    {
      label: 'Sales',
      icon: 'receipt_long',
      roles: ['superAdmin', 'manager'] as UserRole[],
      path: '/management/sales',
    },
    {
      label: 'Reports',
      icon: 'bar_chart',
      roles: ['superAdmin'] as UserRole[],
      path: '/management/reports',
    },
    {
      label: 'Logs',
      icon: 'history',
      roles: ['superAdmin'] as UserRole[],
      children: [
        {
          label: 'System Logs',
          icon: 'monitor_heart',
          roles: ['superAdmin'] as UserRole[],
          path: '/management/logs/system',
        },
        {
          label: 'Inventory Adjustments',
          icon: 'inventory',
          roles: ['superAdmin'] as UserRole[],
          path: '/management/logs/inventory',
        },
      ],
    },
  ];

  /** Set of group labels that are currently expanded in the sidebar. */
  readonly expandedGroups = signal<Set<string>>(new Set<string>());

  /** Controls the mobile slide-out sidebar. Always open on desktop (handled via CSS). */
  readonly sidebarOpen = signal(false);

  /** Helper: sort low/critical products with critical first. */
  private sortAlerts(products: ReturnType<typeof this.productStore.products>) {
    return products
      .filter((p) => p.stockReorderStatus === 'low' || p.stockReorderStatus === 'critical')
      .sort((a, b) => {
        if (a.stockReorderStatus === 'critical' && b.stockReorderStatus !== 'critical') return -1;
        if (b.stockReorderStatus === 'critical' && a.stockReorderStatus !== 'critical') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  /** Menu products with low or critical stock. */
  readonly menuStockAlerts = computed(() =>
    this.sortAlerts(
      this.productStore
        .products()
        .filter(
          (p) => !p.productType || p.productType === 'menu' || p.productType === 'menu-stock',
        ),
    ),
  );

  /** Users awaiting approval. */
  readonly pendingUsers = computed(() =>
    this.usersStore.users().filter((u) => u?.status === 'pending'),
  );

  /** Total unread notification count. */
  readonly notificationCount = computed(
    () => this.menuStockAlerts().length + this.pendingUsers().length,
  );

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
    const inventoryPaths = ['/management/inventory', '/management/recipe', '/management/stock'];
    if (inventoryPaths.some((p) => url.includes(p))) {
      this.expandedGroups.update((s) => {
        const next = new Set(s);
        next.add('Inventory');
        return next;
      });
    }
    if (url.includes('/management/logs')) {
      this.expandedGroups.update((s) => {
        const next = new Set(s);
        next.add('Logs');
        return next;
      });
    }
  }

  navigateToInventory(status: string): void {
    const filter = status === 'critical' ? 'critical' : 'low';
    this.router.navigate(['/management/inventory'], { queryParams: { filter } });
  }

  navigateToStaff(): void {
    this.router.navigate(['/management/staff']);
  }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }

  goToCashier() {
    this.router.navigate(['/cashier']);
  }

  ngOnInit() {
    this.productStore.loadProducts();
    // Auto-expand group for the initial URL
    this.autoExpandGroupForUrl(this.router.url);
    // Keep expanding when navigating
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.autoExpandGroupForUrl(e.urlAfterRedirects));
  }
}
