import { Routes } from '@angular/router';
import { AuthGuard } from '@app/core/guard/auth.guard';
import { MaintenanceGuard } from '@app/core/guard/maintenance.guard';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('@app/shared/pages/dashboard-page/dashboard-page.component').then(
        m => m.DashboardPageComponent,
      ),
    data: { pageType: 'client' },
    canActivate: [AuthGuard, MaintenanceGuard],
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
    path: 'network-tree',
    loadComponent: () =>
      import(
        '@app/shared/components/unilevel-tree/page/view-unilevel-tree.component'
      ).then(m => m.ViewUnilevelTreeComponent),
    canActivate: [AuthGuard, MaintenanceGuard],
  },
];
