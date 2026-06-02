import { Routes } from '@angular/router';
import { AuthGuard } from '@app/core/guard/auth.guard';
import { MaintenanceGuard } from '@app/core/guard/maintenance.guard';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard, MaintenanceGuard],
  },
  {
    path: 'home',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'my-profile',
    loadComponent: () =>
      import('./my-profile/my-profile.component').then(
        m => m.MyProfileComponent,
      ),
    canActivate: [AuthGuard, MaintenanceGuard],
  },
  {
    path: 'my-network',
    loadComponent: () =>
      import('./my-network/my-network.component').then(
        m => m.MyNetworkComponent,
      ),
    canActivate: [AuthGuard, MaintenanceGuard],
  },
  {
    path: 'my-orders',
    loadComponent: () =>
      import('./my-orders/my-orders.component').then(
        m => m.MyOrdersComponent,
      ),
    canActivate: [AuthGuard, MaintenanceGuard],
  },
  {
    path: 'network-tree',
    loadComponent: () =>
      import(
        '@app/shared/components/unilevel-tree/page/view-unilevel-tree.component'
      ).then(m => m.ViewUnilevelTreeComponent),
    canActivate: [AuthGuard, MaintenanceGuard],
  },
];
