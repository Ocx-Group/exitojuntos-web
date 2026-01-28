import { Routes } from '@angular/router';
import { MaintenanceGuard } from '@app/core/guard/maintenance.guard';

export const AUTHENTICATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./maintenance-page/maintenance-page.component').then(
        m => m.MaintenancePageComponent,
      ),
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./email-verification/email-verification.component').then(
        m => m.EmailVerificationComponent,
      ),
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./signin/signin.component').then(m => m.SigninComponent),
    canActivate: [MaintenanceGuard],
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'signup/:key',
    loadComponent: () =>
      import('./signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'forgot',
    loadComponent: () =>
      import('./forgot/forgot.component').then(m => m.ForgotComponent),
  },
  {
    path: 'reset',
    loadComponent: () =>
      import('./reset/reset.component').then(m => m.ResetComponent),
  },
  {
    path: 'page404',
    loadComponent: () =>
      import('./page404/page404.component').then(m => m.Page404Component),
  },
  {
    path: 'page500',
    loadComponent: () =>
      import('./page500/page500.component').then(m => m.Page500Component),
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./landing-page/landing-page.component').then(
        m => m.LandingPageComponent,
      ),
  },
  {
    path: 'welcome/:key',
    loadComponent: () =>
      import('./landing-page/landing-page.component').then(
        m => m.LandingPageComponent,
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'testimonials',
    loadComponent: () =>
      import('./testimonials/testimonials.component').then(
        m => m.TestimonialsComponent,
      ),
  },
  {
    path: 'terms-conditions',
    loadComponent: () =>
      import('../shared/components/terms-conditions/terms-conditions.component').then(
        m => m.TermsConditionsComponent,
      ),
  },
];
