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
        loadComponent: () =>
          import('./features/management/sales/sales.component').then((m) => m.SalesComponent),
      },
      {
        path: 'raw-stock',
        data: { title: 'Raw Stock' },
        loadComponent: () =>
          import('./features/management/raw-stock/raw-stock.component').then(
            (m) => m.RawStockComponent,
          ),
      },
      {
        path: 'recipe',
        data: { title: 'Recipes' },
        loadComponent: () =>
          import('./features/management/recipe/recipe.component').then(
            (m) => m.RecipeComponent,
          ),
      },
      {
        path: 'reports',
        data: { title: 'Reports' },
        loadComponent: () =>
          import('./features/management/reports/reports.component').then((m) => m.ReportsComponent),
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
