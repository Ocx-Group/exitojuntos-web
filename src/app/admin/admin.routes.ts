import { Routes } from '@angular/router';
import { AuthGuardAdmin } from '@app/core/guard/auth.guard.admin';
import { MaintenanceGuard } from '@app/core/guard/maintenance.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home-admin',
    pathMatch: 'full',
  },
  {
    path: 'home-admin',
    loadComponent: () =>
      import('@app/shared/pages/dashboard-page/dashboard-page.component').then(
        m => m.DashboardPageComponent,
      ),
    data: { pageType: 'admin' },
    canActivate: [AuthGuardAdmin, MaintenanceGuard],
  },
  {
    path: 'users-management',
    loadComponent: () =>
      import('./users-management/users-management.component').then(
        m => m.UsersManagementComponent,
      ),
    canActivate: [AuthGuardAdmin, MaintenanceGuard],
  },
  {
    path: 'unilevel-tree',
    loadComponent: () =>
      import(
        '@app/shared/components/unilevel-tree/page/view-unilevel-tree.component'
      ).then(m => m.ViewUnilevelTreeComponent),
    canActivate: [AuthGuardAdmin, MaintenanceGuard],
  },
];
