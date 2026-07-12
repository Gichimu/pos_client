import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cashier-login',
    data: { preselectedRole: 'cashier' as UserRole },
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'confirm-account',
    loadComponent: () =>
      import('./features/auth/confirm-account/confirm-account.component').then(
        (m) => m.ConfirmAccountComponent,
      ),
  },
  {
    path: 'management',
    canActivate: [authGuard, roleGuard(['superAdmin', 'manager'])],
    loadComponent: () =>
      import('./features/management/shell/management-shell.component').then(
        (m) => m.ManagementShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () =>
          import('./features/management/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'inventory',
        data: { title: 'Inventory' },
        loadComponent: () =>
          import('./features/management/inventory/inventory.component').then(
            (m) => m.InventoryComponent,
          ),
      },
      {
        path: 'stock',
        data: { title: 'Stock Management' },
        loadComponent: () =>
          import('./features/management/inventory/management-stock.component').then(
            (m) => m.ManagementStockComponent,
          ),
      },
      {
        path: 'recipe',
        data: { title: 'Recipes' },
        loadComponent: () =>
          import('./features/management/recipe/recipe.component').then((m) => m.RecipeComponent),
      },
      {
        path: 'staff',
        data: { title: 'Staff Management' },
        loadComponent: () =>
          import('./features/management/staff/staff.component').then((m) => m.StaffComponent),
      },
      {
        path: 'shifts',
        data: { title: 'Shifts' },
        loadComponent: () =>
          import('./features/management/shifts/shifts.component').then((m) => m.ShiftsComponent),
      },
      {
        path: 'sales',
        data: { title: 'Sales' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/management/sales/sales.component').then((m) => m.SalesComponent),
          },
          {
            path: 'returns',
            data: { title: 'Returns' },
            loadComponent: () =>
              import('./features/management/sales/returns.component').then((m) => m.ReturnsComponent),
          },
        ],
      },
      {
        path: 'reports',
        data: { title: 'Reports' },
        loadComponent: () =>
          import('./features/management/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'logs',
        children: [
          { path: '', redirectTo: 'system', pathMatch: 'full' },
          {
            path: 'system',
            data: { title: 'System Logs', logCategory: 'activity' },
            loadComponent: () =>
              import('./features/management/logs/logs.component').then((m) => m.LogsComponent),
          },
          {
            path: 'inventory',
            data: { title: 'Inventory Adjustments', logCategory: 'mutation' },
            loadComponent: () =>
              import('./features/management/logs/logs.component').then((m) => m.LogsComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'store',
    canActivate: [authGuard, roleGuard(['store', 'superAdmin'])],
    loadComponent: () =>
      import('./features/store/shell/store-shell.component').then((m) => m.StoreShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { title: 'Store Dashboard' },
        loadComponent: () =>
          import('./features/store/dashboard/store-dashboard.component').then(
            (m) => m.StoreDashboardComponent,
          ),
      },
      {
        path: 'inventory',
        data: { title: 'Inventory' },
        loadComponent: () =>
          import('./features/store/stock/stock-management.component').then(
            (m) => m.StockManagementComponent,
          ),
      },
    ],
  },
  {
    path: 'cashier',
    canActivate: [authGuard, roleGuard(['cashier', 'superAdmin', 'manager'])],
    loadComponent: () => import('./features/cashier/pos/pos.component').then((m) => m.PosComponent),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
