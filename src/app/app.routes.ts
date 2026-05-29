import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Layout de autenticación (landing page, login, registro, etc.)
  {
    path: '',
    loadComponent: () =>
      import('./layout/app-layout/auth-layout/auth-layout.component').then(
        m => m.AuthLayoutComponent,
      ),
    loadChildren: () =>
      import('./authentication/authentication.routes').then(
        m => m.AUTHENTICATION_ROUTES,
      ),
  },
  // Layout unificado para usuarios autenticados (admin y cliente)
  {
    path: 'app',
    loadComponent: () =>
      import('./layout/app-layout/main-layout/main-layout.component').then(
        m => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Rutas de cliente
      {
        path: '',
        loadChildren: () =>
          import('./client/client.routes').then(m => m.CLIENT_ROUTES),
      },
    ],
  },
  // Rutas de admin
  {
    path: 'admin',
    loadComponent: () =>
      import('./layout/app-layout/main-layout/main-layout.component').then(
        m => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'users-management', pathMatch: 'full' },
      {
        path: '',
        loadChildren: () =>
          import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
      },
    ],
  },
];
